import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, Clock, AlertTriangle, DollarSign, Plus, Search, X, Calendar,
  User, Building2, Package, RotateCcw, CheckCircle, Trash2, ChevronDown,
  Tag, FileText, BarChart2, ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import type { User as UserType } from '@/models/User';
import type { ProductTracking, TrackingStatus } from '@/models/ProductTracking';
import { productTrackingService } from '@/services/productTrackingService';
import { medicineService } from '@/services/medicineService';
import { retourService } from '@/services/retourService';
import type { RetourReason } from '@/models/bonLivraison';

interface ProductTrackingViewProps {
  currentUser: UserType | null;
}

type FilterTab = 'all' | 'active' | 'soon' | 'overdue' | 'closed';

const STATUS_CONFIG: Record<TrackingStatus, { label: string; bg: string; text: string; dot: string }> = {
  'En suivi':               { label: 'En suivi',                bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  'Retourné partiellement': { label: 'Retour partiel',          bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Retourné totalement':    { label: 'Retourné',                bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500' },
  'Vendu':                  { label: 'Vendu',                   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  'Expiré':                 { label: 'Délai expiré',            bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const RETOUR_REASONS: RetourReason[] = [
  'Périmé', 'Endommagé', 'Erreur de commande', 'Qualité insuffisante', 'Autre'
];

function daysRemaining(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = daysRemaining(deadline);
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" />
        Délai dépassé de {Math.abs(days)}j
      </span>
    );
  }
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <Clock className="w-3 h-3" />
      {days}j restants
    </span>
  );
  if (days <= 14) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" />
      {days}j restants
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <Clock className="w-3 h-3" />
      {days}j restants
    </span>
  );
}

