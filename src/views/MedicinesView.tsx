import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Package, MapPin, TrendingUp, DollarSign, AlertTriangle, ArrowLeft, Calculator, Info, History, FlaskConical, Layers, Boxes } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { useMedicines } from '@/controllers/medicineController';
import type { Medicine } from '@/models/Medicine';
import { User } from '@/models/User';
import { toast } from 'sonner';
import { MedicineHistoryView } from './MedicineHistoryView';
import { MedicineDetailView } from './MedicineDetailView';
import { activityService } from '@/services/activityService';

interface MedicinesViewProps {
  currentUser: User;
}

type ViewMode = 'list' | 'add' | 'edit' | 'history' | 'detail';
type SearchMode = 'name' | 'molecule';

export function MedicinesView({ currentUser }: MedicinesViewProps) {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useMedicines();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [historyMedicine, setHistoryMedicine] = useState<Medicine | null>(null);
  const [detailMedicine, setDetailMedicine] = useState<Medicine | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  const [useWholesale, setUseWholesale] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    moleculeName: '',
    category: '',
    batchNumber: '',
    expirationDate: '',
    quantity: 0,
    purchasePriceWholesale: 0,
    purchasePriceDetail: 0,
    profitMarginPct: 50,
    sellingPrice: 0,
    taxRate: 0,
    finalPrice: 0,
    manufacturer: '',
    location: '',
    description: '',
    // Conditionnement
    packagingType: 'standard' as 'standard' | 'bulk' | 'detail',
    packSize: 0,
    packLabel: '',
    detailOf: '',
    detailSize: 0,
    detailLabel: '',
  });

  // Calcul automatique du prix de vente
  useEffect(() => {
    const basePrice = useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail;
    const calculatedSellingPrice = basePrice * (1 + formData.profitMarginPct / 100);
    const calculatedFinalPrice = calculatedSellingPrice * (1 + formData.taxRate / 100);
    setFormData(prev => ({
      ...prev,
      sellingPrice: parseFloat(calculatedSellingPrice.toFixed(2)),
      finalPrice: parseFloat(calculatedFinalPrice.toFixed(2))
    }));
  }, [formData.purchasePriceWholesale, formData.purchasePriceDetail, formData.profitMarginPct, formData.taxRate, useWholesale]);

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return medicines;
    if (searchMode === 'molecule') {
      return medicines.filter(m =>
        m.moleculeName?.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q)
      );
    }
    return medicines.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.batchNumber.toLowerCase().includes(q) ||
      m.manufacturer?.toLowerCase().includes(q)
    );
  }, [medicines, searchQuery, searchMode]);

  // Grouper par molécule quand recherche par molécule
  const moleculeGroups = useMemo(() => {
    if (searchMode !== 'molecule' || !searchQuery.trim()) return null;
    const groups = new Map<string, Medicine[]>();
    filteredMedicines.forEach(m => {
      const key = m.moleculeName ?? '—';
      const arr = groups.get(key) ?? [];
      arr.push(m);
      groups.set(key, arr);
    });
    return groups;
  }, [filteredMedicines, searchMode, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '', moleculeName: '', category: '', batchNumber: '', expirationDate: '',
      quantity: 0, purchasePriceWholesale: 0, purchasePriceDetail: 0,
      profitMarginPct: 50, sellingPrice: 0, taxRate: 0, finalPrice: 0,
      manufacturer: '', location: '', description: '',
      packagingType: 'standard', packSize: 0, packLabel: '',
      detailOf: '', detailSize: 0, detailLabel: '',
    });
    setUseWholesale(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingMedicine(null);
    setViewMode('add');
  };

  const handleOpenEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    // Convertir l'ancien coefficient multiplicateur (ex: 1.5) en pourcentage (ex: 50)
    const rawMargin = (medicine as any).profitMarginPct ?? (medicine as any).profitMargin;
    const profitMarginPct = rawMargin
      ? rawMargin < 10 ? Math.round((rawMargin - 1) * 100) : rawMargin
      : 50;
    setFormData({
      name: medicine.name,
      moleculeName: medicine.moleculeName || '',
      category: medicine.category,
      batchNumber: medicine.batchNumber || '',
      expirationDate: medicine.expirationDate || '',
      // Pour les articles détail, la qty est calculée côté service – on affiche 0
      quantity: medicine.packagingType === 'detail' ? 0 : medicine.quantity,
      purchasePriceWholesale: (medicine as any).purchasePriceWholesale || 0,
      purchasePriceDetail: (medicine as any).purchasePriceDetail || 0,
      profitMarginPct,
      sellingPrice: (medicine as any).sellingPrice || 0,
      taxRate: (medicine as any).taxRate || 0,
      finalPrice: (medicine as any).finalPrice || medicine.price || 0,
      manufacturer: medicine.manufacturer || '',
      location: medicine.location || '',
      description: medicine.description || '',
      packagingType: medicine.packagingType || 'standard',
      packSize: medicine.packSize || 0,
      packLabel: medicine.packLabel || '',
      detailOf: medicine.detailOf || '',
      detailSize: medicine.detailSize || 0,
      detailLabel: medicine.detailLabel || '',
    });
    setViewMode('edit');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    if (formData.packagingType === 'detail' && (!formData.detailOf || !formData.detailSize)) {
      toast.error('Sélectionnez le produit parent et la taille de l\'unité détail');
      return;
    }
    const data = {
      ...formData,
      price: formData.finalPrice || formData.sellingPrice,
      moleculeName: formData.moleculeName.trim() || undefined,
      // Les articles détail n'ont pas de qty stockée (calculée dynamiquement)
      quantity: formData.packagingType === 'detail' ? 0 : formData.quantity,
    };
    const status: Medicine['status'] =
      data.quantity < 0  ? 'Negative' :
      data.quantity < 20 ? 'Low'      : 'OK';
    if (viewMode === 'add') {
      addMedicine({ ...data, status });
      activityService.log({
        action: 'medicine_add',
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        targetName: data.name,
        detail: `Nouveau médicament ajouté : ${data.name} (${data.quantity} unités, ${data.finalPrice} FCFA)`,
      });
      toast.success('Médicament ajouté avec succès');
    } else if (editingMedicine) {
      updateMedicine(editingMedicine.id, { ...data, status });
      activityService.log({
        action: 'medicine_edit',
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        targetId: editingMedicine.id,
        targetName: editingMedicine.name,
        detail: `Médicament modifié : ${data.name}`,
      });
      toast.success('Médicament modifié avec succès');
    }
    setViewMode('list');
    resetForm();
  };

  const confirmDelete = (medicine: Medicine) => {
    setMedicineToDelete(medicine);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!medicineToDelete) return;
    activityService.log({
      action: 'medicine_delete',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      targetId: medicineToDelete.id,
      targetName: medicineToDelete.name,
      detail: `Médicament supprimé : ${medicineToDelete.name}`,
    });
    deleteMedicine(medicineToDelete.id);
    toast.success('Médicament supprimé');
    setDeleteConfirmOpen(false);
    setMedicineToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-100 text-green-700';
      case 'Low': return 'bg-orange-100 text-orange-700';
      case 'Expiring': return 'bg-yellow-100 text-yellow-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: medicines.length,
    lowStock: medicines.filter(m => m.status === 'Low').length,
    expiring: medicines.filter(m => m.status === 'Expiring').length,
    totalValue: medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0)
  };

  const basePrice = useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail;
  const profitAmount = formData.sellingPrice - basePrice;

  // ─── PAGE DÉTAIL ─────────────────────────────────────────────────────────
  if (viewMode === 'detail' && detailMedicine) {
    return (
      <MedicineDetailView
        medicine={detailMedicine}
        allMedicines={medicines}
        currentUser={currentUser}
        onBack={() => { setDetailMedicine(null); setViewMode('list'); }}
        onUpdate={(id, updates) => {
          updateMedicine(id, updates);
          // Mettre à jour le détailMedicine local avec les nouvelles valeurs
          setDetailMedicine(prev => prev ? { ...prev, ...updates } : null);
        }}
        onViewHistory={(med) => { setHistoryMedicine(med); setViewMode('history'); }}
      />
    );
  }

  // ─── PAGE HISTORIQUE ──────────────────────────────────────────────────────
  if (viewMode === 'history' && historyMedicine) {
    return (
      <MedicineHistoryView
        medicine={historyMedicine}
        onBack={() => { setHistoryMedicine(null); setViewMode('list'); }}
      />
    );
  }

  // ─── PAGE FORMULAIRE (Ajout / Édition) ───────────────────────────────────
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setViewMode('list'); resetForm(); }}
                className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {viewMode === 'add' ? 'Ajouter un médicament' : `Modifier — ${editingMedicine?.name}`}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {viewMode === 'add'
                    ? 'Remplissez les informations pour ajouter un médicament au stock'
                    : 'Modifiez les informations du médicament'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* ── Section 1 : Informations de base ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Info className="w-6 h-6 text-teal-600" />
                </div>
                Informations de base
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <Label className="text-base font-semibold">Nom du médicament *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Doliprane 500mg"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Catégorie *</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Antalgique"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-base font-semibold flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-purple-500" />
                    Principe actif (DCI)
                  </Label>
                  <Input
                    value={formData.moleculeName}
                    onChange={(e) => setFormData({ ...formData, moleculeName: e.target.value })}
                    placeholder="Ex: Paracétamol"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Fabricant</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Ex: Sanofi"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Emplacement</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Rayon A - Étagère 2"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Courte description"
                    className="mt-2 h-12 text-base"
                  />
                </div>
              </div>
            </motion.div>

            {/* ── Section 1.5 : Conditionnement ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Boxes className="w-6 h-6 text-orange-600" />
                </div>
                Conditionnement
              </h3>

              {/* Type de conditionnement */}
              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">Type de conditionnement</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'standard', label: 'Standard', desc: 'Article vendu à l\'unité', icon: Package, color: 'teal' },
                    { value: 'bulk',     label: 'Gros conditionnement', desc: 'Ex : boîte de 1 000', icon: Boxes, color: 'orange' },
                    { value: 'detail',   label: 'Article détail', desc: 'Ex : plaquette de 10', icon: Layers, color: 'indigo' },
                  ] as const).map(opt => {
                    const Icon = opt.icon;
                    const active = formData.packagingType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, packagingType: opt.value })}
                        className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                          active
                            ? opt.color === 'teal'   ? 'border-teal-500 bg-teal-50'
                            : opt.color === 'orange' ? 'border-orange-500 bg-orange-50'
                            : 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${
                          active
                            ? opt.color === 'teal'   ? 'text-teal-600'
                            : opt.color === 'orange' ? 'text-orange-600'
                            : 'text-indigo-600'
                            : 'text-gray-400'
                        }`} />
                        <div>
                          <p className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champs Gros conditionnement */}
              {formData.packagingType === 'bulk' && (
                <div className="grid grid-cols-2 gap-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div>
                    <Label className="text-base font-semibold">Unités de base par colis</Label>
                    <p className="text-xs text-gray-500 mb-2">Ex : 1000 (gélules par boîte)</p>
                    <Input
                      type="number" min="1"
                      value={formData.packSize || ''}
                      onChange={(e) => setFormData({ ...formData, packSize: parseInt(e.target.value) || 0 })}
                      placeholder="1000"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Libellé du colis</Label>
                    <p className="text-xs text-gray-500 mb-2">Ex : boîte, carton, sachet</p>
                    <Input
                      value={formData.packLabel}
                      onChange={(e) => setFormData({ ...formData, packLabel: e.target.value })}
                      placeholder="boîte"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              )}

              {/* Champs Article détail */}
              {formData.packagingType === 'detail' && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Produit parent (gros conditionnement)</Label>
                    <p className="text-xs text-gray-500 mb-2">Sélectionnez le produit en gros dont cet article est issu</p>
                    <select
                      value={formData.detailOf}
                      onChange={(e) => setFormData({ ...formData, detailOf: e.target.value })}
                      className="w-full h-12 text-base rounded-lg border-2 border-gray-200 px-3 bg-white focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="">— Choisir le produit parent —</option>
                      {medicines
                        .filter(m => m.packagingType === 'bulk' && m.id !== editingMedicine?.id)
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.quantity} unités en stock)
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold">Unités de base par article détail</Label>
                      <p className="text-xs text-gray-500 mb-2">Ex : 10 (gélules par plaquette)</p>
                      <Input
                        type="number" min="1"
                        value={formData.detailSize || ''}
                        onChange={(e) => setFormData({ ...formData, detailSize: parseInt(e.target.value) || 0 })}
                        placeholder="10"
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Libellé de l'article</Label>
                      <p className="text-xs text-gray-500 mb-2">Ex : plaquette, tube, sachet</p>
                      <Input
                        value={formData.detailLabel}
                        onChange={(e) => setFormData({ ...formData, detailLabel: e.target.value })}
                        placeholder="plaquette"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                  {formData.detailOf && formData.detailSize > 0 && (() => {
                    const parent = medicines.find(m => m.id === formData.detailOf);
                    if (!parent) return null;
                    const computed = Math.floor(parent.quantity / formData.detailSize);
                    return (
                      <div className="bg-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-800">
                        Stock calculé automatiquement : <strong>{computed} {formData.detailLabel || 'unités'}</strong>
                        {' '}(sur {parent.quantity} unités dans «{parent.name}»)
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>

            {/* ── Section 2 : Stock et traçabilité ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                Stock et traçabilité
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label className="text-base font-semibold">N° de lot</Label>
                  <Input
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="Ex: LOT2024-001"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Date d'expiration</Label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  {formData.packagingType === 'detail' ? (
                    <>
                      <Label className="text-base font-semibold text-indigo-700">Quantité (auto)</Label>
                      <div className="mt-2 h-12 flex items-center px-4 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-medium text-base">
                        Calculée depuis le parent
                      </div>
                      <p className="text-xs text-indigo-500 mt-1">Dérivée du stock du gros conditionnement</p>
                    </>
                  ) : (
                    <>
                      <Label className="text-base font-semibold">
                        {formData.packagingType === 'bulk'
                          ? `Quantité en stock (unités de base)`
                          : 'Quantité en stock'}
                      </Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        className="mt-2 h-12 text-base"
                      />
                      {formData.packagingType === 'bulk' && formData.packSize > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ≈ {(formData.quantity / formData.packSize).toFixed(1)} {formData.packLabel || 'colis'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Section 3 : Prix et marges ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Calculator className="w-6 h-6 text-teal-600" />
                </div>
                Gestion des prix et marges
              </h3>

              {/* Prix d'achat */}
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <Label className="text-base font-semibold">Prix d'achat en gros (FCFA)</Label>
                  <Input
                    type="number" step="1" min="0"
                    value={formData.purchasePriceWholesale}
                    onChange={(e) => setFormData({ ...formData, purchasePriceWholesale: parseFloat(e.target.value) || 0 })}
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold">Prix d'achat au détail (FCFA)</Label>
                  <Input
                    type="number" step="1" min="0"
                    value={formData.purchasePriceDetail}
                    onChange={(e) => setFormData({ ...formData, purchasePriceDetail: parseFloat(e.target.value) || 0 })}
                    className="mt-2 h-12 text-base"
                  />
                </div>
              </div>

              {/* Base de calcul */}
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-semibold text-gray-600">Base utilisée pour le calcul du prix de vente</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setUseWholesale(true)}
                    className={`flex-1 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      useWholesale
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                    }`}
                  >
                    Utiliser le prix gros
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseWholesale(false)}
                    className={`flex-1 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                      !useWholesale
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                    }`}
                  >
                    Utiliser le prix détail
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-semibold">Marge bénéficiaire (%)</Label>
                  <div className="flex gap-3 mt-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        type="number" step="1" min="0" max="500"
                        value={formData.profitMarginPct}
                        onChange={(e) => setFormData({ ...formData, profitMarginPct: parseFloat(e.target.value) || 0 })}
                        className="h-12 text-base pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">%</span>
                    </div>
                    <Button
                      type="button" variant="outline"
                      onClick={() => setFormData({ ...formData, profitMarginPct: 50 })}
                      className="whitespace-nowrap h-12 px-4 text-sm shrink-0"
                    >
                      Défaut (50%)
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1.5">
                    Prix vente = Prix achat × (1 + marge / 100)
                  </p>
                </div>
                <div>
                  <Label className="text-base font-semibold">Taux de taxe (%)</Label>
                  <div className="flex gap-3 mt-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        type="number" step="0.1" min="0" max="100"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                        className="h-12 text-base pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">%</span>
                    </div>
                    <Button
                      type="button" variant="outline"
                      onClick={() => setFormData({ ...formData, taxRate: 0 })}
                      className="whitespace-nowrap h-12 px-4 text-sm shrink-0"
                    >
                      0% (Exonéré)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  Récapitulatif des prix
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-gray-600">Prix d'achat ({useWholesale ? 'gros' : 'détail'}) :</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {basePrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-gray-600">Marge ({formData.profitMarginPct}%) :</span>
                    <span className="text-sm font-semibold text-teal-700">
                      +{profitAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Prix de vente HT :</span>
                    <span className="text-base font-bold text-gray-900">
                      {formData.sellingPrice.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  {formData.taxRate > 0 && (
                    <>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-sm text-gray-600">Taxe ({formData.taxRate}%) :</span>
                        <span className="text-sm font-semibold text-gray-700">
                          +{(formData.finalPrice - formData.sellingPrice).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">Prix de vente TTC :</span>
                        <span className="text-lg font-bold text-teal-600">
                          {formData.finalPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Bénéfice unitaire :</span>
                    <div className="text-right">
                      <div className="text-base font-bold text-teal-700">
                        +{profitAmount.toLocaleString('fr-FR')} FCFA
                      </div>
                      <div className="text-xs text-gray-400">
                        {formData.profitMarginPct}% de marge
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Footer fixe */}
        <div className="sticky bottom-0 z-10 bg-gray-50 border-t border-gray-200 px-8 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-500">* Champs obligatoires</p>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => { setViewMode('list'); resetForm(); }}>
                Annuler
              </Button>
              <Button size="lg" onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700 px-8">
                {viewMode === 'add' ? '✓ Ajouter le médicament' : '✓ Enregistrer les modifications'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PAGE LISTE ───────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">

      {/* Header avec stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Médicaments</h1>
            <p className="text-sm text-gray-600 mt-1">{medicines.length} médicament(s) en stock</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un médicament
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-teal-700">Total Produits</p>
                <p className="text-2xl font-bold text-teal-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-700">Stock Bas</p>
                <p className="text-2xl font-bold text-orange-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-yellow-700">Bientôt expirés</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.expiring}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700">Valeur Stock</p>
                <p className="text-lg font-bold text-blue-900">
                  {stats.totalValue.toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barre de recherche */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex gap-3 items-center">
          {/* Toggle nom / molécule */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
            <button
              onClick={() => setSearchMode('name')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${searchMode === 'name' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Nom
            </button>
            <button
              onClick={() => setSearchMode('molecule')}
              className={`px-3 py-2 text-xs font-medium flex items-center gap-1 transition-colors ${searchMode === 'molecule' ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <FlaskConical className="w-3 h-3" /> Molécule
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchMode === 'molecule' ? 'Rechercher par principe actif (ex: Paracétamol)...' : 'Rechercher par nom, catégorie, fabricant, lot...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border border-gray-200"
            />
          </div>
        </div>
        {/* Résultat groupé par molécule */}
        {moleculeGroups && moleculeGroups.size > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-purple-500" />
              {moleculeGroups.size} molécule{moleculeGroups.size > 1 ? 's' : ''} trouvée{moleculeGroups.size > 1 ? 's' : ''} · {filteredMedicines.length} produit{filteredMedicines.length > 1 ? 's' : ''}
            </p>
            {Array.from(moleculeGroups.entries()).map(([molecule, meds]) => meds.length > 1 && (
              <div key={molecule} className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-1">
                <FlaskConical className="w-3 h-3 shrink-0" />
                <span><strong>{molecule}</strong> — {meds.length} équivalents : {meds.map(m => m.brandName ?? m.name).join(', ')}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">N° Lot</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prix Unit.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valeur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Emplacement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Aucun médicament trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((medicine, index) => (
                    <motion.tr
                      key={medicine.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => { setDetailMedicine(medicine); setViewMode('detail'); }}
                          className="flex items-center gap-3 text-left hover:underline decoration-teal-400"
                        >
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900">{medicine.name}</p>
                              {medicine.packagingType === 'bulk' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                  <Boxes className="w-3 h-3" />
                                  {medicine.packLabel || 'Gros cond.'}
                                  {medicine.packSize ? ` ×${medicine.packSize}` : ''}
                                </span>
                              )}
                              {medicine.packagingType === 'detail' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                  <Layers className="w-3 h-3" />
                                  {medicine.detailLabel || 'Détail'}
                                  {medicine.detailSize ? ` ×${medicine.detailSize}` : ''}
                                </span>
                              )}
                            </div>
                            {medicine.moleculeName && (
                              <p className="text-xs text-purple-600 flex items-center gap-0.5">
                                <FlaskConical className="w-3 h-3" />{medicine.moleculeName}
                              </p>
                            )}
                            {!medicine.moleculeName && (
                              <p className="text-xs text-gray-500">{medicine.manufacturer || '-'}</p>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medicine.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medicine.batchNumber || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medicine.expirationDate || '-'}</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`text-sm font-medium ${medicine.quantity < 0 ? 'text-red-600' : medicine.quantity < 20 ? 'text-orange-600' : 'text-gray-900'}`}>
                            {medicine.quantity}
                            {medicine.packagingType === 'detail' && medicine.detailLabel
                              ? ` ${medicine.detailLabel}s`
                              : medicine.packagingType === 'bulk'
                              ? ' unités'
                              : ''}
                            {medicine.quantity < 0 && <span className="ml-1 text-xs text-red-500">⚠</span>}
                          </span>
                          {medicine.packagingType === 'bulk' && medicine.packSize && medicine.packSize > 0 && (
                            <p className="text-xs text-orange-500">
                              ≈ {(medicine.quantity / medicine.packSize).toFixed(1)} {medicine.packLabel || 'colis'}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {medicine.price.toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-teal-700">
                        {(medicine.price * medicine.quantity).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-6 py-4">
                        {medicine.location ? (
                          <div className="flex items-center gap-1 text-sm text-teal-700">
                            <MapPin className="w-3 h-3" />
                            <span>{medicine.location}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(medicine.status)}`}>
                          {medicine.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setHistoryMedicine(medicine); setViewMode('history'); }}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            title="Voir l'historique"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => handleOpenEdit(medicine)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => confirmDelete(medicine)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal confirmation suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-3">Êtes-vous sûr de vouloir supprimer ce médicament ?</p>
            {medicineToDelete && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{medicineToDelete.name}</p>
                    <p className="text-sm text-gray-600">{medicineToDelete.category}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cette action est irréversible !
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setMedicineToDelete(null); }}>
              Annuler
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}