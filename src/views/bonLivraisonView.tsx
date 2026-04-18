import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, FileText, Eye, Edit, Trash2, X, AlertTriangle,
  CheckCircle, Clock, Package, Truck, Calendar, FileCheck,
  TrendingDown, User2, ArrowLeft, Save, Minus, Info,
  Percent, RefreshCw, ArrowRightLeft, TriangleAlert, Boxes,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useBonLivraison } from '@/controllers/bonLivraisonController';
import { medicineService } from '@/services/medicineService';
import { retourService } from '@/services/retourService';
import type { User } from '@/models/User';
import type { Medicine } from '@/models/Medicine';
import type { BonLivraison, BonLivraisonItem, RetourFournisseur, RetourItem, RetourReason } from '@/models/bonLivraison';
import { toast } from 'sonner';

interface BonLivraisonViewProps {
  currentUser: User | null;
}

type BLViewMode = 'list' | 'add' | 'edit' | 'details' | 'compare';
type RetourViewMode = 'list' | 'add' | 'edit';
type MainTab = 'bl' | 'retours';

const TAX_PRESETS = [
  { label: 'Exonéré (0%)', value: 0 },
  { label: 'TVA 10%', value: 10 },
  { label: 'TVA 18%', value: 18 },
];

const RETOUR_REASONS: RetourReason[] = [
  'Périmé', 'Endommagé', 'Erreur de commande', 'Qualité insuffisante', 'Autre'
];

const RETOUR_STATUS_COLORS: Record<RetourFournisseur['status'], string> = {
  'En attente': 'bg-yellow-100 text-yellow-700',
  'Envoyé':     'bg-blue-100 text-blue-700',
  'Accepté':    'bg-green-100 text-green-700',
  'Refusé':     'bg-red-100 text-red-700',
};

// ─── Empty item factory ───────────────────────────────────────────────────────
const emptyItem = (): BonLivraisonItem => ({
  medicineId: `TMP_${Date.now()}`,
  medicineName: '',
  quantityOrdered: 0,
  quantityReceived: 0,
  unitPrice: 0,
  sellingPrice: 0,
  taxRate: 0,
  taxAmount: 0,
  batchNumber: '',
  discrepancy: 0,
  priceChanged: false,
  previousSellingPrice: undefined,
  currentStock: undefined,
});

// ─── Empty retour item factory ────────────────────────────────────────────────
const emptyRetourItem = (): RetourItem => ({
  medicineId: '',
  medicineName: '',
  quantity: 1,
  unitPrice: 0,
  reason: 'Périmé',
  batchNumber: '',
  totalAmount: 0,
  notes: '',
});

