import { useState, useMemo, useCallback } from 'react';
import {
  AlertTriangle, Package, Clock, XCircle, TrendingDown,
  ShoppingCart, Search, X, Edit2, Check, ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useMedicines } from '@/controllers/medicineController';
import { settingsService } from '@/services/settingsService';
import type { Medicine } from '@/models/Medicine';
import { toast } from 'sonner';

type AlertTab = 'all' | 'rupture' | 'low' | 'expiring' | 'expired' | 'order';

const TABS: { id: AlertTab; label: string; icon: any; color: string }[] = [
  { id: 'all',      label: 'Tous',               icon: AlertTriangle, color: 'text-gray-600' },
  { id: 'rupture',  label: 'Ruptures',            icon: XCircle,       color: 'text-red-600'    },
  { id: 'low',      label: 'Stock bas',           icon: TrendingDown,  color: 'text-orange-600' },
  { id: 'expiring', label: 'Péremption proche',   icon: Clock,         color: 'text-amber-600'  },
  { id: 'expired',  label: 'Expirés',             icon: XCircle,       color: 'text-red-700'    },
  { id: 'order',    label: 'Suggestions commande',icon: ShoppingCart,  color: 'text-violet-600' },
];

// ── MinStock inline editor ───────────────────────────────────────────────────
function MinStockCell({ medicine, onSave }: { medicine: Medicine; onSave: (id: string, val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(medicine.minStock ?? ''));

  const commit = () => {
    const val = parseInt(draft);
    if (!isNaN(val) && val >= 0) {
      onSave(medicine.id, val);
      toast.success(`Seuil mis à jour : ${val} unités`);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
          className="w-20 h-7 text-xs text-center px-1"
        />
        <button onClick={commit} className="text-green-600 hover:text-green-700">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(medicine.minStock ?? '')); setEditing(true); }}
      className="flex items-center gap-1.5 text-xs group"
    >
      {medicine.minStock !== undefined ? (
        <span className="font-semibold text-gray-700">{medicine.minStock} u.</span>
      ) : (
        <span className="text-gray-400 italic">— définir</span>
      )}
      <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
}

