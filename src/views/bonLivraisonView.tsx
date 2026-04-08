import { useState } from 'react';
import { 
  Plus, Search, FileText, Eye, Edit, Trash2, X, AlertTriangle,
  CheckCircle, Clock, Package, Truck, Calendar, FileCheck,
  TrendingDown, User2, ArrowLeft, Save, Minus, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useBonLivraison } from '@/controllers/bonLivraisonController';
import type { User } from '@/models/User';
import { toast } from 'sonner';
import { BonLivraison, BonLivraisonItem } from '@/models/bonLivraison';

interface BonLivraisonViewProps {
  currentUser: User | null;
}

type ViewMode = 'list' | 'add' | 'edit' | 'details' | 'compare';

export function BonLivraisonView({ currentUser }: BonLivraisonViewProps) {
  const { 
    bls, 
    loading,
    create,
    update,
    deleteBL,
    verify,
    validate,
    compareWithOrder,
    generateBLNumber,
    getStats
  } = useBonLivraison();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BonLivraison['status']>('all');
  const [selectedBL, setSelectedBL] = useState<BonLivraison | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    blNumber: '',
    supplierName: '',
    supplierId: '',
    supplierOrderNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryPerson: '',
    items: [] as BonLivraisonItem[],
    notes: '',
    status: 'En attente' as BonLivraison['status']
  });

  const stats = getStats();

  const filteredBLs = bls.filter(bl => {
    const matchesSearch = searchQuery === '' ||
      bl.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bl.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || bl.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: BonLivraison['status']) => {
    switch (status) {
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'Vérifié': return 'bg-blue-100 text-blue-700';
      case 'Validé': return 'bg-green-100 text-green-700';
      case 'Litige': return 'bg-red-100 text-red-700';
      case 'Archivé': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: BonLivraison['status']) => {
    switch (status) {
      case 'En attente': return Clock;
      case 'Vérifié': return Eye;
      case 'Validé': return CheckCircle;
      case 'Litige': return AlertTriangle;
      case 'Archivé': return Package;
      default: return FileText;
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          medicineId: `MED${Date.now()}`,
          medicineName: '',
          quantityOrdered: 0,
          quantityReceived: 0,
          unitPrice: 0,
          batchNumber: '',
          expirationDate: undefined,
          discrepancy: 0
        }
      ]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: keyof BonLivraisonItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculer l'écart automatiquement
    if (field === 'quantityOrdered' || field === 'quantityReceived') {
      newItems[index].discrepancy = newItems[index].quantityReceived - newItems[index].quantityOrdered;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = () => {
    if (!formData.blNumber || !formData.supplierName || formData.items.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantityReceived * item.unitPrice), 0
    );

    const blData = {
      blNumber: formData.blNumber,
      supplierId: formData.supplierId || `SUP${Date.now()}`,
      supplierName: formData.supplierName,
      supplierOrderNumber: formData.supplierOrderNumber || undefined,
      deliveryDate: new Date(formData.deliveryDate),
      deliveryPerson: formData.deliveryPerson || undefined,
      items: formData.items,
      subtotal,
      tax: 0,
      totalAmount: subtotal,
      status: formData.status,
      notes: formData.notes || undefined
    };

    if (viewMode === 'add') {
      create(blData);
      toast.success('Bon de livraison créé avec succès');
    } else if (viewMode === 'edit' && selectedBL) {
      update(selectedBL.id, blData);
      toast.success('Bon de livraison modifié avec succès');
    }

    resetForm();
    setViewMode('list');
  };

  const resetForm = () => {
    setFormData({
      blNumber: generateBLNumber(),
      supplierName: '',
      supplierId: '',
      supplierOrderNumber: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryPerson: '',
      items: [],
      notes: '',
      status: 'En attente'
    });
  };

  const handleEdit = (bl: BonLivraison) => {
    setSelectedBL(bl);
    setFormData({
      blNumber: bl.blNumber,
      supplierName: bl.supplierName,
      supplierId: bl.supplierId,
      supplierOrderNumber: bl.supplierOrderNumber || '',
      deliveryDate: new Date(bl.deliveryDate).toISOString().split('T')[0],
      deliveryPerson: bl.deliveryPerson || '',
      items: bl.items,
      notes: bl.notes || '',
      status: bl.status
    });
    setViewMode('edit');
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce BL ?')) {
      deleteBL(id);
      toast.success('BL supprimé');
    }
  };

  const handleViewDetails = (bl: BonLivraison) => {
    setSelectedBL(bl);
    setViewMode('details');
  };

  const handleCompare = (bl: BonLivraison) => {
    setSelectedBL(bl);
    if (bl.supplierOrderId) {
      const comparison = compareWithOrder(bl.id, bl.supplierOrderId);
      setComparisonData(comparison);
    }
    setViewMode('compare');
  };

  const handleVerify = (id: string) => {
    verify(id, currentUser?.fullName || 'Unknown');
    toast.success('BL vérifié');
  };

  const handleValidate = (id: string) => {
    validate(id, currentUser?.fullName || 'Unknown');
    toast.success('BL validé');
  };

  // ═══════════════════════════════════════════════════════════════
  // VUE DÉTAILS
  // ═══════════════════════════════════════════════════════════════
  if (viewMode === 'details' && selectedBL) {
    const StatusIcon = getStatusIcon(selectedBL.status);
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('list')}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedBL.blNumber}</h1>
                <p className="text-sm text-gray-500">
                  Livré le {new Date(selectedBL.deliveryDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBL.status)}`}>
              <StatusIcon className="w-4 h-4 inline mr-1" />
              {selectedBL.status}
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          {/* Infos fournisseur */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-2">Fournisseur</p>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <p className="font-bold text-gray-900">{selectedBL.supplierName}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-2">Livreur</p>
              <div className="flex items-center gap-2">
                <User2 className="w-5 h-5 text-blue-600" />
                <p className="font-bold text-gray-900">{selectedBL.deliveryPerson || '—'}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-2">N° Commande</p>
              <p className="font-bold text-gray-900">{selectedBL.supplierOrderNumber || '—'}</p>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900">Articles reçus ({selectedBL.items.length})</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Médicament</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Commandé</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Reçu</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Écart</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Prix unit.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Lot / Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedBL.items.map((item, i) => (
                  <tr key={i} className={(item.discrepancy !== undefined && item.discrepancy !== 0) ? 'bg-orange-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600" />
                        <span className="font-medium text-gray-900">{item.medicineName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">{item.quantityOrdered}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">{item.quantityReceived}</td>
                    <td className="px-6 py-4 text-center">
                      {item.discrepancy !== undefined && item.discrepancy !== 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.discrepancy > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{item.unitPrice.toLocaleString('fr-FR')} F</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {(item.quantityReceived * item.unitPrice).toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.batchNumber && <div>Lot: {item.batchNumber}</div>}
                      {item.expirationDate && (
                        <div className="text-xs">
                          Exp: {typeof item.expirationDate === 'string' 
                            ? item.expirationDate 
                            : new Date(item.expirationDate).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right font-bold text-gray-900">Total</td>
                  <td className="px-6 py-4 text-right text-xl font-bold text-teal-600">
                    {selectedBL.totalAmount.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {selectedBL.notes && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" /> Notes
              </h3>
              <p className="text-blue-800">{selectedBL.notes}</p>
            </div>
          )}

          {/* Historique */}
          {selectedBL.verifiedBy && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Historique</h3>
              <div className="space-y-2 text-sm">
                {selectedBL.verifiedBy && (
                  <p>✓ Vérifié par <strong>{selectedBL.verifiedBy}</strong> le{' '}
                    {selectedBL.verifiedAt && new Date(selectedBL.verifiedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {selectedBL.validatedBy && (
                  <p>✓ Validé par <strong>{selectedBL.validatedBy}</strong> le{' '}
                    {selectedBL.validatedAt && new Date(selectedBL.validatedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE COMPARAISON
  // ═══════════════════════════════════════════════════════════════
  if (viewMode === 'compare' && selectedBL && comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('list')}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Comparaison BL / Commande</h1>
                <p className="text-sm text-gray-500">{selectedBL.blNumber} vs {selectedBL.supplierOrderNumber}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              comparisonData.matchStatus === 'Parfait' ? 'bg-green-100 text-green-700' :
              comparisonData.matchStatus === 'Écarts mineurs' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {comparisonData.matchStatus}
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Médicament</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Commandé</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Reçu</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.itemsComparison.map((comp: any, i: number) => (
                  <tr key={i} className={
                    comp.status === 'OK' ? '' :
                    comp.status === 'Moins' ? 'bg-red-50' :
                    comp.status === 'Plus' ? 'bg-blue-50' :
                    'bg-gray-50'
                  }>
                    <td className="px-6 py-4 font-medium text-gray-900">{comp.medicineName}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{comp.quantityOrdered}</td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">{comp.quantityReceived}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        comp.status === 'OK' ? 'bg-green-100 text-green-700' :
                        comp.status === 'Moins' ? 'bg-red-100 text-red-700' :
                        comp.status === 'Plus' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {comp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE AJOUT/ÉDITION
  // ═══════════════════════════════════════════════════════════════
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setViewMode('list'); resetForm(); }}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {viewMode === 'add' ? 'Nouveau bon de livraison' : 'Modifier le BL'}
                </h1>
                <p className="text-sm text-gray-500">
                  {viewMode === 'add' ? 'Enregistrez la réception de marchandises' : formData.blNumber}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setViewMode('list'); resetForm(); }}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          {/* Section 1 : Informations générales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Informations générales</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>N° BL *</Label>
                <Input
                  value={formData.blNumber}
                  onChange={(e) => setFormData({ ...formData, blNumber: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Fournisseur *</Label>
                <Input
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  placeholder="Nom du fournisseur"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>N° Commande fournisseur</Label>
                <Input
                  value={formData.supplierOrderNumber}
                  onChange={(e) => setFormData({ ...formData, supplierOrderNumber: e.target.value })}
                  placeholder="Optionnel"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Date de livraison *</Label>
                <Input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Livreur</Label>
                <Input
                  value={formData.deliveryPerson}
                  onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                  placeholder="Nom du livreur"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2 : Articles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Articles ({formData.items.length})</h2>
              <Button onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un article
              </Button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun article ajouté</p>
                <Button onClick={handleAddItem} variant="outline" size="sm" className="mt-3">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le premier article
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Nom du médicament *</Label>
                        <Input
                          value={item.medicineName}
                          onChange={(e) => handleItemChange(index, 'medicineName', e.target.value)}
                          placeholder="Ex: Paracétamol 500mg"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qté commandée</Label>
                        <Input
                          type="number"
                          value={item.quantityOrdered}
                          onChange={(e) => handleItemChange(index, 'quantityOrdered', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Qté reçue *</Label>
                        <Input
                          type="number"
                          value={item.quantityReceived}
                          onChange={(e) => handleItemChange(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Prix unitaire (FCFA)</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Écart</Label>
                        <div className={`mt-1 px-3 py-2 rounded-md text-center font-bold ${
                          !item.discrepancy || item.discrepancy === 0 ? 'bg-gray-100 text-gray-600' :
                          item.discrepancy > 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.discrepancy && item.discrepancy > 0 ? '+' : ''}{item.discrepancy || 0}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">N° Lot</Label>
                        <Input
                          value={item.batchNumber}
                          onChange={(e) => handleItemChange(index, 'batchNumber', e.target.value)}
                          placeholder="LOT2024-001"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Date d'expiration</Label>
                        <Input
                          type="date"
                          value={item.expirationDate ? (typeof item.expirationDate === 'string' ? item.expirationDate : new Date(item.expirationDate).toISOString().split('T')[0]) : ''}
                          onChange={(e) => handleItemChange(index, 'expirationDate', e.target.value ? new Date(e.target.value) : undefined)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <div className="mt-1 px-3 py-2 bg-teal-50 rounded-md font-bold text-teal-700 text-center">
                          {(item.quantityReceived * item.unitPrice).toLocaleString('fr-FR')} F
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total général</span>
                  <span className="text-2xl font-bold text-teal-600">
                    {formData.items.reduce((sum, item) => sum + (item.quantityReceived * item.unitPrice), 0).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3 : Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Notes (optionnel)</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ajoutez des remarques sur cette livraison..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VUE LISTE (suite du code précédent)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bons de Livraison</h1>
            <p className="text-sm text-gray-600 mt-1">{bls.length} bon(s) enregistré(s)</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setViewMode('add');
            }}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau BL
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vérifiés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verifie}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Validés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.valide}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Litiges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.litige}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avec écarts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withDiscrepancies}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par numéro BL, fournisseur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              Tous
            </Button>
            <Button
              variant={filterStatus === 'En attente' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('En attente')}
              size="sm"
            >
              En attente
            </Button>
            <Button
              variant={filterStatus === 'Vérifié' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('Vérifié')}
              size="sm"
            >
              Vérifiés
            </Button>
            <Button
              variant={filterStatus === 'Validé' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('Validé')}
              size="sm"
            >
              Validés
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Liste des BLs */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {filteredBLs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun bon de livraison trouvé</p>
            </div>
          ) : (
            filteredBLs.map((bl, index) => {
              const StatusIcon = getStatusIcon(bl.status);
              return (
                <motion.div
                  key={bl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{bl.blNumber}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bl.status)}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {bl.status}
                        </span>
                        {bl.hasDiscrepancies && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            Écarts détectés
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <Truck className="w-4 h-4 inline mr-1" />
                        {bl.supplierName}
                      </p>
                      {bl.supplierOrderNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Commande: {bl.supplierOrderNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(bl.deliveryDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-lg font-bold text-teal-600 mt-1">
                        {bl.totalAmount.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Package className="w-4 h-4" />
                    <span>{bl.items.length} article(s)</span>
                    {bl.deliveryPerson && (
                      <>
                        <span className="mx-2">•</span>
                        <User2 className="w-4 h-4" />
                        <span>{bl.deliveryPerson}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(bl)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                    {bl.supplierOrderNumber && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompare(bl)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Comparer
                      </Button>
                    )}
                    {bl.status === 'En attente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(bl.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Vérifier
                      </Button>
                    )}
                    {bl.status === 'Vérifié' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidate(bl.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Valider
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(bl)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(bl.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}