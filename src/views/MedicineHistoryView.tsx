import { useMemo, useState } from 'react';
import {
  ArrowLeft, PackagePlus, TrendingUp, ShoppingCart,
  RefreshCw, Calendar, User as UserIcon, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import type { Medicine } from '@/models/Medicine';
import type { MedicineHistoryEvent } from '@/models/MedicineHistory';
import { medicineHistoryService } from '@/services/medicineHistoryService';

interface Props {
  medicine: Medicine;
  onBack: () => void;
}

const EVENT_META = {
  entry:        { label: 'Première entrée',       color: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-500',   icon: PackagePlus  },
  restock:      { label: 'Réappro.',              color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   icon: RefreshCw    },
  price_change: { label: 'Changement de prix',    color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',  icon: TrendingUp   },
  sale:         { label: 'Vente',                 color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: ShoppingCart },
} as const;

const FILTERS = [
  { key: 'all',          label: 'Tout' },
  { key: 'entry',        label: 'Entrées' },
  { key: 'restock',      label: 'Réappros' },
  { key: 'price_change', label: 'Prix' },
  { key: 'sale',         label: 'Ventes' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

const PERIODS = [
  { key: '3m',  label: '3 mois',  days: 90  },
  { key: '6m',  label: '6 mois',  days: 180 },
  { key: '1a',  label: '1 an',    days: 365 },
  { key: 'all', label: 'Tout',    days: 9999 },
] as const;
type PeriodKey = typeof PERIODS[number]['key'];

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function MedicineHistoryView({ medicine, onBack }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [period, setPeriod] = useState<PeriodKey>('1a');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allEvents = useMemo(
    () => medicineHistoryService.getByMedicineId(medicine.id),
    [medicine.id]
  );

  const monthlySales  = useMemo(() => medicineHistoryService.getMonthlySales(medicine.id),  [medicine.id]);
  const priceHistory  = useMemo(() => medicineHistoryService.getPriceHistory(medicine.id),  [medicine.id]);

  const cutoff = useMemo(() => {
    const d = new Date();
    const days = PERIODS.find(p => p.key === period)?.days ?? 365;
    d.setDate(d.getDate() - days);
    return d;
  }, [period]);

  const filtered = useMemo(() =>
    allEvents.filter(e => {
      const matchType = filter === 'all' || e.type === filter;
      const matchDate = new Date(e.date) >= cutoff;
      return matchType && matchDate;
    }),
    [allEvents, filter, cutoff]
  );

  // KPIs
  const totalSold    = allEvents.filter(e => e.type === 'sale').reduce((s, e) => s + (e.quantitySold ?? 0), 0);
  const totalRevenue = allEvents.filter(e => e.type === 'sale').reduce((s, e) => s + (e.saleTotal ?? 0), 0);
  const firstEntry   = allEvents.findLast(e => e.type === 'entry');
  const lastSale     = allEvents.find(e => e.type === 'sale');
  const priceChanges = allEvents.filter(e => e.type === 'price_change').length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-gray-600">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="h-5 w-px bg-gray-200" />
        <div>
          <h2 className="text-lg font-bold text-gray-900">{medicine.name}</h2>
          <p className="text-xs text-gray-500">{medicine.category} · {medicine.batchNumber}</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">Historique complet</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Première entrée',
              value: firstEntry ? new Date(firstEntry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—',
              sub: firstEntry ? `par ${firstEntry.userName}` : '',
              icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50',
            },
            {
              label: 'Total vendu',
              value: `${fmt(totalSold)} unités`,
              sub: lastSale ? `dernière vente ${new Date(lastSale.date).toLocaleDateString('fr-FR')}` : '',
              icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50',
            },
            {
              label: 'Chiffre d\'affaires',
              value: `${fmt(totalRevenue)} FCFA`,
              sub: `sur ${allEvents.filter(e => e.type === 'sale').length} transaction(s)`,
              icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50',
            },
            {
              label: 'Variations de prix',
              value: `${priceChanges} changement${priceChanges > 1 ? 's' : ''}`,
              sub: `Prix vente actuel : ${fmt(medicine.price)} FCFA`,
              icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50',
            },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">{value}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Ventes mensuelles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ventes mensuelles (quantités)</h3>
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlySales} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number, name: string) => [v, name === 'quantite' ? 'Unités vendues' : 'CA (FCFA)']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="quantite" fill="#14b8a6" radius={[4, 4, 0, 0]} name="quantite" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">Aucune vente enregistrée</div>
            )}
          </div>

          {/* Évolution des prix */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Évolution des prix (FCFA)</h3>
            {priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={priceHistory} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="gGros"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gVente" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="gros"  stroke="#f59e0b" fill="url(#gGros)"  name="Prix grossiste" connectNulls />
                  <Area type="monotone" dataKey="vente" stroke="#14b8a6" fill="url(#gVente)" name="Prix vente"     connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">Aucun historique de prix</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700 mr-2">Période :</span>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  period === p.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <span className="text-sm font-semibold text-gray-700 mr-2">Type :</span>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  filter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">{filtered.length} événement{filtered.length > 1 ? 's' : ''}</span>
          </div>

          {/* Events list */}
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">Aucun événement pour cette période</div>
            )}
            {filtered.map((event, i) => {
              const meta = EVENT_META[event.type];
              const Icon = meta.icon;
              const isExpanded = expandedId === event.id;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-6 py-4"
                >
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  >
                    {/* Dot + ligne */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className={`w-8 h-8 ${meta.color} rounded-lg flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {i < filtered.length - 1 && <div className="w-px h-4 bg-gray-200" />}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        <EventSummary event={event} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {event.userName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {event.userName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="text-gray-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Détail expandable */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-12 mt-3 bg-gray-50 rounded-lg p-4 text-sm"
                    >
                      <EventDetail event={event} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Résumé inline d'un événement ── */
function EventSummary({ event }: { event: MedicineHistoryEvent }) {
  switch (event.type) {
    case 'entry':
      return <span className="text-sm text-gray-700">+{event.quantityAdded} unités ajoutées (stock → {event.quantityAfter})</span>;
    case 'restock':
      return <span className="text-sm text-gray-700">Réappro +{event.quantityAdded} unités (stock → {event.quantityAfter})</span>;
    case 'price_change':
      return (
        <span className="text-sm text-gray-700">
          Prix vente{' '}
          {event.sellingPriceBefore !== undefined && (
            <span className="line-through text-gray-400">{fmt(event.sellingPriceBefore)}</span>
          )}{' '}
          → <span className="font-semibold text-teal-700">{fmt(event.sellingPriceAfter ?? 0)} FCFA</span>
        </span>
      );
    case 'sale':
      return (
        <span className="text-sm text-gray-700">
          {event.quantitySold} unité{(event.quantitySold ?? 0) > 1 ? 's' : ''} vendues ·{' '}
          <span className="font-semibold text-purple-700">{fmt(event.saleTotal ?? 0)} FCFA</span>
        </span>
      );
    default:
      return null;
  }
}

/* ── Détail complet d'un événement ── */
function EventDetail({ event }: { event: MedicineHistoryEvent }) {
  const rows: { label: string; value: string }[] = [];

  if (event.type === 'entry' || event.type === 'restock') {
    rows.push({ label: 'Quantité ajoutée', value: `+${event.quantityAdded} unités` });
    rows.push({ label: 'Stock après', value: `${event.quantityAfter} unités` });
    if (event.wholesalePriceAfter) rows.push({ label: 'Prix grossiste', value: `${fmt(event.wholesalePriceAfter)} FCFA` });
    if (event.sellingPriceAfter)   rows.push({ label: 'Prix vente',     value: `${fmt(event.sellingPriceAfter)} FCFA` });
  }

  if (event.type === 'price_change') {
    if (event.wholesalePriceBefore !== undefined)
      rows.push({ label: 'Prix grossiste avant', value: `${fmt(event.wholesalePriceBefore)} FCFA` });
    if (event.wholesalePriceAfter !== undefined)
      rows.push({ label: 'Prix grossiste après', value: `${fmt(event.wholesalePriceAfter)} FCFA` });
    if (event.sellingPriceBefore !== undefined)
      rows.push({ label: 'Prix vente avant', value: `${fmt(event.sellingPriceBefore)} FCFA` });
    if (event.sellingPriceAfter !== undefined)
      rows.push({ label: 'Prix vente après', value: `${fmt(event.sellingPriceAfter)} FCFA` });
  }

  if (event.type === 'sale') {
    rows.push({ label: 'Quantité vendue', value: `${event.quantitySold} unités` });
    rows.push({ label: 'Prix unitaire',   value: `${fmt(event.sellingPrice ?? 0)} FCFA` });
    rows.push({ label: 'Total',           value: `${fmt(event.saleTotal ?? 0)} FCFA` });
  }

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1">
      {rows.map(r => (
        <div key={r.label} className="flex justify-between gap-4">
          <span className="text-gray-500">{r.label}</span>
          <span className="font-medium text-gray-800">{r.value}</span>
        </div>
      ))}
      {event.userName && (
        <div className="flex justify-between gap-4 col-span-2 pt-1 border-t border-gray-200 mt-1">
          <span className="text-gray-500">Opérateur</span>
          <span className="font-medium text-gray-800">{event.userName}</span>
        </div>
      )}
    </div>
  );
}