export function BonLivraisonView({ currentUser }: BonLivraisonViewProps) {
  const {
    bls, loading, create, update, deleteBL,
    verify, validate, compareWithOrder, generateBLNumber, getStats
  } = useBonLivraison();

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('bl');

  // ── BL state ────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode]     = useState<BLViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BonLivraison['status']>('all');
  const [selectedBL, setSelectedBL] = useState<BonLivraison | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // BL form
  const [formData, setFormData] = useState({
    blNumber: '',
    supplierName: '',
    supplierId: '',
    supplierOrderNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryPerson: '',
    items: [] as BonLivraisonItem[],
    notes: '',
    status: 'En attente' as BonLivraison['status'],
  });

  // Per-item search & auto-margin state
  const [itemSearches, setItemSearches]   = useState<string[]>([]);
  const [itemAutoMargin, setItemAutoMargin] = useState<boolean[]>([]);
  const [defaultMargin, setDefaultMargin]  = useState(33);
  const [allMedicines, setAllMedicines]    = useState<Medicine[]>([]);

  // ── Retour state ────────────────────────────────────────────────────────────
  const [retourViewMode, setRetourViewMode] = useState<RetourViewMode>('list');
  const [retours, setRetours]               = useState<RetourFournisseur[]>([]);
  const [selectedRetour, setSelectedRetour] = useState<RetourFournisseur | null>(null);
  const [retourForm, setRetourForm]         = useState({
    supplierName: '',
    blId: '',
    blNumber: '',
    returnDate: new Date().toISOString().split('T')[0],
    items: [] as RetourItem[],
    notes: '',
    status: 'En attente' as RetourFournisseur['status'],
  });
  const [retourItemSearches, setRetourItemSearches] = useState<string[]>([]);

  const stats = getStats();

  useEffect(() => {
    setAllMedicines(medicineService.getAll());
    setRetours(retourService.list());
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const computeSellingPrice = (wholesalePrice: number, marginPct: number) =>
    +(wholesalePrice * (1 + marginPct / 100)).toFixed(0);

  const getStatusColor = (status: BonLivraison['status']) => {
    switch (status) {
      case 'En attente': return 'bg-yellow-100 text-yellow-700';
      case 'Vérifié':    return 'bg-blue-100 text-blue-700';
      case 'Validé':     return 'bg-green-100 text-green-700';
      case 'Litige':     return 'bg-red-100 text-red-700';
      case 'Archivé':    return 'bg-gray-100 text-gray-700';
      default:           return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: BonLivraison['status']) => {
    switch (status) {
      case 'En attente': return Clock;
      case 'Vérifié':    return Eye;
      case 'Validé':     return CheckCircle;
      case 'Litige':     return AlertTriangle;
      case 'Archivé':    return Package;
      default:           return FileText;
    }
  };

  // ── BL Form helpers ─────────────────────────────────────────────────────────

  const handleAddItem = () => {
    setFormData(f => ({ ...f, items: [...f.items, emptyItem()] }));
    setItemSearches(s => [...s, '']);
    setItemAutoMargin(a => [...a, true]);
  };

  const handleRemoveItem = (index: number) => {
    setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    setItemSearches(s => s.filter((_, i) => i !== index));
    setItemAutoMargin(a => a.filter((_, i) => i !== index));
  };

  const handleSelectMedicineForItem = (index: number, medicine: Medicine) => {
    setFormData(f => {
      const items = [...f.items];
      const auto  = itemAutoMargin[index] ?? true;
      const wp    = items[index].unitPrice || 0;
      const sp    = wp > 0 ? computeSellingPrice(wp, defaultMargin) : medicine.price;
      items[index] = {
        ...items[index],
        medicineId:            medicine.id,
        medicineName:          medicine.name,
        sellingPrice:          sp,
        previousSellingPrice:  medicine.price,
        currentStock:          medicine.quantity,
        priceChanged:          sp !== medicine.price,
      };
      return { ...f, items };
    });
    setItemSearches(s => { const n = [...s]; n[index] = ''; return n; });
  };

  const handleItemChange = (index: number, field: keyof BonLivraisonItem, rawValue: any) => {
    setFormData(f => {
      const items = [...f.items];
      const item  = { ...items[index], [field]: rawValue };

      // Recalculate derived fields
      const qty  = field === 'quantityReceived' ? (Number(rawValue) || 0) : (item.quantityReceived || 0);
      const wp   = field === 'unitPrice'        ? (Number(rawValue) || 0) : (item.unitPrice || 0);
      const tax  = field === 'taxRate'          ? (Number(rawValue) || 0) : (item.taxRate || 0);

      // Auto-margin: recalculate selling price when wholesale changes
      if (field === 'unitPrice' && (itemAutoMargin[index] ?? true)) {
        item.sellingPrice = computeSellingPrice(Number(rawValue) || 0, defaultMargin);
      }

      // Detect price change vs stock
      if ((field === 'unitPrice' || field === 'sellingPrice') && item.previousSellingPrice !== undefined) {
        item.priceChanged = item.sellingPrice !== item.previousSellingPrice;
      }

      // Disable auto-margin when user manually edits selling price
      if (field === 'sellingPrice') {
        setItemAutoMargin(a => { const n = [...a]; n[index] = false; return n; });
        item.priceChanged = item.previousSellingPrice !== undefined
          ? Number(rawValue) !== item.previousSellingPrice
          : false;
      }

      // Tax amount
      item.taxAmount = +(qty * wp * (tax / 100)).toFixed(0);

      // Discrepancy
      if (field === 'quantityOrdered' || field === 'quantityReceived') {
        const qo = field === 'quantityOrdered' ? (Number(rawValue) || 0) : (item.quantityOrdered || 0);
        const qr = field === 'quantityReceived' ? (Number(rawValue) || 0) : (item.quantityReceived || 0);
        item.discrepancy = qr - qo;
        item.taxAmount   = +(qr * wp * (tax / 100)).toFixed(0);
      }

      items[index] = item;
      return { ...f, items };
    });
  };

  const reapplyAutoMargin = (index: number) => {
    setFormData(f => {
      const items = [...f.items];
      const sp = computeSellingPrice(items[index].unitPrice || 0, defaultMargin);
      items[index] = {
        ...items[index],
        sellingPrice: sp,
        priceChanged: items[index].previousSellingPrice !== undefined
          ? sp !== items[index].previousSellingPrice
          : false,
      };
      return { ...f, items };
    });
    setItemAutoMargin(a => { const n = [...a]; n[index] = true; return n; });
  };

  // Totals
  const totals = useMemo(() => {
    const ht  = formData.items.reduce((s, i) => s + (i.quantityReceived * i.unitPrice), 0);
    const tax = formData.items.reduce((s, i) => s + (i.taxAmount || 0), 0);
    return { ht, tax, ttc: ht + tax };
  }, [formData.items]);

  const resetBLForm = () => {
    setFormData({
      blNumber: generateBLNumber(),
      supplierName: '',
      supplierId: '',
      supplierOrderNumber: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryPerson: '',
      items: [],
      notes: '',
      status: 'En attente',
    });
    setItemSearches([]);
    setItemAutoMargin([]);
  };

  const handleSubmitBL = () => {
    if (!formData.blNumber || !formData.supplierName || formData.items.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires et ajouter au moins un article');
      return;
    }
    const blData = {
      blNumber: formData.blNumber,
      supplierId: formData.supplierId || `SUP${Date.now()}`,
      supplierName: formData.supplierName,
      supplierOrderNumber: formData.supplierOrderNumber || undefined,
      deliveryDate: new Date(formData.deliveryDate),
      deliveryPerson: formData.deliveryPerson || undefined,
      items: formData.items,
      subtotal: totals.ht,
      tax: totals.tax,
      totalAmount: totals.ttc,
      status: formData.status,
      notes: formData.notes || undefined,
    };
    if (viewMode === 'add') {
      create(blData);
      toast.success('Bon de livraison créé avec succès');
    } else if (viewMode === 'edit' && selectedBL) {
      update(selectedBL.id, blData);
      toast.success('Bon de livraison modifié');
    }
    resetBLForm();
    setViewMode('list');
  };

  const handleEditBL = (bl: BonLivraison) => {
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
      status: bl.status,
    });
    setItemSearches(bl.items.map(() => ''));
    setItemAutoMargin(bl.items.map(() => false));
    setViewMode('edit');
  };

  const handleVerify = (id: string) => {
    verify(id, currentUser?.fullName || 'Inconnu');
    toast.success('BL vérifié');
  };

  const handleValidate = (id: string) => {
    validate(id, currentUser?.fullName || 'Inconnu');
    toast.success('BL validé — stock et prix mis à jour');
  };

  const handleDeleteBL = (id: string) => {
    if (confirm('Supprimer ce bon de livraison ?')) {
      deleteBL(id);
      toast.success('BL supprimé');
    }
  };

  const handleCompare = (bl: BonLivraison) => {
    setSelectedBL(bl);
    if (bl.supplierOrderId) {
      setComparisonData(compareWithOrder(bl.id, bl.supplierOrderId));
    }
    setViewMode('compare');
  };

  const filteredBLs = bls.filter(bl => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      bl.blNumber.toLowerCase().includes(q) ||
      bl.supplierName.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || bl.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Retour form helpers ──────────────────────────────────────────────────────

  const resetRetourForm = () => {
    setRetourForm({
      supplierName: '',
      blId: '',
      blNumber: '',
      returnDate: new Date().toISOString().split('T')[0],
      items: [],
      notes: '',
      status: 'En attente',
    });
    setRetourItemSearches([]);
  };

  const handleAddRetourItem = () => {
    setRetourForm(f => ({ ...f, items: [...f.items, emptyRetourItem()] }));
    setRetourItemSearches(s => [...s, '']);
  };

  const handleRemoveRetourItem = (index: number) => {
    setRetourForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
    setRetourItemSearches(s => s.filter((_, i) => i !== index));
  };

  const handleRetourItemChange = (index: number, field: keyof RetourItem, value: any) => {
    setRetourForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      items[index].totalAmount = (items[index].quantity || 0) * (items[index].unitPrice || 0);
      return { ...f, items };
    });
  };

  const handleSelectMedicineForRetour = (index: number, medicine: Medicine) => {
    setRetourForm(f => {
      const items = [...f.items];
      items[index] = {
        ...items[index],
        medicineId:  medicine.id,
        medicineName: medicine.name,
        unitPrice:   medicine.price,
        totalAmount: (items[index].quantity || 1) * medicine.price,
      };
      return { ...f, items };
    });
    setRetourItemSearches(s => { const n = [...s]; n[index] = ''; return n; });
  };

  const handleSubmitRetour = () => {
    if (!retourForm.supplierName || retourForm.items.length === 0) {
      toast.error('Fournisseur et au moins un article requis');
      return;
    }
    const totalAmount = retourForm.items.reduce((s, i) => s + i.totalAmount, 0);
    const data = {
      supplierName: retourForm.supplierName,
      blId:         retourForm.blId || undefined,
      blNumber:     retourForm.blNumber || undefined,
      returnDate:   retourForm.returnDate,
      items:        retourForm.items,
      totalAmount,
      status:       retourForm.status,
      notes:        retourForm.notes || undefined,
      createdBy:    currentUser?.fullName,
    };
    if (retourViewMode === 'add') {
      retourService.create(data);
      toast.success('Retour fournisseur enregistré');
    } else if (retourViewMode === 'edit' && selectedRetour) {
      retourService.update(selectedRetour.id, { ...data, retourNumber: selectedRetour.retourNumber });
      toast.success('Retour modifié');
    }
    setRetours(retourService.list());
    resetRetourForm();
    setRetourViewMode('list');
  };

  const handleDeleteRetour = (id: string) => {
    if (confirm('Supprimer ce retour ?')) {
      retourService.delete(id);
      setRetours(retourService.list());
      toast.success('Retour supprimé');
    }
  };

  const handleEditRetour = (r: RetourFournisseur) => {
    setSelectedRetour(r);
    setRetourForm({
      supplierName: r.supplierName,
      blId:         r.blId || '',
      blNumber:     r.blNumber || '',
      returnDate:   r.returnDate,
      items:        r.items,
      notes:        r.notes || '',
      status:       r.status,
    });
    setRetourItemSearches(r.items.map(() => ''));
    setRetourViewMode('edit');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // VUE DÉTAILS BL
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'details' && selectedBL) {
    const StatusIcon = getStatusIcon(selectedBL.status);
    const hasPriceChanges = selectedBL.items.some(i => i.priceChanged);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('list')}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedBL.blNumber}</h1>
                <p className="text-sm text-gray-500">Livré le {new Date(selectedBL.deliveryDate).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasPriceChanges && (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                  <TriangleAlert className="w-4 h-4" />
                  Prix modifiés sur ce BL
                </span>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBL.status)}`}>
                <StatusIcon className="w-4 h-4 inline mr-1" />
                {selectedBL.status}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Fournisseur', value: selectedBL.supplierName, Icon: Truck, color: 'text-teal-600' },
              { label: 'Livreur', value: selectedBL.deliveryPerson || '—', Icon: User2, color: 'text-blue-600' },
              { label: 'N° Commande', value: selectedBL.supplierOrderNumber || '—', Icon: FileText, color: 'text-gray-600' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-500 mb-2">{label}</p>
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <p className="font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900">Articles reçus ({selectedBL.items.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Médicament</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Cmd/Reçu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Écart</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Prix gros.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Prix vente</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Taxe</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total TTC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Lot / Expir.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedBL.items.map((item, i) => (
                  <tr key={i} className={item.priceChanged ? 'bg-amber-50' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                          {item.priceChanged && (
                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                              <TriangleAlert className="w-3 h-3" />
                              Prix modifié: {item.previousSellingPrice?.toLocaleString('fr-FR')} → {item.sellingPrice?.toLocaleString('fr-FR')} F
                            </p>
                          )}
                          {item.currentStock !== undefined && (
                            <p className="text-xs text-gray-400">Stock: {item.currentStock} u.</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {item.quantityOrdered} / <span className="font-semibold">{item.quantityReceived}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.discrepancy !== 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.discrepancy! > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {item.discrepancy! > 0 ? '+' : ''}{item.discrepancy}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{item.unitPrice.toLocaleString('fr-FR')} F</td>
                    <td className="px-4 py-3 text-right font-medium text-teal-700">
                      {item.sellingPrice ? `${item.sellingPrice.toLocaleString('fr-FR')} F` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {item.taxRate ? `${item.taxRate}%` : '0%'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {(item.quantityReceived * item.unitPrice + (item.taxAmount || 0)).toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {item.batchNumber && <div>Lot: {item.batchNumber}</div>}
                      {item.expirationDate && (
                        <div>Exp: {typeof item.expirationDate === 'string' ? item.expirationDate : new Date(item.expirationDate).toLocaleDateString('fr-FR')}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50 border-t-2 border-teal-200">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right font-medium text-gray-700">Total HT</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{selectedBL.subtotal.toLocaleString('fr-FR')} F</td>
                  <td />
                </tr>
                {selectedBL.tax > 0 && (
                  <tr className="bg-teal-50">
                    <td colSpan={6} className="px-4 py-3 text-right font-medium text-gray-700">Taxes</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">+{selectedBL.tax.toLocaleString('fr-FR')} F</td>
                    <td />
                  </tr>
                )}
                <tr className="bg-teal-100">
                  <td colSpan={6} className="px-4 py-3 text-right font-bold text-gray-900">Total TTC</td>
                  <td className="px-4 py-3 text-right text-xl font-bold text-teal-600">{selectedBL.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {selectedBL.notes && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Info className="w-5 h-5" /> Notes</h3>
              <p className="text-blue-800">{selectedBL.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE COMPARAISON
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'compare' && selectedBL && comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('list')}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
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
            }`}>{comparisonData.matchStatus}</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Médicament','Commandé','Reçu','Statut'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.itemsComparison.map((comp: any, i: number) => (
                  <tr key={i} className={comp.status === 'OK' ? '' : comp.status === 'Moins' ? 'bg-red-50' : comp.status === 'Plus' ? 'bg-blue-50' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900">{comp.medicineName}</td>
                    <td className="px-6 py-4 text-center">{comp.quantityOrdered}</td>
                    <td className="px-6 py-4 text-center font-semibold">{comp.quantityReceived}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        comp.status === 'OK' ? 'bg-green-100 text-green-700' :
                        comp.status === 'Moins' ? 'bg-red-100 text-red-700' :
                        comp.status === 'Plus' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>{comp.status}</span>
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

  // ════════════════════════════════════════════════════════════════════════════
  // VUE AJOUT / ÉDITION BL
  // ════════════════════════════════════════════════════════════════════════════
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setViewMode('list'); resetBLForm(); }}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {viewMode === 'add' ? 'Nouveau bon de livraison' : `Modifier ${formData.blNumber}`}
                </h1>
              </div>
            </div>
            {/* Global margin setting */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Percent className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Marge défaut:</span>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={defaultMargin}
                  onChange={e => setDefaultMargin(Number(e.target.value) || 0)}
                  className="w-16 h-7 text-center text-sm px-1"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <Button variant="outline" onClick={() => { setViewMode('list'); resetBLForm(); }}>Annuler</Button>
              <Button onClick={handleSubmitBL} className="bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-2" />Enregistrer
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
          {/* Infos générales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Informations générales</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>N° BL *</Label>
                <Input value={formData.blNumber} onChange={e => setFormData(f => ({ ...f, blNumber: e.target.value }))} className="mt-2" />
              </div>
              <div>
                <Label>Fournisseur *</Label>
                <Input value={formData.supplierName} onChange={e => setFormData(f => ({ ...f, supplierName: e.target.value }))} placeholder="Nom du fournisseur" className="mt-2" />
              </div>
              <div>
                <Label>N° Commande fournisseur</Label>
                <Input value={formData.supplierOrderNumber} onChange={e => setFormData(f => ({ ...f, supplierOrderNumber: e.target.value }))} placeholder="Optionnel" className="mt-2" />
              </div>
              <div>
                <Label>Date de livraison *</Label>
                <Input type="date" value={formData.deliveryDate} onChange={e => setFormData(f => ({ ...f, deliveryDate: e.target.value }))} className="mt-2" />
              </div>
              <div>
                <Label>Livreur</Label>
                <Input value={formData.deliveryPerson} onChange={e => setFormData(f => ({ ...f, deliveryPerson: e.target.value }))} placeholder="Nom du livreur" className="mt-2" />
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Articles ({formData.items.length})</h2>
              <Button onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Ajouter un article
              </Button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-3">Aucun article</p>
                <Button onClick={handleAddItem} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />Ajouter le premier article
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const ht  = item.quantityReceived * item.unitPrice;
                  const ttc = ht + (item.taxAmount || 0);
                  const searchQ = itemSearches[index] || '';
                  const autoM   = itemAutoMargin[index] ?? true;
                  const medResults = searchQ.length >= 2
                    ? allMedicines.filter(m => m.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 6)
                    : [];

                  return (
                    <div key={index} className={`border-2 rounded-xl p-4 space-y-3 relative transition-colors ${item.priceChanged ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'}`}>
                      {/* Price-change badge */}
                      {item.priceChanged && (
                        <div className="absolute top-3 right-12 flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          <TriangleAlert className="w-3 h-3" />
                          Prix modifié: {item.previousSellingPrice?.toLocaleString('fr-FR')} F → {item.sellingPrice?.toLocaleString('fr-FR')} F
                        </div>
                      )}

                      <button onClick={() => handleRemoveItem(index)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Row 1: Médicament + quantités */}
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Médicament *</Label>
                          <div className="relative mt-1">
                            <Input
                              value={item.medicineName || searchQ}
                              onChange={e => {
                                handleItemChange(index, 'medicineName', e.target.value);
                                setItemSearches(s => { const n = [...s]; n[index] = e.target.value; return n; });
                              }}
                              placeholder="Tapez pour rechercher..."
                            />
                            {item.currentStock !== undefined && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Boxes className="w-3 h-3" />
                                Stock actuel: <span className="font-medium text-gray-700">{item.currentStock} unités</span>
                                {' '}→ après BL: <span className="font-medium text-teal-700">{item.currentStock + item.quantityReceived} unités</span>
                              </div>
                            )}
                            {medResults.length > 0 && (
                              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                {medResults.map(m => (
                                  <button key={m.id} onClick={() => handleSelectMedicineForItem(index, m)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-teal-50 text-left text-sm border-b border-gray-100 last:border-0">
                                    <div>
                                      <p className="font-medium text-gray-900">{m.name}</p>
                                      <p className="text-xs text-gray-500">{m.category} • Prix actuel: {m.price.toLocaleString('fr-FR')} F</p>
                                    </div>
                                    <span className="text-xs text-gray-400">Stock: {m.quantity}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Qté commandée</Label>
                          <Input type="number" min={0} value={item.quantityOrdered}
                            onChange={e => handleItemChange(index, 'quantityOrdered', parseInt(e.target.value) || 0)}
                            className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Qté reçue *</Label>
                          <Input type="number" min={0} value={item.quantityReceived}
                            onChange={e => handleItemChange(index, 'quantityReceived', parseInt(e.target.value) || 0)}
                            className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-xs">Écart</Label>
                          <div className={`mt-1 px-3 py-2 rounded-lg text-center font-bold text-sm ${
                            !item.discrepancy || item.discrepancy === 0 ? 'bg-gray-100 text-gray-500' :
                            item.discrepancy > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {(item.discrepancy ?? 0) > 0 ? '+' : ''}{item.discrepancy ?? 0}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Prix */}
                      <div className="grid grid-cols-5 gap-3">
                        <div>
                          <Label className="text-xs">Prix grossiste (F)</Label>
                          <Input type="number" min={0} value={item.unitPrice}
                            onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="mt-1" />
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs">Prix de vente (F)</Label>
                            <button onClick={() => reapplyAutoMargin(index)}
                              title={`Recalculer avec ${defaultMargin}% de marge`}
                              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                                autoM ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-teal-100 hover:text-teal-700'
                              }`}>
                              <RefreshCw className="w-3 h-3" />
                              Auto {defaultMargin}%
                            </button>
                          </div>
                          <Input type="number" min={0} value={item.sellingPrice ?? 0}
                            onChange={e => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className={`mt-0 ${item.priceChanged ? 'border-amber-400 focus-visible:ring-amber-300' : ''}`} />
                          {item.unitPrice > 0 && item.sellingPrice != null && item.sellingPrice > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Marge: {(((item.sellingPrice - item.unitPrice) / item.unitPrice) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Taxe</Label>
                          <select
                            value={item.taxRate ?? 0}
                            onChange={e => handleItemChange(index, 'taxRate', Number(e.target.value))}
                            className="mt-1 w-full h-10 px-2 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-ring"
                          >
                            {TAX_PRESETS.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                            {/* Allow custom value */}
                            {!TAX_PRESETS.find(t => t.value === item.taxRate) && item.taxRate! > 0 && (
                              <option value={item.taxRate}>{item.taxRate}% (personnalisé)</option>
                            )}
                          </select>
                        </div>
                        <div className="space-y-1 pt-6">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>HT:</span><span className="font-medium">{ht.toLocaleString('fr-FR')} F</span>
                          </div>
                          {(item.taxAmount || 0) > 0 && (
                            <div className="flex justify-between text-xs text-orange-600">
                              <span>Taxe:</span><span className="font-medium">+{item.taxAmount?.toLocaleString('fr-FR')} F</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-teal-700 border-t pt-1">
                            <span>TTC:</span><span>{ttc.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Lot + Expiration */}
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">N° Lot</Label>
                          <Input value={item.batchNumber || ''} onChange={e => handleItemChange(index, 'batchNumber', e.target.value)}
                            placeholder="LOT2024-001" className="mt-1" />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Date d'expiration</Label>
                          <Input type="date" className="mt-1"
                            value={item.expirationDate ? (typeof item.expirationDate === 'string' ? item.expirationDate : new Date(item.expirationDate).toISOString().split('T')[0]) : ''}
                            onChange={e => handleItemChange(index, 'expirationDate', e.target.value || undefined)} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totaux */}
            {formData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total HT</span>
                  <span className="font-semibold">{totals.ht.toLocaleString('fr-FR')} FCFA</span>
                </div>
                {totals.tax > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Total taxes</span>
                    <span className="font-semibold">+{totals.tax.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-teal-700 pt-2 border-t">
                  <span>Total TTC</span>
                  <span>{totals.ttc.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-3">Notes (optionnel)</h2>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              placeholder="Remarques sur cette livraison..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE AJOUT / ÉDITION RETOUR
  // ════════════════════════════════════════════════════════════════════════════
  if ((retourViewMode === 'add' || retourViewMode === 'edit') && mainTab === 'retours') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setRetourViewMode('list'); resetRetourForm(); }}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                {retourViewMode === 'add' ? 'Nouveau retour fournisseur' : `Modifier ${selectedRetour?.retourNumber}`}
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setRetourViewMode('list'); resetRetourForm(); }}>Annuler</Button>
              <Button onClick={handleSubmitRetour} className="bg-orange-600 hover:bg-orange-700">
                <Save className="w-4 h-4 mr-2" />Enregistrer le retour
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-6 space-y-6">
          {/* Infos retour */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Informations du retour</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label>Fournisseur *</Label>
                <Input value={retourForm.supplierName} onChange={e => setRetourForm(f => ({ ...f, supplierName: e.target.value }))} placeholder="Nom du fournisseur" className="mt-2" />
              </div>
              <div>
                <Label>BL d'origine (optionnel)</Label>
                <select
                  value={retourForm.blId}
                  onChange={e => {
                    const bl = bls.find(b => b.id === e.target.value);
                    setRetourForm(f => ({ ...f, blId: e.target.value, blNumber: bl?.blNumber || '', supplierName: bl?.supplierName || f.supplierName }));
                  }}
                  className="mt-2 w-full h-10 px-3 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-ring"
                >
                  <option value="">— Aucun BL —</option>
                  {bls.filter(b => b.status === 'Validé').map(b => (
                    <option key={b.id} value={b.id}>{b.blNumber} — {b.supplierName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date du retour</Label>
                <Input type="date" value={retourForm.returnDate} onChange={e => setRetourForm(f => ({ ...f, returnDate: e.target.value }))} className="mt-2" />
              </div>
            </div>
          </div>

          {/* Articles retournés */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Articles retournés ({retourForm.items.length})</h2>
              <Button onClick={handleAddRetourItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />Ajouter
              </Button>
            </div>

            {retourForm.items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <ArrowRightLeft className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">Aucun article à retourner</p>
                <Button onClick={handleAddRetourItem} variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {retourForm.items.map((item, index) => {
                  const searchQ   = retourItemSearches[index] || '';
                  const medResults = searchQ.length >= 2
                    ? allMedicines.filter(m => m.name.toLowerCase().includes(searchQ.toLowerCase())).slice(0, 5)
                    : [];
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 grid grid-cols-6 gap-3 relative">
                      <button onClick={() => handleRemoveRetourItem(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                      <div className="col-span-2">
                        <Label className="text-xs">Médicament *</Label>
                        <div className="relative mt-1">
                          <Input
                            value={item.medicineName || searchQ}
                            onChange={e => {
                              handleRetourItemChange(index, 'medicineName', e.target.value);
                              setRetourItemSearches(s => { const n = [...s]; n[index] = e.target.value; return n; });
                            }}
                            placeholder="Rechercher..."
                          />
                          {medResults.length > 0 && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                              {medResults.map(m => (
                                <button key={m.id} onClick={() => handleSelectMedicineForRetour(index, m)}
                                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-orange-50 text-left text-sm border-b last:border-0">
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-xs text-gray-400">{m.price.toLocaleString('fr-FR')} F</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Quantité</Label>
                        <Input type="number" min={1} value={item.quantity} className="mt-1"
                          onChange={e => handleRetourItemChange(index, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                      <div>
                        <Label className="text-xs">Prix unit.</Label>
                        <Input type="number" min={0} value={item.unitPrice} className="mt-1"
                          onChange={e => handleRetourItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-xs">Motif *</Label>
                        <select value={item.reason}
                          onChange={e => handleRetourItemChange(index, 'reason', e.target.value as RetourReason)}
                          className="mt-1 w-full h-10 px-2 bg-gray-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-ring">
                          {RETOUR_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <div className="mt-1 h-10 px-3 flex items-center bg-orange-50 rounded-xl font-bold text-orange-700 text-sm">
                          {item.totalAmount.toLocaleString('fr-FR')} F
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">N° Lot</Label>
                        <Input value={item.batchNumber || ''} className="mt-1"
                          onChange={e => handleRetourItemChange(index, 'batchNumber', e.target.value)} placeholder="Optionnel" />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Observations</Label>
                        <Input value={item.notes || ''} className="mt-1"
                          onChange={e => handleRetourItemChange(index, 'notes', e.target.value)} placeholder="Optionnel" />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-2 text-lg font-bold text-orange-700 border-t">
                  <span>Total retour</span>
                  <span>{retourForm.items.reduce((s, i) => s + i.totalAmount, 0).toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Label>Notes / Observations</Label>
            <textarea value={retourForm.notes} onChange={e => setRetourForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Motif global du retour, instructions fournisseur..."
              className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE LISTE (BL + Retours avec onglets)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header + Tabs */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h1>
            <p className="text-sm text-gray-500 mt-1">{bls.length} bon(s) de livraison</p>
          </div>
          {mainTab === 'bl' ? (
            <Button onClick={() => { resetBLForm(); setViewMode('add'); }} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />Nouveau BL
            </Button>
          ) : (
            <Button onClick={() => { resetRetourForm(); setRetourViewMode('add'); }} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />Nouveau retour
            </Button>
          )}
        </div>
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button onClick={() => setMainTab('bl')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mainTab === 'bl' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Truck className="w-4 h-4" />Bons de livraison
          </button>
          <button onClick={() => setMainTab('retours')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mainTab === 'retours' ? 'border-b-2 border-orange-500 text-orange-700 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <ArrowRightLeft className="w-4 h-4" />Retours fournisseur
            {retours.filter(r => r.status === 'En attente').length > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {retours.filter(r => r.status === 'En attente').length}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── TAB: Bons de livraison ── */}
      {mainTab === 'bl' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'En attente', count: stats.enAttente, color: 'yellow', Icon: Clock },
              { label: 'Vérifiés',   count: stats.verifie,   color: 'blue',   Icon: Eye },
              { label: 'Validés',    count: stats.valide,    color: 'green',  Icon: CheckCircle },
              { label: 'Litiges',    count: stats.litige,    color: 'red',    Icon: AlertTriangle },
              { label: 'Avec écarts',count: stats.withDiscrepancies, color: 'orange', Icon: TrendingDown },
            ].map(({ label, count, color, Icon }, i) => (
              <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-${color}-100 rounded-lg`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Rechercher par N° BL, fournisseur..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {(['all','En attente','Vérifié','Validé','Litige'] as const).map(s => (
                <Button key={s} variant={filterStatus === s ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(s)} size="sm">
                  {s === 'all' ? 'Tous' : s}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste BLs */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredBLs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun bon de livraison trouvé</p>
                </div>
              ) : (
                filteredBLs.map((bl, index) => {
                  const StatusIcon = getStatusIcon(bl.status);
                  const hasPriceChange = bl.items.some(i => i.priceChanged);
                  return (
                    <motion.div key={bl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.04 }}
                      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">{bl.blNumber}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bl.status)}`}>
                              <StatusIcon className="w-3 h-3 inline mr-1" />{bl.status}
                            </span>
                            {bl.hasDiscrepancies && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />Écarts
                              </span>
                            )}
                            {hasPriceChange && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <TriangleAlert className="w-3 h-3 inline mr-1" />Prix modifiés
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />{bl.supplierName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                            <Calendar className="w-3.5 h-3.5" />{new Date(bl.deliveryDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-base font-bold text-teal-600 mt-1">{bl.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                          {bl.tax > 0 && <p className="text-xs text-gray-400">dont {bl.tax.toLocaleString('fr-FR')} F taxes</p>}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />{bl.items.length} article(s)
                        {bl.deliveryPerson && <><span>•</span><User2 className="w-3.5 h-3.5" />{bl.deliveryPerson}</>}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedBL(bl); setViewMode('details'); }}>
                          <Eye className="w-3.5 h-3.5 mr-1" />Détails
                        </Button>
                        {bl.supplierOrderNumber && (
                          <Button variant="outline" size="sm" onClick={() => handleCompare(bl)} className="text-purple-600">
                            <FileCheck className="w-3.5 h-3.5 mr-1" />Comparer
                          </Button>
                        )}
                        {bl.status === 'En attente' && (
                          <Button variant="outline" size="sm" onClick={() => handleVerify(bl.id)} className="text-blue-600">Vérifier</Button>
                        )}
                        {bl.status === 'Vérifié' && (
                          <Button variant="outline" size="sm" onClick={() => handleValidate(bl.id)} className="text-green-600">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />Valider + MAJ stock
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEditBL(bl)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBL(bl.id)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ── TAB: Retours fournisseur ── */}
      {mainTab === 'retours' && (
        <>
          {retours.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <ArrowRightLeft className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucun retour fournisseur enregistré</p>
              <Button onClick={() => { resetRetourForm(); setRetourViewMode('add'); }} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />Créer un retour
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {retours.map((r, index) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{r.retourNumber}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${RETOUR_STATUS_COLORS[r.status]}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />{r.supplierName}
                        {r.blNumber && <><span className="mx-1">·</span><span className="text-xs text-gray-400">BL: {r.blNumber}</span></>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{new Date(r.returnDate).toLocaleDateString('fr-FR')}</p>
                      <p className="text-base font-bold text-orange-600 mt-1">{r.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1">
                    {r.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-orange-50 rounded-lg px-3 py-1.5">
                        <span className="text-gray-700">{item.medicineName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">×{item.quantity}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.reason === 'Périmé' ? 'bg-red-100 text-red-700' :
                            item.reason === 'Endommagé' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status update */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={r.status}
                      onChange={e => {
                        retourService.update(r.id, { status: e.target.value as RetourFournisseur['status'] });
                        setRetours(retourService.list());
                      }}
                      className="h-8 px-3 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-ring"
                    >
                      {(['En attente','Envoyé','Accepté','Refusé'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => handleEditRetour(r)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteRetour(r.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
