import { useState, useMemo, useCallback } from 'react';
import {
  ShoppingCart, BarChart2, Package, TrendingUp, CheckCircle,
  X, Edit2, Check, Download, RefreshCw, Info, ChevronUp, ChevronDown,
  FlaskConical, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useOrders } from '@/controllers/orderController';
import { medicineService } from '@/services/medicineService';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

type Period = 1 | 3 | 7 | 14 | 30;
type Coverage = 7 | 14 | 21 | 30;
type SortKey = 'name' | 'sold' | 'avgPerDay' | 'stock' | 'coverage' | 'suggested';
type SortDir = 'asc' | 'desc';
type RowStatus = 'pending' | 'accepted' | 'ignored';

interface SuggestionRow {
  medicineId: string;
  medicineName: string;
  moleculeName?: string;
  category: string;
  soldInPeriod: number;      // unités vendues sur la période
  avgPerDay: number;         // moyenne journalière
  currentStock: number;      // stock actuel
  daysOfCoverage: number;    // nb de jours couverts par le stock actuel
  suggestedQty: number;      // suggestion calculée
  editedQty: number;         // valeur saisie par le pharmacien
  status: RowStatus;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: 1,  label: "Aujourd'hui" },
  { value: 3,  label: '3 jours'     },
  { value: 7,  label: '7 jours'     },
  { value: 14, label: '14 jours'    },
  { value: 30, label: '30 jours'    },
];

const COVERAGES: { value: Coverage; label: string }[] = [
  { value: 7,  label: '1 semaine'  },
  { value: 14, label: '2 semaines' },
  { value: 21, label: '3 semaines' },
  { value: 30, label: '1 mois'     },
];

