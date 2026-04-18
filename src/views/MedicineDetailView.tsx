import { useState, useMemo } from 'react';
import {
  ArrowLeft, Edit2, Save, X, Package, MapPin, Calendar,
  TrendingUp, AlertTriangle, History, Activity, ChevronRight,
  Pill, Tag, Building2, FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { Medicine } from '@/models/Medicine';
import type { User } from '@/models/User';
import { activityService } from '@/services/activityService';
import { medicineHistoryService } from '@/services/medicineHistoryService';
import { toast } from 'sonner';

interface Props {
  medicine: Medicine;
  allMedicines: Medicine[];
  currentUser: User;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Medicine>) => void;
  onViewHistory: (medicine: Medicine) => void;
}

type EditSection = 'info' | 'stock' | 'price' | null;

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

const STATUS_STYLE: Record<string, string> = {
  OK:       'bg-green-100 text-green-700',
  Low:      'bg-orange-100 text-orange-700',
  Expiring: 'bg-yellow-100 text-yellow-700',
  Expired:  'bg-red-100 text-red-700',
  Negative: 'bg-red-100 text-red-800',
};

export function MedicineDetailView({ medicine, allMedicines, currentUser, onBack, onUpdate, onViewHistory }: Props) {
  const isAdmin = currentUser.role === 'Admin';

  // ── Édit info ──
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    name: medicine.name,
    brandName: medicine.brandName ?? '',
    moleculeName: medicine.moleculeName ?? '',
    category: medicine.category,
    manufacturer: medicine.manufacturer ?? '',
    description: medicine.description ?? '',
    location: medicine.location ?? '',
    batchNumber: medicine.batchNumber,
    expirationDate: medicine.expirationDate,
  });

  // ── Ajustement stock ──
  const [adjusting, setAdjusting] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');

  // ── Édit prix (admin only) ──
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceForm, setPriceForm] = useState({
    price: medicine.price,
    purchasePriceWholesale: (medicine as any).purchasePriceWholesale ?? 0,
  });

  // ── Équivalents thérapeutiques ──
  const equivalents = useMemo(() =>
    medicine.moleculeName
      ? allMedicines.filter(m => m.id !== medicine.id && m.moleculeName === medicine.moleculeName)
      : [],
    [medicine, allMedicines]
  );

  // ── Activité récente ──
  const recentActivity = useMemo(
    () => activityService.getByTarget(medicine.id).slice(0, 8),
    [medicine.id]
  );

  // ── Handlers ──
  const saveInfo = () => {
    const before = { name: medicine.name, brandName: medicine.brandName, moleculeName: medicine.moleculeName };
    const after  = { name: infoForm.name, brandName: infoForm.brandName, moleculeName: infoForm.moleculeName };
    onUpdate(medicine.id, infoForm);
    activityService.log({
      action: 'medicine_edit',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      targetId: medicine.id,
      targetName: medicine.name,
      detail: `Infos modifiées`,
      before,
      after,
    });
    setEditingInfo(false);
    toast.success('Informations mises à jour');
  };

  const saveStock = () => {
    if (adjustDelta === 0) { setAdjusting(false); return; }
    const newQty = medicine.quantity + adjustDelta;
    const newStatus: Medicine['status'] =
      newQty < 0  ? 'Negative' :
      newQty < 20 ? 'Low'      : 'OK';
    onUpdate(medicine.id, { quantity: newQty, status: newStatus });
    activityService.log({
      action: 'stock_adjust',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      targetId: medicine.id,
      targetName: medicine.name,
      detail: `Stock ${adjustDelta > 0 ? '+' : ''}${adjustDelta} → ${newQty} unités${adjustNote ? ` (${adjustNote})` : ''}`,
      before: { quantity: medicine.quantity },
      after:  { quantity: newQty },
    });
    medicineHistoryService.recordRestock({
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantityAdded: adjustDelta,
      quantityAfter: newQty,
      userId: currentUser.id,
      userName: currentUser.fullName,
    });
    setAdjusting(false);
    setAdjustDelta(0);
    setAdjustNote('');
    toast.success(`Stock ajusté : ${newQty} unités`);
  };

  const savePrice = () => {
    const before = { price: medicine.price };
    onUpdate(medicine.id, priceForm);
    activityService.log({
      action: 'medicine_price_change',
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role,
      targetId: medicine.id,
      targetName: medicine.name,
      detail: `Prix vente : ${fmt(before.price)} → ${fmt(priceForm.price)} FCFA`,
      before,
      after: { price: priceForm.price },
    });
    medicineHistoryService.recordPriceChange({
      medicineId: medicine.id,
      medicineName: medicine.name,
      sellingPriceBefore: before.price,
      sellingPriceAfter: priceForm.price,
      userId: currentUser.id,
      userName: currentUser.fullName,
    });
    setEditingPrice(false);
    toast.success('Prix mis à jour');
  };

  const daysToExpiry = medicine.expirationDate
    ? Math.ceil((new Date(medicine.expirationDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          Médicaments
        </Button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">{medicine.name}</h2>
          {medicine.moleculeName && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              {medicine.moleculeName}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[medicine.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {medicine.status === 'Negative' ? 'Stock négatif' : medicine.status}
        </span>
        <Button variant="outline" size="sm" onClick={() => onViewHistory(medicine)} className="gap-1.5">
          <History className="w-4 h-4" />
          Historique
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">

        {/* ── Colonne principale ── */}
        <div className="col-span-2 space-y-5">

          {/* Fiche identité */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" /> Identité produit
              </h3>
              {!editingInfo && (
                <Button variant="ghost" size="sm" onClick={() => setEditingInfo(true)} className="gap-1.5 text-teal-600">
                  <Edit2 className="w-3.5 h-3.5" /> Modifier
                </Button>
              )}
            </div>
            <div className="p-6">
              {editingInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Nom commercial *</Label>
                      <Input value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Nom de marque</Label>
                      <Input value={infoForm.brandName} onChange={e => setInfoForm(f => ({ ...f, brandName: e.target.value }))} className="h-9 bg-white border border-gray-200" placeholder="ex: Doliprane" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Principe actif (molécule)</Label>
                      <Input value={infoForm.moleculeName} onChange={e => setInfoForm(f => ({ ...f, moleculeName: e.target.value }))} className="h-9 bg-white border border-gray-200" placeholder="ex: Paracétamol" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Catégorie</Label>
                      <Input value={infoForm.category} onChange={e => setInfoForm(f => ({ ...f, category: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Fabricant</Label>
                      <Input value={infoForm.manufacturer} onChange={e => setInfoForm(f => ({ ...f, manufacturer: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Emplacement</Label>
                      <Input value={infoForm.location} onChange={e => setInfoForm(f => ({ ...f, location: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">N° de lot</Label>
                      <Input value={infoForm.batchNumber} onChange={e => setInfoForm(f => ({ ...f, batchNumber: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Date expiration</Label>
                      <Input type="date" value={infoForm.expirationDate} onChange={e => setInfoForm(f => ({ ...f, expirationDate: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Description</Label>
                      <Input value={infoForm.description} onChange={e => setInfoForm(f => ({ ...f, description: e.target.value }))} className="h-9 bg-white border border-gray-200" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveInfo} className="bg-teal-600 hover:bg-teal-700 gap-1.5">
                      <Save className="w-3.5 h-3.5" /> Enregistrer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { icon: Tag,       label: 'Nom commercial',  value: medicine.name },
                    { icon: FlaskConical, label: 'Principe actif', value: medicine.moleculeName ?? '—' },
                    { icon: Pill,      label: 'Marque',          value: medicine.brandName ?? '—' },
                    { icon: Package,   label: 'Catégorie',       value: medicine.category },
                    { icon: Building2, label: 'Fabricant',       value: medicine.manufacturer ?? '—' },
                    { icon: MapPin,    label: 'Emplacement',     value: medicine.location ?? '—' },
                    { icon: Package,   label: 'N° de lot',       value: medicine.batchNumber },
                    { icon: Calendar,  label: 'Expiration',      value: medicine.expirationDate
                        ? `${new Date(medicine.expirationDate).toLocaleDateString('fr-FR')}${daysToExpiry !== null ? ` (${daysToExpiry > 0 ? `dans ${daysToExpiry}j` : 'expiré'})` : ''}` : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-800">{value}</p>
                      </div>
                    </div>
                  ))}
                  {medicine.description && (
                    <div className="col-span-2 flex items-start gap-2 pt-1 border-t border-gray-100">
                      <Package className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Description</p>
                        <p className="text-sm text-gray-700">{medicine.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Équivalents thérapeutiques */}
          {equivalents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Équivalents thérapeutiques — {medicine.moleculeName}
                </h3>
                <span className="ml-auto text-xs bg-purple-50 text-purple-600 font-medium px-2 py-0.5 rounded-full">
                  {equivalents.length} autre{equivalents.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {equivalents.map(eq => (
                  <div key={eq.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{eq.name}</p>
                      <p className="text-xs text-gray-400">{eq.manufacturer} · {eq.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{fmt(eq.price)} FCFA</p>
                      <p className={`text-xs font-medium ${eq.quantity < 0 ? 'text-red-600' : eq.quantity < 20 ? 'text-orange-600' : 'text-green-600'}`}>
                        {eq.quantity} unités
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activité récente */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Activité récente</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                Aucune activité enregistrée pour ce produit
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivity.map(entry => (
                  <div key={entry.id} className="px-6 py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{entry.detail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {entry.userName} · {entry.userRole} ·{' '}
                        {new Date(entry.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="space-y-5">

          {/* Stock */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Stock actuel</h3>
              {!adjusting && (
                <Button variant="ghost" size="sm" onClick={() => setAdjusting(true)} className="text-xs text-teal-600 gap-1">
                  <Edit2 className="w-3 h-3" /> Ajuster
                </Button>
              )}
            </div>
            <div className="p-5">
              <div className={`text-4xl font-bold mb-1 ${medicine.quantity < 0 ? 'text-red-600' : medicine.quantity < 20 ? 'text-orange-600' : 'text-gray-900'}`}>
                {medicine.quantity}
                <span className="text-base font-normal text-gray-400 ml-1">unités</span>
              </div>
              {medicine.quantity < 0 && (
                <p className="text-xs text-red-500 flex items-center gap-1 mb-3">
                  <AlertTriangle className="w-3 h-3" /> Stock négatif — erreur à corriger
                </p>
              )}
              {medicine.quantity >= 0 && medicine.quantity < 20 && (
                <p className="text-xs text-orange-500 flex items-center gap-1 mb-3">
                  <AlertTriangle className="w-3 h-3" /> Stock bas
                </p>
              )}

              <AnimatePresence>
                {adjusting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-3"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Variation (+ entrée / − sortie)</Label>
                      <Input
                        type="number"
                        value={adjustDelta}
                        onChange={e => setAdjustDelta(parseInt(e.target.value) || 0)}
                        className="h-9 bg-white border border-gray-200 text-center font-semibold"
                        placeholder="ex: -5 ou +50"
                      />
                      <p className="text-xs text-gray-400 text-center">
                        Nouveau stock : <span className={`font-semibold ${medicine.quantity + adjustDelta < 0 ? 'text-red-600' : 'text-gray-800'}`}>{medicine.quantity + adjustDelta}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Motif (optionnel)</Label>
                      <Input
                        value={adjustNote}
                        onChange={e => setAdjustNote(e.target.value)}
                        className="h-9 bg-white border border-gray-200"
                        placeholder="ex: Inventaire, casse..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveStock} className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs">
                        Confirmer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAdjusting(false); setAdjustDelta(0); }} className="text-xs">
                        Annuler
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Prix */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" /> Prix
              </h3>
              {isAdmin && !editingPrice && (
                <Button variant="ghost" size="sm" onClick={() => setEditingPrice(true)} className="text-xs text-teal-600 gap-1">
                  <Edit2 className="w-3 h-3" /> Modifier
                </Button>
              )}
              {!isAdmin && <span className="text-xs text-gray-400">Admin requis</span>}
            </div>
            <div className="p-5 space-y-3">
              {editingPrice ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Prix de vente (FCFA)</Label>
                    <Input type="number" step="0.01" value={priceForm.price} onChange={e => setPriceForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="h-9 bg-white border border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Prix d'achat grossiste (FCFA)</Label>
                    <Input type="number" step="0.01" value={priceForm.purchasePriceWholesale} onChange={e => setPriceForm(f => ({ ...f, purchasePriceWholesale: parseFloat(e.target.value) || 0 }))} className="h-9 bg-white border border-gray-200" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={savePrice} className="flex-1 bg-teal-600 hover:bg-teal-700 text-xs gap-1">
                      <Save className="w-3 h-3" /> Enregistrer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPrice(false)} className="text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Prix de vente</span>
                    <span className="text-lg font-bold text-teal-700">{fmt(medicine.price)} FCFA</span>
                  </div>
                  {(medicine as any).purchasePriceWholesale > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Prix grossiste</span>
                      <span className="text-sm font-medium text-gray-700">{fmt((medicine as any).purchasePriceWholesale)} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Valeur stock</span>
                    <span className="text-sm font-semibold text-gray-800">{fmt(medicine.price * medicine.quantity)} FCFA</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lien historique */}
          <button
            onClick={() => onViewHistory(medicine)}
            className="w-full bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between hover:border-teal-300 hover:bg-teal-50 transition-colors group"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-teal-700">
              <History className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
              Voir l'historique complet
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
