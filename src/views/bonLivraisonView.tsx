import { useState } from 'react';
import { 
  Plus, Search, FileText, Eye, Edit, Trash2, X, AlertTriangle,
  CheckCircle, Clock, Package, Truck, Calendar,  FileCheck,
  TrendingDown, User2
} from 'lucide-react';
import { motion,  } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
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
          medicineId: '',
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
    // Pour l'exemple, on simule une comparaison
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

  // Vue Liste
  if (viewMode === 'list') {
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
        </div>
      </div>
    );
  }

  // Vue Ajout/Édition sera dans la suite...
  return <div>Vue {viewMode} en cours de développement...</div>;
}