// ── Cellule quantité éditable ─────────────────────────────────────────────────
function QtyCell({ row, onChange }: { row: SuggestionRow; onChange: (id: string, qty: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(row.editedQty));

  const commit = () => {
    const v = parseInt(draft);
    if (!isNaN(v) && v >= 0) onChange(row.medicineId, v);
    setEditing(false);
  };

  if (row.status !== 'pending') {
    return <span className="text-sm font-semibold text-gray-400">{row.editedQty}</span>;
  }

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

  const diff = row.editedQty - row.suggestedQty;
  return (
    <button
      onClick={() => { setDraft(String(row.editedQty)); setEditing(true); }}
      className="flex items-center gap-1.5 group"
    >
      <span className={`text-sm font-bold ${row.editedQty === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
        {row.editedQty}
      </span>
      {diff !== 0 && (
        <span className={`text-xs font-medium ${diff > 0 ? 'text-green-600' : 'text-orange-600'}`}>
          ({diff > 0 ? '+' : ''}{diff})
        </span>
      )}
      <Edit2 className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
}

// ── Indicateur de couverture ───────────────────────────────────────────────────
function CoverageBar({ days, target }: { days: number; target: number }) {
  const pct = Math.min(100, (days / target) * 100);
  const color = pct >= 80 ? 'bg-green-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
        {days === Infinity ? '∞' : `${days}j`}
      </span>
    </div>
  );
}

// ── Vue principale ────────────────────────────────────────────────────────────
export function OrderSuggestionsView() {
  const { orders } = useOrders();
  const [period, setPeriod]     = useState<Period>(7);
  const [coverage, setCoverage] = useState<Coverage>(14);
  const [rows, setRows]         = useState<SuggestionRow[] | null>(null);
  const [sortKey, setSortKey]   = useState<SortKey>('suggested');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');
  const [analyzed, setAnalyzed] = useState(false);

  // ── Algorithme d'analyse ──────────────────────────────────────────────────
  const analyze = useCallback(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    cutoff.setHours(0, 0, 0, 0);

    // Agréger les ventes par médicament sur la période
    const salesMap = new Map<string, { name: string; qty: number; medicineId: string }>();

    orders
      .filter(o => o.status === 'Payée' && new Date(o.createdAt) >= cutoff)
      .forEach(o => {
        o.items.forEach(item => {
          const existing = salesMap.get(item.medicineId);
          if (existing) {
            existing.qty += item.quantity;
          } else {
            salesMap.set(item.medicineId, {
              medicineId: item.medicineId,
              name: item.medicineName,
              qty: item.quantity,
            });
          }
        });
      });

    // Construire les lignes
    const medicines = medicineService.getAll();
    const medicineMap = new Map(medicines.map(m => [m.id, m]));

    const newRows: SuggestionRow[] = [];

    salesMap.forEach(({ medicineId, name, qty }) => {
      const med = medicineMap.get(medicineId);
      const currentStock = med?.quantity ?? 0;
      const avgPerDay = qty / period;
      // Qté suggérée = (avg/jour × jours de couverture cible) - stock actuel
      // minimum 1 si on a vendu quelque chose
      const rawSuggested = avgPerDay * coverage - currentStock;
      const suggestedQty = Math.max(0, Math.round(rawSuggested));
      const daysOfCoverage = avgPerDay > 0
        ? Math.min(999, Math.round(currentStock / avgPerDay))
        : Infinity;

      newRows.push({
        medicineId,
        medicineName: name,
        moleculeName: med?.moleculeName,
        category: med?.category ?? '—',
        soldInPeriod: qty,
        avgPerDay: parseFloat(avgPerDay.toFixed(2)),
        currentStock,
        daysOfCoverage,
        suggestedQty,
        editedQty: suggestedQty,
        status: 'pending',
      });
    });

    // Trier par quantité suggérée desc par défaut
    newRows.sort((a, b) => b.suggestedQty - a.suggestedQty);
    setRows(newRows);
    setAnalyzed(true);
    setSortKey('suggested');
    setSortDir('desc');
    toast.success(`Analyse terminée — ${newRows.length} produit(s) trouvé(s)`);
  }, [orders, period, coverage]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const setQty = (id: string, qty: number) =>
    setRows(prev => prev?.map(r => r.medicineId === id ? { ...r, editedQty: qty } : r) ?? null);

  const accept = (id: string) =>
    setRows(prev => prev?.map(r => r.medicineId === id ? { ...r, status: 'accepted' } : r) ?? null);

  const ignore = (id: string) =>
    setRows(prev => prev?.map(r => r.medicineId === id ? { ...r, status: 'ignored' } : r) ?? null);

  const acceptAll = () => {
    setRows(prev =>
      prev?.map(r => r.status === 'pending' && r.editedQty > 0 ? { ...r, status: 'accepted' } : r) ?? null
    );
    toast.success('Toutes les suggestions acceptées');
  };

  const reset = (id: string) =>
    setRows(prev => prev?.map(r =>
      r.medicineId === id ? { ...r, editedQty: r.suggestedQty, status: 'pending' } : r
    ) ?? null);

  // ── Tri ───────────────────────────────────────────────────────────────────
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortedRows = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'name':      va = a.medicineName; vb = b.medicineName; break;
        case 'sold':      va = a.soldInPeriod; vb = b.soldInPeriod; break;
        case 'avgPerDay': va = a.avgPerDay;    vb = b.avgPerDay;    break;
        case 'stock':     va = a.currentStock; vb = b.currentStock; break;
        case 'coverage':  va = a.daysOfCoverage === Infinity ? 9999 : a.daysOfCoverage;
                          vb = b.daysOfCoverage === Infinity ? 9999 : b.daysOfCoverage; break;
        case 'suggested': va = a.editedQty;    vb = b.editedQty;    break;
        default: return 0;
      }
      return sortDir === 'asc'
        ? (va < vb ? -1 : va > vb ? 1 : 0)
        : (va > vb ? -1 : va < vb ? 1 : 0);
    });
  }, [rows, sortKey, sortDir]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!rows) return null;
    const pending   = rows.filter(r => r.status === 'pending');
    const accepted  = rows.filter(r => r.status === 'accepted');
    const toOrder   = accepted.reduce((s, r) => s + r.editedQty, 0);
    const urgent    = rows.filter(r => r.daysOfCoverage !== Infinity && r.daysOfCoverage < 3);
    return { total: rows.length, pending: pending.length, accepted: accepted.length, toOrder, urgent: urgent.length };
  }, [rows]);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!rows) return;
    const accepted = rows.filter(r => r.status === 'accepted' && r.editedQty > 0);
    if (accepted.length === 0) { toast.error('Aucune ligne acceptée à exporter'); return; }
    const lines = [
      'Produit;Principe actif;Catégorie;Stock actuel;Qté à commander',
      ...accepted.map(r =>
        `${r.medicineName};${r.moleculeName ?? ''};${r.category};${r.currentStock};${r.editedQty}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bon-commande-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bon de commande exporté');
  };

  // ── En-tête de colonne triable ────────────────────────────────────────────
  const Th = ({ label, col }: { label: string; col: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none hover:text-gray-900 transition-colors"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === col
          ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3 text-gray-300" />
        }
      </span>
    </th>
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-violet-600" />
          Suggestions de commande
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analyse automatique des ventes pour optimiser votre prochaine commande fournisseur
        </p>
      </motion.div>

      {/* Paramètres d'analyse */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-violet-500" />
          Paramètres de l'analyse
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">

          {/* Période d'analyse */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              Analyser les ventes sur…
            </p>
            <div className="flex gap-2 flex-wrap">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => { setPeriod(p.value); setAnalyzed(false); }}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    period === p.value
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Couverture cible */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              Commander pour couvrir…
            </p>
            <div className="flex gap-2 flex-wrap">
              {COVERAGES.map(c => (
                <button
                  key={c.value}
                  onClick={() => { setCoverage(c.value); setAnalyzed(false); }}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    coverage === c.value
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton analyser */}
          <Button
            onClick={analyze}
            className="bg-violet-600 hover:bg-violet-700 h-11 px-6 shrink-0"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Analyser
          </Button>
        </div>

        {/* Info formule */}
        <div className="mt-4 bg-violet-50 border border-violet-100 rounded-lg px-4 py-2.5 flex items-start gap-2 text-xs text-violet-700">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Formule : <strong>Qté suggérée = (ventes / jour × {coverage} jours) − stock actuel</strong>.
            Les valeurs négatives (stock déjà suffisant) sont affichées à 0. Vous pouvez modifier chaque quantité librement.
          </span>
        </div>
      </motion.div>

      {/* Stats rapides (après analyse) */}
      {analyzed && stats && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Produits analysés', value: stats.total,    icon: Package,      color: 'text-gray-700',   bg: 'bg-gray-100'    },
            { label: 'En attente',         value: stats.pending,  icon: Clock,        color: 'text-violet-700', bg: 'bg-violet-100'  },
            { label: 'Acceptées',          value: stats.accepted, icon: CheckCircle,  color: 'text-green-700',  bg: 'bg-green-100'   },
            { label: 'Stock critique (< 3j)', value: stats.urgent, icon: TrendingUp,  color: 'text-red-700',    bg: 'bg-red-100'     },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div key={k.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3"
              >
                <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-gray-500">{k.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Tableau des suggestions */}
      {analyzed && rows && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{rows.length} produit(s)</span>
              <span className="text-sm text-gray-400">· analyse sur {period} jour(s) · couverture cible {coverage}j</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setRows(null); setAnalyzed(false); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Réinitialiser
              </Button>
              <Button size="sm" variant="outline" onClick={exportCSV} className="border-teal-300 text-teal-700 hover:bg-teal-50">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter CSV
              </Button>
              <Button size="sm" onClick={acceptAll} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Tout accepter
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th label="Produit"           col="name"      />
                  <Th label={`Vendu (${period}j)`} col="sold"   />
                  <Th label="Moy./jour"          col="avgPerDay" />
                  <Th label="Stock actuel"       col="stock"     />
                  <Th label="Couverture"         col="coverage"  />
                  <Th label="Qté suggérée"       col="suggested" />
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {sortedRows.map((row, i) => (
                    <motion.tr
                      key={row.medicineId}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`transition-colors ${
                        row.status === 'accepted' ? 'bg-green-50' :
                        row.status === 'ignored'  ? 'bg-gray-50 opacity-50' :
                        'hover:bg-gray-50'
                      }`}
                    >
                      {/* Produit */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-violet-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{row.medicineName}</p>
                            {row.moleculeName && (
                              <p className="text-xs text-purple-600 flex items-center gap-0.5">
                                <FlaskConical className="w-3 h-3" />{row.moleculeName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">{row.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* Vendu */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-violet-700">{row.soldInPeriod}</span>
                        <span className="text-xs text-gray-400 ml-0.5">u.</span>
                      </td>

                      {/* Moy./jour */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-700">{row.avgPerDay}</span>
                        <span className="text-xs text-gray-400 ml-0.5">/j</span>
                      </td>

                      {/* Stock actuel */}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold text-sm ${
                          row.currentStock <= 0 ? 'text-red-600' :
                          row.currentStock < 20  ? 'text-orange-600' : 'text-gray-800'
                        }`}>
                          {row.currentStock}
                        </span>
                      </td>

                      {/* Couverture */}
                      <td className="px-4 py-3">
                        <CoverageBar
                          days={row.daysOfCoverage === Infinity ? coverage : row.daysOfCoverage}
                          target={coverage}
                        />
                      </td>

                      {/* Qté suggérée (éditable) */}
                      <td className="px-4 py-3 text-center">
                        <QtyCell row={row} onChange={setQty} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {row.status === 'pending' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => accept(row.medicineId)}
                              disabled={row.editedQty === 0}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Accepter
                            </button>
                            <button
                              onClick={() => ignore(row.medicineId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Ignorer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {row.status === 'accepted' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1.5 rounded-lg">
                              <CheckCircle className="w-3 h-3" /> Accepté
                            </span>
                            <button onClick={() => reset(row.medicineId)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {row.status === 'ignored' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs text-gray-400">Ignoré</span>
                            <button onClick={() => reset(row.medicineId)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Résumé bas */}
          {stats && stats.accepted > 0 && (
            <div className="px-5 py-3 bg-green-50 border-t border-green-100 flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium">
                <strong>{stats.accepted}</strong> produit(s) accepté(s) ·{' '}
                <strong>{stats.toOrder}</strong> unités à commander au total
              </span>
              <Button size="sm" onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter le bon de commande
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* État vide après analyse */}
      {analyzed && rows && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Aucune vente trouvée</p>
          <p className="text-sm text-gray-400 mt-1">
            Aucune commande payée sur les {period} dernier(s) jour(s). Élargissez la période.
          </p>
        </div>
      )}

      {/* Invitation à analyser */}
      {!analyzed && (
        <div className="bg-white rounded-xl border border-dashed border-violet-200 p-16 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-gray-600 font-semibold text-lg">Lancez l'analyse</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Choisissez la période et la couverture cible, puis cliquez sur <strong>Analyser</strong>
          </p>
          <Button onClick={analyze} className="bg-violet-600 hover:bg-violet-700">
            <BarChart2 className="w-4 h-4 mr-2" />
            Analyser les ventes
          </Button>
        </div>
      )}

    </div>
  );
}