export function ProductTrackingView({ currentUser }: ProductTrackingViewProps) {
  const [trackings, setTrackings] = useState<ProductTracking[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [medResults, setMedResults] = useState<ReturnType<typeof medicineService.search>>([]);
  const [formData, setFormData] = useState({
    medicineId: '',
    medicineName: '',
    supplierName: '',
    delegateName: '',
    blNumber: '',
    entryDate: new Date().toISOString().slice(0, 10),
    returnDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    initialQuantity: 1,
    unitCost: 0,
    sellingPrice: 0,
    notes: '',
  });

  // Return dialog
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<ProductTracking | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState<RetourReason>('Erreur de commande');
  const [returnNotes, setReturnNotes] = useState('');

  // Close dialog
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<ProductTracking | null>(null);
  const [closeReason, setCloseReason] = useState<'Vendu' | 'Expiré'>('Vendu');

  const refresh = useCallback(() => {
    setTrackings(productTrackingService.list());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Medicine search for add form
  useEffect(() => {
    if (medSearch.trim().length >= 2) {
      setMedResults(medicineService.search(medSearch).slice(0, 8));
    } else {
      setMedResults([]);
    }
  }, [medSearch]);

  // Stats
  const stats = useMemo(() => {
    return productTrackingService.getStats(id => medicineService.getById(id)?.quantity ?? 0);
  }, [trackings]);

  // Live stock + derived quantities per tracking
  const getLiveStock = (t: ProductTracking) => medicineService.getById(t.medicineId)?.quantity ?? 0;
  const getRemaining = (t: ProductTracking) => Math.max(0, getLiveStock(t) - t.quantityReturned);
  const getSold = (t: ProductTracking) => Math.max(0, t.initialQuantity - t.quantityReturned - getLiveStock(t));

  // Filter logic
  const filtered = useMemo(() => {
    const today = Date.now();
    return trackings.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.medicineName.toLowerCase().includes(q) &&
            !t.supplierName.toLowerCase().includes(q) &&
            !(t.delegateName ?? '').toLowerCase().includes(q) &&
            !t.trackingNumber.toLowerCase().includes(q)) return false;
      }
      const isActive = t.status === 'En suivi' || t.status === 'Retourné partiellement';
      const days = daysRemaining(t.returnDeadline);
      switch (filter) {
        case 'active':  return isActive;
        case 'soon':    return isActive && days >= 0 && days <= 7;
        case 'overdue': return isActive && days < 0;
        case 'closed':  return !isActive;
        default:        return true;
      }
    });
  }, [trackings, filter, searchQuery]);

  // --- Handlers ---

  function selectMedicine(med: ReturnType<typeof medicineService.search>[0]) {
    setFormData(f => ({
      ...f,
      medicineId: med.id,
      medicineName: med.name,
      sellingPrice: med.price,
    }));
    setMedSearch(med.name);
    setMedResults([]);
  }

  function resetAddForm() {
    setFormData({
      medicineId: '', medicineName: '', supplierName: '', delegateName: '',
      blNumber: '',
      entryDate: new Date().toISOString().slice(0, 10),
      returnDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      initialQuantity: 1, unitCost: 0, sellingPrice: 0, notes: '',
    });
    setMedSearch('');
    setMedResults([]);
  }

  function handleAdd() {
    if (!formData.medicineId) { toast.error('Sélectionnez un médicament'); return; }
    if (!formData.supplierName.trim()) { toast.error('Le fournisseur est requis'); return; }
    if (formData.initialQuantity < 1) { toast.error('La quantité doit être ≥ 1'); return; }
    if (!formData.returnDeadline) { toast.error('La date limite de retour est requise'); return; }

    productTrackingService.create({
      medicineId: formData.medicineId,
      medicineName: formData.medicineName,
      supplierName: formData.supplierName.trim(),
      delegateName: formData.delegateName.trim() || undefined,
      blNumber: formData.blNumber.trim() || undefined,
      entryDate: formData.entryDate,
      returnDeadline: formData.returnDeadline,
      initialQuantity: formData.initialQuantity,
      quantityReturned: 0,
      unitCost: formData.unitCost,
      sellingPrice: formData.sellingPrice,
      status: 'En suivi',
      notes: formData.notes.trim() || undefined,
      createdBy: currentUser?.fullName,
    });
    toast.success('Suivi créé avec succès');
    setIsAddOpen(false);
    resetAddForm();
    refresh();
  }

  function openReturn(t: ProductTracking) {
    setReturnTarget(t);
    setReturnQty(Math.max(1, getRemaining(t)));
    setReturnReason('Erreur de commande');
    setReturnNotes('');
    setIsReturnOpen(true);
  }

  function handleReturn() {
    if (!returnTarget) return;
    const remaining = getRemaining(returnTarget);
    if (returnQty < 1 || returnQty > remaining) {
      toast.error(`Quantité invalide (max: ${remaining})`);
      return;
    }
    // Create retour fournisseur
    retourService.create({
      supplierName: returnTarget.supplierName,
      supplierId: returnTarget.supplierId,
      blNumber: returnTarget.blNumber,
      blId: returnTarget.blId,
      returnDate: new Date().toISOString().slice(0, 10),
      items: [{
        medicineId: returnTarget.medicineId,
        medicineName: returnTarget.medicineName,
        quantity: returnQty,
        unitPrice: returnTarget.unitCost,
        reason: returnReason,
        totalAmount: returnQty * returnTarget.unitCost,
        notes: returnNotes || undefined,
      }],
      totalAmount: returnQty * returnTarget.unitCost,
      status: 'En attente',
      notes: returnNotes || undefined,
      createdBy: currentUser?.fullName,
    });
    // Update tracking
    productTrackingService.addReturn(returnTarget.id, returnQty);
    toast.success(`Retour de ${returnQty} unité(s) enregistré`);
    setIsReturnOpen(false);
    setReturnTarget(null);
    refresh();
  }

  function openClose(t: ProductTracking) {
    setCloseTarget(t);
    setCloseReason(daysRemaining(t.returnDeadline) < 0 ? 'Expiré' : 'Vendu');
    setIsCloseOpen(true);
  }

  function handleClose() {
    if (!closeTarget) return;
    productTrackingService.close(closeTarget.id, closeReason);
    toast.success(`Suivi clôturé — statut: ${closeReason}`);
    setIsCloseOpen(false);
    setCloseTarget(null);
    refresh();
  }

  function handleDelete(t: ProductTracking) {
    if (!confirm(`Supprimer le suivi ${t.trackingNumber} ?\nCette action est irréversible.`)) return;
    productTrackingService.delete(t.id);
    toast.success('Suivi supprimé');
    refresh();
  }

  const filterTabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'all',     label: 'Tous',           count: trackings.length },
    { id: 'active',  label: 'En suivi',       count: stats.active },
    { id: 'soon',    label: 'Délai < 7j',     count: stats.expiringSoon },
    { id: 'overdue', label: 'Retour urgent',  count: stats.overdueWithStock },
    { id: 'closed',  label: 'Clôturés' },
  ];

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi nouveaux produits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivez les ventes des nouvelles références et gérez les retours dans les délais accordés
          </p>
        </div>
        <Button onClick={() => { resetAddForm(); setIsAddOpen(true); }} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau suivi
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'En suivi',           value: stats.active,         icon: TrendingUp,    color: 'text-violet-600', bg: 'bg-violet-100' },
          { label: 'Délai < 7 jours',    value: stats.expiringSoon,   icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-100' },
          { label: 'Retour urgent',       value: stats.overdueWithStock, icon: AlertTriangle, color: 'text-red-600',  bg: 'bg-red-100' },
          { label: 'Valeur en stock',     value: `${stats.stockValue.toLocaleString('fr-FR')} F`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <div className={`w-11 h-11 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    filter === tab.id ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher produit, fournisseur, délégué..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cards grid */}
        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun suivi trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Créez un nouveau suivi pour commencer</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map((t, i) => {
                  const liveStock = getLiveStock(t);
                  const sold = getSold(t);
                  const remaining = getRemaining(t);
                  const soldPct = t.initialQuantity > 0 ? (sold / t.initialQuantity) * 100 : 0;
                  const days = daysRemaining(t.returnDeadline);
                  const sc = STATUS_CONFIG[t.status];
                  const isActive = t.status === 'En suivi' || t.status === 'Retourné partiellement';
                  const revenue = sold * t.sellingPrice;
                  const investment = t.initialQuantity * t.unitCost;

                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`border rounded-xl p-5 bg-white shadow-sm ${
                        isActive && days < 0 ? 'border-red-200' :
                        isActive && days <= 7 ? 'border-amber-200' :
                        'border-gray-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                            <span className="text-xs text-gray-400">{t.trackingNumber}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{t.medicineName}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Building2 className="w-3 h-3" />{t.supplierName}
                            </span>
                            {t.delegateName && (
                              <span className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                                <User className="w-3 h-3" />{t.delegateName}
                              </span>
                            )}
                            {t.blNumber && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <FileText className="w-3 h-3" />{t.blNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <DeadlineBadge deadline={t.returnDeadline} />
                      </div>

                      {/* Progress bar ventes */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progression des ventes</span>
                          <span className={`font-medium ${soldPct >= 75 ? 'text-green-600' : soldPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            {soldPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              soldPct >= 75 ? 'bg-green-500' : soldPct >= 40 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(100, soldPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Quantités */}
                      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                        {[
                          { label: 'Commandé', value: t.initialQuantity, color: 'text-gray-700' },
                          { label: 'Vendu',    value: sold,               color: 'text-green-600' },
                          { label: 'Retourné', value: t.quantityReturned, color: 'text-teal-600' },
                          { label: 'Restant',  value: remaining,          color: days < 0 && remaining > 0 ? 'text-red-600 font-bold' : 'text-gray-700' },
                        ].map(q => (
                          <div key={q.label} className="bg-gray-50 rounded-lg p-2">
                            <p className={`text-lg font-bold ${q.color}`}>{q.value}</p>
                            <p className="text-xs text-gray-400">{q.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Données financières */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="bg-violet-50 rounded-lg p-2.5">
                          <p className="text-gray-500">Investissement</p>
                          <p className="font-semibold text-violet-700">{investment.toLocaleString('fr-FR')} F</p>
                          <p className="text-gray-400">{t.unitCost.toLocaleString('fr-FR')} F / u.</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2.5">
                          <p className="text-gray-500">Recettes générées</p>
                          <p className="font-semibold text-green-700">{revenue.toLocaleString('fr-FR')} F</p>
                          <p className="text-gray-400">{t.sellingPrice.toLocaleString('fr-FR')} F / u.</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>Entrée: {new Date(t.entryDate).toLocaleDateString('fr-FR')}</span>
                        <span className="mx-1">→</span>
                        <span>Limite: {new Date(t.returnDeadline).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {/* Notes */}
                      {t.notes && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1 mb-3">{t.notes}</p>
                      )}

                      {/* Actions */}
                      {isActive ? (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            onClick={() => openReturn(t)}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs"
                            disabled={remaining === 0}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Initier retour
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openClose(t)}
                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Clôturer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(t)}
                            className="text-red-500 hover:bg-red-50 px-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(t)}
                            className="ml-auto text-red-500 hover:bg-red-50 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- Dialog: Nouveau suivi --- */}
      <Dialog open={isAddOpen} onOpenChange={v => { setIsAddOpen(v); if (!v) resetAddForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouveau suivi de produit</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">

            {/* Médicament */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-violet-500" />
                Médicament
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans le stock..."
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <AnimatePresence>
                {medResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto"
                  >
                    {medResults.map(med => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => selectMedicine(med)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-violet-50 text-left text-sm"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{med.name}</span>
                          {med.moleculeName && <span className="text-gray-400 ml-1.5 text-xs">{med.moleculeName}</span>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-xs text-gray-500">Stock: {med.quantity}</span>
                          <span className="text-xs font-medium text-violet-600">{med.price.toLocaleString('fr-FR')} F</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {formData.medicineId && (
                <div className="flex items-center gap-2 bg-violet-50 rounded-lg px-3 py-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="font-medium text-violet-700">{formData.medicineName}</span>
                  <button onClick={() => setFormData(f => ({ ...f, medicineId: '', medicineName: '' }))} className="ml-auto text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Fournisseur & Délégué */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  Fournisseur *
                </Label>
                <Input
                  placeholder="Nom du grossiste / laboratoire"
                  value={formData.supplierName}
                  onChange={e => setFormData(f => ({ ...f, supplierName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-violet-500" />
                  Délégué commercial
                </Label>
                <Input
                  placeholder="Nom du délégué (optionnel)"
                  value={formData.delegateName}
                  onChange={e => setFormData(f => ({ ...f, delegateName: e.target.value }))}
                />
              </div>
            </div>

            {/* BL */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-400" />
                Numéro de bon de livraison (optionnel)
              </Label>
              <Input
                placeholder="Ex: BL-2024-0042"
                value={formData.blNumber}
                onChange={e => setFormData(f => ({ ...f, blNumber: e.target.value }))}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Date d'entrée *
                </Label>
                <Input
                  type="date"
                  value={formData.entryDate}
                  onChange={e => setFormData(f => ({ ...f, entryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Date limite de retour *
                </Label>
                <Input
                  type="date"
                  value={formData.returnDeadline}
                  onChange={e => setFormData(f => ({ ...f, returnDeadline: e.target.value }))}
                />
                <p className="text-xs text-gray-400">
                  {formData.returnDeadline && formData.entryDate
                    ? `${Math.ceil((new Date(formData.returnDeadline).getTime() - new Date(formData.entryDate).getTime()) / 86400000)} jours`
                    : ''}
                </p>
              </div>
            </div>

            {/* Quantités & Prix */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Qté commandée *</Label>
                <Input
                  type="number" min="1"
                  value={formData.initialQuantity}
                  onChange={e => setFormData(f => ({ ...f, initialQuantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Prix grossiste (F)</Label>
                <Input
                  type="number" min="0" step="1"
                  value={formData.unitCost}
                  onChange={e => setFormData(f => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Prix vente (F)</Label>
                <Input
                  type="number" min="0" step="1"
                  value={formData.sellingPrice}
                  onChange={e => setFormData(f => ({ ...f, sellingPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Aperçu investissement */}
            {formData.initialQuantity > 0 && formData.unitCost > 0 && (
              <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500">Investissement total</p>
                  <p className="font-bold text-violet-700">{(formData.initialQuantity * formData.unitCost).toLocaleString('fr-FR')} F</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Si tout vendu</p>
                  <p className="font-bold text-green-700">{(formData.initialQuantity * formData.sellingPrice).toLocaleString('fr-FR')} F</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Marge brute</p>
                  <p className={`font-bold ${formData.sellingPrice > formData.unitCost ? 'text-green-700' : 'text-red-600'}`}>
                    {formData.unitCost > 0
                      ? `${(((formData.sellingPrice - formData.unitCost) / formData.unitCost) * 100).toFixed(0)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">Notes (optionnel)</Label>
              <textarea
                rows={2}
                placeholder="Conditions du délégué, spécificités du produit..."
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetAddForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleAdd} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Créer le suivi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Initier retour --- */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-teal-600" />
              Initier un retour fournisseur
            </DialogTitle>
          </DialogHeader>

          {returnTarget && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-semibold text-gray-900">{returnTarget.medicineName}</p>
                <p className="text-gray-500">{returnTarget.supplierName}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span>Commandé : <strong>{returnTarget.initialQuantity}</strong></span>
                  <span>Déjà retourné : <strong>{returnTarget.quantityReturned}</strong></span>
                  <span>Restant : <strong className="text-teal-700">{getRemaining(returnTarget)}</strong></span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Quantité à retourner</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setReturnQty(q => Math.max(1, q - 1))}
                    disabled={returnQty <= 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1} max={getRemaining(returnTarget)}
                    value={returnQty}
                    onChange={e => setReturnQty(Math.min(getRemaining(returnTarget), Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24 text-center"
                  />
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setReturnQty(q => Math.min(getRemaining(returnTarget), q + 1))}
                    disabled={returnQty >= getRemaining(returnTarget)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500">/ {getRemaining(returnTarget)} max</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Motif du retour</Label>
                <Select value={returnReason} onValueChange={(v: RetourReason) => setReturnReason(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETOUR_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optionnel)</Label>
                <Input
                  placeholder="Précisions sur le retour..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                />
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 text-sm flex justify-between">
                <span className="text-gray-600">Montant du retour</span>
                <span className="font-bold text-teal-700">
                  {(returnQty * returnTarget.unitCost).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnOpen(false)}>Annuler</Button>
            <Button onClick={handleReturn} className="bg-teal-600 hover:bg-teal-700">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Enregistrer le retour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Clôturer le suivi --- */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clôturer le suivi</DialogTitle>
          </DialogHeader>

          {closeTarget && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Vous allez clôturer le suivi de <strong>{closeTarget.medicineName}</strong>.
              </p>
              <div className="space-y-1.5">
                <Label>Raison de la clôture</Label>
                <Select value={closeReason} onValueChange={(v: 'Vendu' | 'Expiré') => setCloseReason(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendu">Vendu — stock écoulé</SelectItem>
                    <SelectItem value="Expiré">Expiré — délai de retour dépassé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseOpen(false)}>Annuler</Button>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