// ── Ligne de médicament ──────────────────────────────────────────────────────
function MedicineRow({
  medicine, badges, onSaveMinStock,
}: {
  medicine: Medicine;
  badges: { label: string; bg: string; text: string }[];
  onSaveMinStock: (id: string, val: number) => void;
}) {
  const daysToExpiry = useMemo(() => {
    if (!medicine.expirationDate) return null;
    return Math.ceil((new Date(medicine.expirationDate).getTime() - Date.now()) / 86400000);
  }, [medicine.expirationDate]);

  const needsOrder = medicine.minStock !== undefined && medicine.quantity < medicine.minStock;
  const suggestedQty = needsOrder ? medicine.minStock! - medicine.quantity : 0;

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${needsOrder ? 'bg-violet-50/40' : ''}`}>
      {/* Produit */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            medicine.quantity <= 0 ? 'bg-red-100' :
            medicine.quantity < 20 ? 'bg-orange-100' : 'bg-gray-100'
          }`}>
            <Package className={`w-4 h-4 ${
              medicine.quantity <= 0 ? 'text-red-600' :
              medicine.quantity < 20 ? 'text-orange-600' : 'text-gray-500'
            }`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{medicine.name}</p>
            {medicine.moleculeName && (
              <p className="text-xs text-purple-600 flex items-center gap-0.5">
                <FlaskConical className="w-3 h-3" />{medicine.moleculeName}
              </p>
            )}
            {!medicine.moleculeName && medicine.manufacturer && (
              <p className="text-xs text-gray-400">{medicine.manufacturer}</p>
            )}
          </div>
        </div>
      </td>

      {/* Catégorie */}
      <td className="px-4 py-3 text-xs text-gray-500">{medicine.category}</td>

      {/* Badges alertes */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {badges.map(b => (
            <span key={b.label} className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.bg} ${b.text}`}>
              {b.label}
            </span>
          ))}
        </div>
      </td>

      {/* Quantité */}
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-bold ${
          medicine.quantity <= 0 ? 'text-red-600' :
          medicine.quantity < 20 ? 'text-orange-600' : 'text-gray-800'
        }`}>
          {medicine.quantity}
        </span>
      </td>

      {/* Expiration */}
      <td className="px-4 py-3 text-center text-xs">
        {medicine.expirationDate ? (
          <span className={
            daysToExpiry !== null && daysToExpiry < 0 ? 'text-red-600 font-semibold' :
            daysToExpiry !== null && daysToExpiry <= 90 ? 'text-amber-600 font-semibold' :
            'text-gray-500'
          }>
            {new Date(medicine.expirationDate).toLocaleDateString('fr-FR')}
            {daysToExpiry !== null && daysToExpiry < 0 && (
              <span className="block text-red-500">({Math.abs(daysToExpiry)}j dépassé)</span>
            )}
            {daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= 90 && (
              <span className="block text-amber-500">(dans {daysToExpiry}j)</span>
            )}
          </span>
        ) : <span className="text-gray-300">—</span>}
      </td>

      {/* Seuil min. */}
      <td className="px-4 py-3 text-center">
        <MinStockCell medicine={medicine} onSave={onSaveMinStock} />
      </td>

      {/* Suggestion commande */}
      <td className="px-4 py-3 text-center">
        {needsOrder ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold">
            <ShoppingCart className="w-3 h-3" />
            Commander {suggestedQty} u.
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Vue principale ───────────────────────────────────────────────────────────
export function AlertsView() {
  const { medicines, updateMedicine } = useMedicines();
  const settings = settingsService.get();
  const [activeTab, setActiveTab] = useState<AlertTab>('all');
  const [search, setSearch] = useState('');

  const expiryLimit = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + settings.expiryAlertDays);
    return d;
  }, [settings.expiryAlertDays]);

  // ── Qualification des alertes par médicament ──────────────────────────────
  const classify = useCallback((m: Medicine) => {
    const now = new Date();
    const expDate = m.expirationDate ? new Date(m.expirationDate) : null;

    const isRupture  = m.quantity <= 0;
    const isLow      = m.quantity > 0 && m.quantity < settings.lowStockThreshold;
    const isExpired  = expDate ? expDate < now : false;
    const isExpiring = expDate ? !isExpired && expDate <= expiryLimit : false;
    const needsOrder = m.minStock !== undefined && m.quantity < m.minStock;

    return { isRupture, isLow, isExpired, isExpiring, needsOrder };
  }, [settings.lowStockThreshold, expiryLimit]);

  // ── Médicaments en alerte ─────────────────────────────────────────────────
  const alertMedicines = useMemo(() => {
    return medicines.filter(m => {
      const { isRupture, isLow, isExpired, isExpiring, needsOrder } = classify(m);
      return isRupture || isLow || isExpired || isExpiring || needsOrder;
    });
  }, [medicines, classify]);

  // ── Compteurs ─────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    rupture:  alertMedicines.filter(m => classify(m).isRupture).length,
    low:      alertMedicines.filter(m => classify(m).isLow).length,
    expiring: alertMedicines.filter(m => classify(m).isExpiring).length,
    expired:  alertMedicines.filter(m => classify(m).isExpired).length,
    order:    alertMedicines.filter(m => classify(m).needsOrder).length,
  }), [alertMedicines, classify]);

  // ── Filtrage par onglet + recherche ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return alertMedicines.filter(m => {
      const c = classify(m);
      const matchTab =
        activeTab === 'all'      ? true :
        activeTab === 'rupture'  ? c.isRupture :
        activeTab === 'low'      ? c.isLow :
        activeTab === 'expiring' ? c.isExpiring :
        activeTab === 'expired'  ? c.isExpired :
        activeTab === 'order'    ? c.needsOrder : true;

      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.moleculeName ?? '').toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [alertMedicines, activeTab, search, classify]);

  // ── Badges par médicament ─────────────────────────────────────────────────
  const getBadges = (m: Medicine) => {
    const { isRupture, isLow, isExpired, isExpiring } = classify(m);
    const badges: { label: string; bg: string; text: string }[] = [];
    if (isRupture)  badges.push({ label: 'Rupture',           bg: 'bg-red-100',    text: 'text-red-700'    });
    if (isLow)      badges.push({ label: 'Stock bas',         bg: 'bg-orange-100', text: 'text-orange-700' });
    if (isExpired)  badges.push({ label: 'Expiré',            bg: 'bg-red-100',    text: 'text-red-700'    });
    if (isExpiring) badges.push({ label: 'Péremption proche', bg: 'bg-amber-100',  text: 'text-amber-700'  });
    return badges;
  };

  const handleSaveMinStock = (id: string, val: number) => {
    updateMedicine(id, { minStock: val });
  };

  const tabCount = (id: AlertTab) => {
    if (id === 'all')      return alertMedicines.length;
    if (id === 'rupture')  return counts.rupture;
    if (id === 'low')      return counts.low;
    if (id === 'expiring') return counts.expiring;
    if (id === 'expired')  return counts.expired;
    if (id === 'order')    return counts.order;
    return 0;
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          Alertes Stock
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ruptures, stock bas, péremptions et suggestions de commande
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {[
          { label: 'Ruptures',           value: counts.rupture,  icon: XCircle,      bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
          { label: 'Stock bas',          value: counts.low,      icon: TrendingDown, bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
          { label: 'Péremption proche',  value: counts.expiring, icon: Clock,        bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200' },
          { label: 'Expirés',            value: counts.expired,  icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-800',    border: 'border-red-300' },
          { label: 'À commander',        value: counts.order,    icon: ShoppingCart, bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + i * 0.05 }}
              className={`bg-white rounded-xl border ${k.border} p-4 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setActiveTab(
                k.label === 'Ruptures' ? 'rupture' :
                k.label === 'Stock bas' ? 'low' :
                k.label === 'Péremption proche' ? 'expiring' :
                k.label === 'Expirés' ? 'expired' : 'order'
              )}
            >
              <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${k.text}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{k.label}</p>
              </div>
              {k.value > 0 && <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tableau */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        {/* Onglets + recherche */}
        <div className="border-b border-gray-100 px-4 pt-4 pb-0 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const count = tabCount(tab.id);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    active
                      ? 'border-orange-500 text-orange-700 bg-orange-50/60'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? tab.color : ''}`} />
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    active ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recherche */}
          <div className="relative mb-1 w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {alertMedicines.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-green-700 font-semibold text-lg">Aucune alerte active</p>
            <p className="text-sm text-gray-400 mt-1">Le stock est en bonne santé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Alertes</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Qté actuelle</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Expiration</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <span className="flex items-center justify-center gap-1">
                      Seuil min.
                      <span className="text-gray-400 font-normal normal-case">(cliquer pour modifier)</span>
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Suggestion</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Aucun produit pour ce filtre
                      </td>
                    </tr>
                  ) : (
                    filtered.map((med, i) => (
                      <motion.tr
                        key={med.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Rendu de la ligne */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              med.quantity <= 0 ? 'bg-red-100' :
                              med.quantity < settings.lowStockThreshold ? 'bg-orange-100' : 'bg-gray-100'
                            }`}>
                              <Package className={`w-4 h-4 ${
                                med.quantity <= 0 ? 'text-red-600' :
                                med.quantity < settings.lowStockThreshold ? 'text-orange-600' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{med.name}</p>
                              {med.moleculeName && (
                                <p className="text-xs text-purple-600 flex items-center gap-0.5">
                                  <FlaskConical className="w-3 h-3" />{med.moleculeName}
                                </p>
                              )}
                              {!med.moleculeName && med.manufacturer && (
                                <p className="text-xs text-gray-400">{med.manufacturer}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{med.category}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {getBadges(med).map(b => (
                              <span key={b.label} className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.bg} ${b.text}`}>
                                {b.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${
                            med.quantity <= 0 ? 'text-red-600' :
                            med.quantity < settings.lowStockThreshold ? 'text-orange-600' : 'text-gray-800'
                          }`}>
                            {med.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          {med.expirationDate ? (() => {
                            const days = Math.ceil((new Date(med.expirationDate).getTime() - Date.now()) / 86400000);
                            return (
                              <span className={
                                days < 0 ? 'text-red-600 font-semibold' :
                                days <= settings.expiryAlertDays ? 'text-amber-600 font-semibold' :
                                'text-gray-500'
                              }>
                                {new Date(med.expirationDate).toLocaleDateString('fr-FR')}
                                {days < 0 && <span className="block text-red-500">({Math.abs(days)}j dépassé)</span>}
                                {days >= 0 && days <= settings.expiryAlertDays && <span className="block text-amber-500">(dans {days}j)</span>}
                              </span>
                            );
                          })() : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <MinStockCell medicine={med} onSave={handleSaveMinStock} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {med.minStock !== undefined && med.quantity < med.minStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold">
                              <ShoppingCart className="w-3 h-3" />
                              +{med.minStock - med.quantity} u.
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Légende seuils */}
        {alertMedicines.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Rupture : qté ≤ 0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              Stock bas : qté &lt; {settings.lowStockThreshold} unités (seuil global)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Péremption : expiration dans ≤ {settings.expiryAlertDays} jours
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              Suggestion : qté &lt; seuil min. du produit
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
