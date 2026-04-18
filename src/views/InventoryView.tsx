import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ClipboardList, Plus, Search, X, ChevronDown, ChevronRight, CheckCircle,
  AlertTriangle, Package, Calendar, User, ArrowLeft, Printer, ShieldCheck,
  TrendingDown, TrendingUp, Minus as MinusIcon, RotateCcw, Filter,
  FileText, BookOpen, Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import type { User as UserType } from '@/models/User';
import type { Inventory, InventoryItem } from '@/models/Inventory';
import { inventoryService } from '@/services/inventoryService';

interface InventoryViewProps {
  currentUser: UserType | null;
}

type DetailTab = 'comptage' | 'ecarts' | 'rapport';
type CountFilter = 'all' | 'uncounted' | 'discrepancy' | 'ok';

const STATUS_CONFIG = {
  'En cours': { label: 'En cours',  bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'Terminé':  { label: 'Terminé',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  'Validé':   { label: 'Validé',    bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
};

function pct(a: number, b: number) { return b > 0 ? Math.round((a / b) * 100) : 0; }

export function InventoryView({ currentUser }: InventoryViewProps) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [mode, setMode] = useState<'list' | 'detail'>('list');

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: `Inventaire fin d'exercice ${new Date().getFullYear()}`,
    year: new Date().getFullYear(),
    notes: '',
  });

  // Validate dialog
  const [isValidateOpen, setIsValidateOpen] = useState(false);

  // Detail state
  const [detailTab, setDetailTab] = useState<DetailTab>('comptage');
  const [countFilter, setCountFilter] = useState<CountFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => setInventories(inventoryService.list()), []);
  useEffect(() => { refresh(); }, [refresh]);

  // Refresh selectedInventory when inventories change
  useEffect(() => {
    if (selectedInventory) {
      const updated = inventories.find(i => i.id === selectedInventory.id);
      if (updated) setSelectedInventory(updated);
    }
  }, [inventories]);

  // Open detail and expand first category by default
  const openDetail = (inv: Inventory) => {
    setSelectedInventory(inv);
    setMode('detail');
    setDetailTab('comptage');
    setCountFilter('all');
    setSearchQuery('');
    const categories = Array.from(new Set(inv.items.map(i => i.category)));
    setExpandedCategories(new Set(categories.slice(0, 1)));
  };

  // ── Create ──────────────────────────────────────────────────────────────
  function handleCreate() {
    if (!createForm.name.trim()) { toast.error('Donnez un nom à l\'inventaire'); return; }
    const inv = inventoryService.create(
      createForm.name.trim(),
      createForm.year,
      currentUser?.fullName ?? 'Admin',
      createForm.notes.trim() || undefined
    );
    toast.success(`Inventaire ${inv.inventoryNumber} créé — ${inv.totalItems} produits`);
    setIsCreateOpen(false);
    refresh();
    openDetail(inv);
  }

  // ── Count update ─────────────────────────────────────────────────────────
  const handleCount = useCallback((medicineId: string, value: string) => {
    if (!selectedInventory) return;
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) return;
    const updated = inventoryService.updateItemCount(
      selectedInventory.id, medicineId, qty, currentUser?.fullName
    );
    if (updated) setSelectedInventory(updated);
  }, [selectedInventory, currentUser]);

  const handleResetCount = useCallback((medicineId: string) => {
    if (!selectedInventory) return;
    const updated = inventoryService.resetItemCount(selectedInventory.id, medicineId);
    if (updated) setSelectedInventory(updated);
  }, [selectedInventory]);

  // ── Finish / Validate ────────────────────────────────────────────────────
  function handleFinish() {
    if (!selectedInventory) return;
    const uncounted = selectedInventory.items.filter(i => i.physicalQty === undefined).length;
    if (uncounted > 0 && !confirm(`${uncounted} article(s) non comptés. Continuer quand même ?`)) return;
    const updated = inventoryService.finish(selectedInventory.id);
    if (updated) {
      setSelectedInventory(updated);
      refresh();
      toast.success('Inventaire marqué comme terminé');
    }
  }

  function handleValidate() {
    if (!selectedInventory || !currentUser) return;
    const updated = inventoryService.validate(selectedInventory.id, currentUser.fullName);
    if (updated) {
      setSelectedInventory(updated);
      refresh();
      setIsValidateOpen(false);
      toast.success('Stock mis à jour ! L\'inventaire est validé.');
    }
  }

  // ── Filtered items for detail ────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!selectedInventory) return [];
    return selectedInventory.items.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.medicineName.toLowerCase().includes(q) &&
            !item.category.toLowerCase().includes(q) &&
            !(item.location ?? '').toLowerCase().includes(q)) return false;
      }
      switch (countFilter) {
        case 'uncounted':   return item.physicalQty === undefined;
        case 'discrepancy': return item.physicalQty !== undefined && item.discrepancy !== 0;
        case 'ok':          return item.physicalQty !== undefined && item.discrepancy === 0;
        default:            return true;
      }
    });
  }, [selectedInventory, searchQuery, countFilter]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  // Items with discrepancy
  const discrepancyItems = useMemo(() => {
    if (!selectedInventory) return [];
    return selectedInventory.items.filter(i => i.physicalQty !== undefined && i.discrepancy !== 0);
  }, [selectedInventory]);

  const totalDiscrepancyValue = useMemo(() => {
    return discrepancyItems.reduce((s, i) => s + (i.discrepancy ?? 0) * i.unitPrice, 0);
  }, [discrepancyItems]);

  function toggleCategory(cat: string) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function expandAll() {
    if (!selectedInventory) return;
    setExpandedCategories(new Set(groupedItems.map(([cat]) => cat)));
  }
  function collapseAll() { setExpandedCategories(new Set()); }

  // ── List view ─────────────────────────────────────────────────────────────
  if (mode === 'list') return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Inventaires
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Inventaires de fin d'exercice et comptages physiques de stock
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel inventaire
        </Button>
      </div>

      {/* Cards */}
      {inventories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Aucun inventaire</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Créez votre premier inventaire pour commencer le comptage</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Créer un inventaire
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {inventories.map((inv, i) => {
              const sc = STATUS_CONFIG[inv.status];
              const progress = pct(inv.countedItems, inv.totalItems);
              const hasDiscrepancy = inv.discrepanciesCount > 0;
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{inv.inventoryNumber}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base truncate">{inv.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{inv.createdBy}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(inv.startDate).toLocaleDateString('fr-FR')}</span>
                        {inv.endDate && <span className="flex items-center gap-1">→ {new Date(inv.endDate).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-2xl font-bold text-indigo-700">{inv.year}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progression du comptage</span>
                      <span className="font-medium">{inv.countedItems} / {inv.totalItems} ({progress}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-gray-500">Produits</p>
                      <p className="font-bold text-gray-900 text-base">{inv.totalItems}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${hasDiscrepancy ? 'bg-red-50' : 'bg-green-50'}`}>
                      <p className="text-gray-500">Écarts</p>
                      <p className={`font-bold text-base ${hasDiscrepancy ? 'text-red-600' : 'text-green-600'}`}>{inv.discrepanciesCount}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2">
                      <p className="text-gray-500">Valeur stock</p>
                      <p className="font-bold text-indigo-700 text-xs mt-0.5">{inv.totalSystemValue.toLocaleString('fr-FR')} F</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Button onClick={() => openDetail(inv)} size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      {inv.status === 'En cours' ? 'Poursuivre le comptage' : 'Consulter'}
                    </Button>
                    {inv.status !== 'Validé' && (
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { if (confirm(`Supprimer ${inv.inventoryNumber} ?`)) { inventoryService.delete(inv.id); refresh(); } }}
                        className="text-red-400 hover:bg-red-50 px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Nouvel inventaire
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Nom de l'inventaire *</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Inventaire fin d'exercice 2024"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Exercice (année) *</Label>
              <Input
                type="number" min="2020" max="2099"
                value={createForm.year}
                onChange={e => setCreateForm(f => ({ ...f, year: parseInt(e.target.value) || f.year }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optionnel)</Label>
              <textarea
                rows={2}
                value={createForm.notes}
                onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Périmètre, instructions particulières..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Le stock actuel sera pris comme référence. Vous pourrez ensuite saisir les quantités physiques article par article.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Créer et démarrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ── Detail view ───────────────────────────────────────────────────────────
  if (!selectedInventory) return null;
  const inv = selectedInventory;
  const sc = STATUS_CONFIG[inv.status];
  const progress = pct(inv.countedItems, inv.totalItems);
  const isEditable = inv.status !== 'Validé';

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => { setMode('list'); setSelectedInventory(null); refresh(); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 text-lg truncate">{inv.name}</h2>
              <span className="text-xs text-gray-400 font-mono">{inv.inventoryNumber}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{inv.createdBy}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(inv.startDate).toLocaleDateString('fr-FR')}</span>
              {inv.validatedBy && <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-600" />Validé par {inv.validatedBy}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditable && inv.countedItems > 0 && inv.status === 'En cours' && (
              <Button size="sm" variant="outline" onClick={handleFinish} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Terminer
              </Button>
            )}
            {inv.status === 'Terminé' && (
              <Button size="sm" onClick={() => setIsValidateOpen(true)} className="bg-green-600 hover:bg-green-700">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Valider et MAJ stock
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{inv.countedItems}/{inv.totalItems} articles comptés</span>
            <span className={`font-medium ${progress === 100 ? 'text-green-600' : 'text-indigo-600'}`}>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-4 mt-1 text-xs text-gray-400">
            <span>Valeur système : <strong className="text-gray-700">{inv.totalSystemValue.toLocaleString('fr-FR')} FCFA</strong></span>
            {inv.countedItems > 0 && <span>Valeur physique : <strong className="text-indigo-700">{inv.totalPhysicalValue.toLocaleString('fr-FR')} FCFA</strong></span>}
            {inv.discrepanciesCount > 0 && <span className="text-red-600 font-medium">{inv.discrepanciesCount} écart(s)</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {([
            { id: 'comptage', label: 'Comptage',       icon: ClipboardList },
            { id: 'ecarts',   label: `Écarts (${inv.discrepanciesCount})`,  icon: AlertTriangle },
            { id: 'rapport',  label: 'Rapport',         icon: FileText },
          ] as { id: DetailTab; label: string; icon: any }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                detailTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── Tab: Comptage ── */}
        {detailTab === 'comptage' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 flex-wrap shadow-sm">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher produit, catégorie, emplacement..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                {([
                  { id: 'all',         label: 'Tous',            count: inv.totalItems },
                  { id: 'uncounted',   label: 'Non comptés',     count: inv.totalItems - inv.countedItems },
                  { id: 'discrepancy', label: 'Avec écarts',     count: inv.discrepanciesCount },
                  { id: 'ok',          label: 'OK',              count: inv.countedItems - inv.discrepanciesCount },
                ] as { id: CountFilter; label: string; count: number }[]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setCountFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      countFilter === f.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f.label}
                    <span className={`ml-1 px-1 rounded-full text-xs ${countFilter === f.id ? 'bg-white/25' : 'bg-gray-200 text-gray-600'}`}>{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-1 ml-auto">
                <button onClick={expandAll} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Tout ouvrir</button>
                <button onClick={collapseAll} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">Tout fermer</button>
              </div>
            </div>

            {/* Category groups */}
            {groupedItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun produit pour ce filtre</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedItems.map(([category, items]) => {
                  const catCounted = items.filter(i => i.physicalQty !== undefined).length;
                  const catDiscrepancies = items.filter(i => i.physicalQty !== undefined && i.discrepancy !== 0).length;
                  const isExpanded = expandedCategories.has(category);

                  return (
                    <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Category header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <span className="font-semibold text-gray-900">{category}</span>
                          <span className="text-xs text-gray-500">{catCounted}/{items.length} comptés</span>
                          {catDiscrepancies > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-600 font-medium">
                              {catDiscrepancies} écart(s)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${catCounted === items.length ? 'bg-green-500' : 'bg-indigo-400'}`}
                              style={{ width: `${pct(catCounted, items.length)}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{pct(catCounted, items.length)}%</span>
                        </div>
                      </button>

                      {/* Items table */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-t border-gray-100 text-xs text-gray-500 uppercase">
                                  <tr>
                                    <th className="px-4 py-2.5 text-left w-8">#</th>
                                    <th className="px-4 py-2.5 text-left">Médicament</th>
                                    <th className="px-3 py-2.5 text-left">Lot</th>
                                    <th className="px-3 py-2.5 text-left">Expiration</th>
                                    <th className="px-3 py-2.5 text-left">Emplacement</th>
                                    <th className="px-3 py-2.5 text-right">Qté système</th>
                                    <th className="px-4 py-2.5 text-center w-36">Qté physique</th>
                                    <th className="px-3 py-2.5 text-center w-24">Écart</th>
                                    {isEditable && <th className="px-2 py-2.5 w-10"></th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {items.map((item, rowIdx) => {
                                    const isCounted = item.physicalQty !== undefined;
                                    const hasDiscrepancy = isCounted && item.discrepancy !== 0;
                                    const isOk = isCounted && item.discrepancy === 0;

                                    return (
                                      <tr key={item.medicineId}
                                        className={`transition-colors ${
                                          hasDiscrepancy ? 'bg-red-50 hover:bg-red-100/50' :
                                          isOk ? 'bg-green-50/50 hover:bg-green-50' :
                                          'hover:bg-gray-50'
                                        }`}
                                      >
                                        <td className="px-4 py-2.5 text-gray-400 text-xs">{rowIdx + 1}</td>
                                        <td className="px-4 py-2.5">
                                          <p className="font-medium text-gray-900 text-sm">{item.medicineName}</p>
                                          {item.countedBy && (
                                            <p className="text-xs text-gray-400">{item.countedBy} · {item.countedAt ? new Date(item.countedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                          )}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{item.batchNumber}</td>
                                        <td className="px-3 py-2.5 text-xs text-gray-500">
                                          {new Date(item.expirationDate).toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' })}
                                        </td>
                                        <td className="px-3 py-2.5 text-xs text-gray-400">{item.location || '—'}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{item.systemQty}</td>
                                        <td className="px-4 py-2.5">
                                          {isEditable ? (
                                            <CountInput
                                              key={item.medicineId}
                                              initialValue={item.physicalQty}
                                              onCommit={val => handleCount(item.medicineId, val)}
                                            />
                                          ) : (
                                            <span className="text-center block font-semibold">{item.physicalQty ?? '—'}</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                          {!isCounted ? (
                                            <span className="text-gray-300 text-xs">—</span>
                                          ) : item.discrepancy === 0 ? (
                                            <span className="flex items-center justify-center gap-0.5 text-green-600 text-xs font-medium">
                                              <CheckCircle className="w-3.5 h-3.5" /> OK
                                            </span>
                                          ) : (
                                            <span className={`flex items-center justify-center gap-0.5 text-xs font-bold ${(item.discrepancy ?? 0) > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                              {(item.discrepancy ?? 0) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                              {(item.discrepancy ?? 0) > 0 ? '+' : ''}{item.discrepancy}
                                            </span>
                                          )}
                                        </td>
                                        {isEditable && (
                                          <td className="px-2 py-2.5 text-center">
                                            {isCounted && (
                                              <button onClick={() => handleResetCount(item.medicineId)} className="text-gray-300 hover:text-gray-500 transition-colors" title="Réinitialiser">
                                                <RotateCcw className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Écarts ── */}
        {detailTab === 'ecarts' && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total écarts',       value: inv.discrepanciesCount,                                                   icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-100' },
                { label: 'Manquants',          value: discrepancyItems.filter(i => (i.discrepancy ?? 0) < 0).length,           icon: TrendingDown,  color: 'text-red-600',    bg: 'bg-red-100' },
                { label: 'Excédents',          value: discrepancyItems.filter(i => (i.discrepancy ?? 0) > 0).length,           icon: TrendingUp,    color: 'text-amber-600',  bg: 'bg-amber-100' },
                { label: 'Impact valeur',      value: `${totalDiscrepancyValue >= 0 ? '+' : ''}${totalDiscrepancyValue.toLocaleString('fr-FR')} F`, icon: MinusIcon, color: totalDiscrepancyValue >= 0 ? 'text-amber-600' : 'text-red-600', bg: totalDiscrepancyValue >= 0 ? 'bg-amber-100' : 'bg-red-100' },
              ].map((k, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  </div>
                  <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center`}>
                    <k.icon className={`w-5 h-5 ${k.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {discrepancyItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-green-200 p-12 text-center shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-700 font-semibold text-lg">Aucun écart détecté</p>
                <p className="text-sm text-gray-400 mt-1">Le stock physique correspond au stock système pour tous les articles comptés</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Articles avec écarts</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Médicament</th>
                        <th className="px-4 py-3 text-left">Catégorie</th>
                        <th className="px-3 py-3 text-left">Lot</th>
                        <th className="px-4 py-3 text-right">Système</th>
                        <th className="px-4 py-3 text-right">Physique</th>
                        <th className="px-4 py-3 text-right">Écart</th>
                        <th className="px-4 py-3 text-right">Impact (FCFA)</th>
                        <th className="px-4 py-3 text-center">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {discrepancyItems.map(item => {
                        const isShortage = (item.discrepancy ?? 0) < 0;
                        const impact = (item.discrepancy ?? 0) * item.unitPrice;
                        return (
                          <tr key={item.medicineId} className={`${isShortage ? 'bg-red-50' : 'bg-amber-50'}`}>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.medicineName}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{item.category}</td>
                            <td className="px-3 py-3 text-gray-400 text-xs font-mono">{item.batchNumber}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-700">{item.systemQty}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">{item.physicalQty}</td>
                            <td className={`px-4 py-3 text-right font-bold text-base ${isShortage ? 'text-red-600' : 'text-amber-600'}`}>
                              {isShortage ? '' : '+'}{item.discrepancy}
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold ${isShortage ? 'text-red-600' : 'text-amber-600'}`}>
                              {impact >= 0 ? '+' : ''}{impact.toLocaleString('fr-FR')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isShortage ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isShortage ? 'Manquant' : 'Excédent'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold text-sm">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-gray-700">Total</td>
                        <td className={`px-4 py-3 text-right font-bold ${totalDiscrepancyValue >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                          {totalDiscrepancyValue >= 0 ? '+' : ''}{discrepancyItems.reduce((s, i) => s + (i.discrepancy ?? 0), 0)}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${totalDiscrepancyValue >= 0 ? 'text-amber-700' : 'text-red-700'}`}>
                          {totalDiscrepancyValue >= 0 ? '+' : ''}{totalDiscrepancyValue.toLocaleString('fr-FR')} F
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Rapport ── */}
        {detailTab === 'rapport' && (
          <div className="space-y-5 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
              {/* Rapport header */}
              <div className="text-center border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold text-gray-900">{inv.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {inv.inventoryNumber} · {inv.year}
                </p>
                <div className="flex justify-center gap-8 mt-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Démarré le</p>
                    <p className="font-semibold">{new Date(inv.startDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {inv.endDate && <div className="text-center">
                    <p className="text-gray-500 text-xs">Terminé le</p>
                    <p className="font-semibold">{new Date(inv.endDate).toLocaleDateString('fr-FR')}</p>
                  </div>}
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Réalisé par</p>
                    <p className="font-semibold">{inv.createdBy}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Statut</p>
                    <p className={`font-semibold ${sc.text}`}>{sc.label}</p>
                  </div>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Résumé du comptage</h3>
                  {[
                    { label: 'Total articles inventoriés', value: inv.totalItems },
                    { label: 'Articles comptés', value: `${inv.countedItems} (${pct(inv.countedItems, inv.totalItems)}%)` },
                    { label: 'Articles non comptés', value: inv.totalItems - inv.countedItems },
                    { label: 'Écarts constatés', value: inv.discrepanciesCount },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Valorisation</h3>
                  {[
                    { label: 'Valeur stock système (théorique)', value: `${inv.totalSystemValue.toLocaleString('fr-FR')} FCFA`, color: 'text-gray-900' },
                    { label: 'Valeur stock physique (compté)', value: `${inv.totalPhysicalValue.toLocaleString('fr-FR')} FCFA`, color: 'text-indigo-700' },
                    { label: 'Écart de valorisation', value: `${(inv.totalPhysicalValue - inv.totalSystemValue) >= 0 ? '+' : ''}${(inv.totalPhysicalValue - inv.totalSystemValue).toLocaleString('fr-FR')} FCFA`, color: inv.totalPhysicalValue >= inv.totalSystemValue ? 'text-amber-600' : 'text-red-600' },
                    { label: 'Taux de conformité', value: `${pct(inv.countedItems - inv.discrepanciesCount, inv.countedItems)}%`, color: 'text-green-700' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-600">{r.label}</span>
                      <span className={`font-semibold ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full item table for print */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">Détail complet</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">Médicament</th>
                        <th className="px-3 py-2 text-left">Catégorie</th>
                        <th className="px-3 py-2 text-left">Lot</th>
                        <th className="px-3 py-2 text-left">Expiration</th>
                        <th className="px-3 py-2 text-right">Sys.</th>
                        <th className="px-3 py-2 text-right">Phys.</th>
                        <th className="px-3 py-2 text-right">Écart</th>
                        <th className="px-3 py-2 text-right">P.U.</th>
                        <th className="px-3 py-2 text-right">Valeur sys.</th>
                        <th className="px-3 py-2 text-right">Valeur phys.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inv.items.map(item => {
                        const sysVal = item.systemQty * item.unitPrice;
                        const physVal = (item.physicalQty ?? 0) * item.unitPrice;
                        return (
                          <tr key={item.medicineId} className={item.discrepancy !== 0 && item.discrepancy !== undefined ? 'bg-red-50' : ''}>
                            <td className="px-3 py-1.5 font-medium text-gray-900">{item.medicineName}</td>
                            <td className="px-3 py-1.5 text-gray-500">{item.category}</td>
                            <td className="px-3 py-1.5 text-gray-400 font-mono">{item.batchNumber}</td>
                            <td className="px-3 py-1.5 text-gray-400">{new Date(item.expirationDate).toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' })}</td>
                            <td className="px-3 py-1.5 text-right font-medium">{item.systemQty}</td>
                            <td className="px-3 py-1.5 text-right font-medium">{item.physicalQty ?? '—'}</td>
                            <td className={`px-3 py-1.5 text-right font-bold ${(item.discrepancy ?? 0) < 0 ? 'text-red-600' : (item.discrepancy ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {item.physicalQty !== undefined ? (item.discrepancy === 0 ? 'OK' : `${(item.discrepancy ?? 0) > 0 ? '+' : ''}${item.discrepancy}`) : '—'}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-600">{item.unitPrice.toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-1.5 text-right">{sysVal.toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-1.5 text-right font-semibold">{item.physicalQty !== undefined ? physVal.toLocaleString('fr-FR') : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-semibold text-xs">
                      <tr>
                        <td colSpan={8} className="px-3 py-2">TOTAL</td>
                        <td className="px-3 py-2 text-right">{inv.totalSystemValue.toLocaleString('fr-FR')}</td>
                        <td className="px-3 py-2 text-right text-indigo-700">{inv.totalPhysicalValue.toLocaleString('fr-FR')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {inv.validatedBy && (
                <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
                  <p>Validé par <strong>{inv.validatedBy}</strong> le {inv.validatedAt ? new Date(inv.validatedAt).toLocaleDateString('fr-FR') : '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">Le stock a été mis à jour selon les quantités physiques constatées lors de cet inventaire.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validate dialog */}
      <Dialog open={isValidateOpen} onOpenChange={setIsValidateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <ShieldCheck className="w-5 h-5" />
              Valider l'inventaire
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 text-sm">
            <p className="text-gray-700">Cette action va <strong>mettre à jour le stock système</strong> pour tous les articles comptés :</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p>• <strong>{inv.countedItems}</strong> articles seront mis à jour</p>
              <p>• <strong>{inv.discrepanciesCount}</strong> écart(s) seront régularisés</p>
              <p>• <strong>{inv.totalItems - inv.countedItems}</strong> articles non comptés ne seront pas modifiés</p>
            </div>
            <p className="text-red-600 text-xs">Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidateOpen(false)}>Annuler</Button>
            <Button onClick={handleValidate} className="bg-green-600 hover:bg-green-700">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Confirmer et mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Composant CountInput avec auto-save ──────────────────────────────────────
function CountInput({ initialValue, onCommit }: { initialValue?: number; onCommit: (val: string) => void }) {
  const [value, setValue] = useState(initialValue !== undefined ? String(initialValue) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(() => {
    if (value.trim() !== '') onCommit(value);
  }, [value, onCommit]);

  return (
    <input
      ref={inputRef}
      type="number"
      min="0"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          commit();
          // Move to next input
          const inputs = Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
          const idx = inputs.indexOf(inputRef.current!);
          if (idx !== -1 && idx + 1 < inputs.length) inputs[idx + 1].focus();
        }
      }}
      placeholder="—"
      className={`w-full text-center rounded-md border text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
        value !== '' && initialValue !== undefined
          ? 'border-indigo-200 bg-indigo-50 font-semibold'
          : 'border-gray-200 bg-white'
      }`}
    />
  );
}
