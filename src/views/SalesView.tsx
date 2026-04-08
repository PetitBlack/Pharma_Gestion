import { useState, useMemo } from 'react';
import {
  Search, ShoppingCart, CheckCircle, XCircle, Clock,
  TrendingUp, DollarSign, Package, User, CreditCard,
  Smartphone, Banknote, Eye, X, Calendar, ChevronDown,
  ArrowUpRight, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useOrders } from '@/controllers/orderController';
import type { Order } from '@/models/Order';
import type { User as AppUser } from '@/models/User';

interface SalesViewProps {
  currentUser?: AppUser;
}

export function SalesView({ currentUser }: SalesViewProps = {}) {
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Helpers de date ──────────────────────────────────────
  const isToday = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };

  const isThisMonth = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // ── Filtrage ──────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = searchQuery === '' ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.auxiliaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.cashierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.medicineName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = filterStatus === 'all' || order.status === filterStatus;

      const matchPeriod = (() => {
        if (filterPeriod === 'all') return true;
        const date = new Date(order.createdAt);
        if (filterPeriod === 'today') return isToday(date);
        if (filterPeriod === 'week') return isThisWeek(date);
        if (filterPeriod === 'month') return isThisMonth(date);
        return true;
      })();

      return matchSearch && matchStatus && matchPeriod;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, filterStatus, filterPeriod]);

  // ── Statistiques ─────────────────────────────────────────
  const stats = useMemo(() => {
    const paid = orders.filter(o => o.status === 'Payée');
    const todayPaid = paid.filter(o => isToday(new Date(o.paidAt || o.createdAt)));
    const monthPaid = paid.filter(o => isThisMonth(new Date(o.paidAt || o.createdAt)));

    const byPayment = paid.reduce((acc, o) => {
      const method = o.paymentMethod || 'Non défini';
      acc[method] = (acc[method] || 0) + o.total;
      return acc;
    }, {} as Record<string, number>);

    const topMedicine = (() => {
      const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
      paid.forEach(o => o.items.forEach(item => {
        if (!counts[item.medicineId]) counts[item.medicineId] = { name: item.medicineName, qty: 0, revenue: 0 };
        counts[item.medicineId].qty += item.quantity;
        counts[item.medicineId].revenue += item.total;
      }));
      return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    })();

    return {
      total: orders.length,
      paid: paid.length,
      pending: orders.filter(o => o.status === 'En attente').length,
      cancelled: orders.filter(o => o.status === 'Annulée').length,
      revenueToday: todayPaid.reduce((s, o) => s + o.total, 0),
      revenueMonth: monthPaid.reduce((s, o) => s + o.total, 0),
      revenueTotal: paid.reduce((s, o) => s + o.total, 0),
      avgOrder: paid.length > 0 ? paid.reduce((s, o) => s + o.total, 0) / paid.length : 0,
      byPayment,
      topMedicine,
    };
  }, [orders]);

  // ── Helpers UI ───────────────────────────────────────────
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Payée':      return { bg: 'bg-green-100 text-green-700',  icon: CheckCircle,  dot: 'bg-green-500' };
      case 'En attente': return { bg: 'bg-yellow-100 text-yellow-700', icon: Clock,         dot: 'bg-yellow-500' };
      case 'Annulée':   return { bg: 'bg-red-100 text-red-700',       icon: XCircle,       dot: 'bg-red-500' };
      default:           return { bg: 'bg-gray-100 text-gray-700',     icon: Clock,         dot: 'bg-gray-400' };
    }
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'Mobile Money':    return <Smartphone className="w-4 h-4" />;
      case 'Carte bancaire':  return <CreditCard className="w-4 h-4" />;
      default:                return <Banknote className="w-4 h-4" />;
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtDate = (d: any) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── Détail d'une commande ────────────────────────────────
  if (selectedOrder) {
    const s = getStatusStyle(selectedOrder.status);
    const StatusIcon = s.icon;
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h1>
                <p className="text-sm text-gray-500">{fmtDate(selectedOrder.createdAt)}</p>
              </div>
            </div>
            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${s.bg}`}>
              <StatusIcon className="w-4 h-4" />
              {selectedOrder.status}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

          {/* Infos principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">Créé par</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedOrder.auxiliaryName}</p>
                  <p className="text-xs text-gray-500">{selectedOrder.workstation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">Encaissé par</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedOrder.cashierName || '—'}</p>
                  {selectedOrder.paidAt && (
                    <p className="text-xs text-gray-500">{fmtDate(selectedOrder.paidAt)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-1">Mode de paiement</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  {getPaymentIcon(selectedOrder.paymentMethod)}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{selectedOrder.paymentMethod || '—'}</p>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-gray-900">Articles ({selectedOrder.items.length})</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Médicament</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Qté</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Prix unit.</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedOrder.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="font-medium text-gray-900">{item.medicineName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-700">{fmt(item.price)} F</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{fmt(item.total)} F</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">Total</td>
                  <td className="px-6 py-4 text-right text-xl font-bold text-teal-600">{fmt(selectedOrder.total)} FCFA</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Annulation si applicable */}
          {selectedOrder.status === 'Annulée' && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-5">
              <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Informations d'annulation
              </h3>
              <p className="text-sm text-red-600">Annulé par : <span className="font-semibold">{selectedOrder.cancelledBy || '—'}</span></p>
              {selectedOrder.cancelledAt && (
                <p className="text-sm text-red-600">Le : <span className="font-semibold">{fmtDate(selectedOrder.cancelledAt)}</span></p>
              )}
              {selectedOrder.cancellationReason && (
                <p className="text-sm text-red-600 mt-1">Raison : <span className="font-semibold">{selectedOrder.cancellationReason}</span></p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PAGE PRINCIPALE ──────────────────────────────────────
  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des Ventes</h1>
          <p className="text-sm text-gray-600 mt-1">{orders.length} commande(s) au total</p>
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CA Aujourd'hui", value: `${fmt(stats.revenueToday)} F`, icon: TrendingUp, color: 'teal', sub: `${orders.filter(o => isToday(new Date(o.createdAt))).length} ventes` },
          { label: 'CA ce mois', value: `${fmt(stats.revenueMonth)} F`, icon: BarChart2, color: 'blue', sub: `${orders.filter(o => isThisMonth(new Date(o.createdAt))).length} ventes` },
          { label: 'Panier moyen', value: `${fmt(Math.round(stats.avgOrder))} F`, icon: ShoppingCart, color: 'purple', sub: `${stats.paid} payées` },
          { label: 'Annulées', value: stats.cancelled.toString(), icon: XCircle, color: 'red', sub: `${stats.pending} en attente` },
        ].map((card, i) => {
          const Icon = card.icon;
          const colors: Record<string, string> = {
            teal: 'from-teal-50 to-teal-100 text-teal-600 bg-teal-600',
            blue: 'from-blue-50 to-blue-100 text-blue-600 bg-blue-600',
            purple: 'from-purple-50 to-purple-100 text-purple-600 bg-purple-600',
            red: 'from-red-50 to-red-100 text-red-600 bg-red-600',
          };
          const [from, , textColor, bgColor] = colors[card.color].split(' ');
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${colors[card.color].split(' ').slice(0, 2).join(' ')} rounded-xl p-5 border border-white`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${bgColor} rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className={`w-4 h-4 ${textColor}`} />
              </div>
              <p className={`text-2xl font-bold text-gray-900`}>{card.value}</p>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
              <p className={`text-xs mt-1 ${textColor} font-medium`}>{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Modes de paiement + Top médicaments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Modes de paiement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Répartition par mode de paiement
          </h2>
          {Object.keys(stats.byPayment).length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune vente payée</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.byPayment)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const pct = stats.revenueTotal > 0 ? (amount / stats.revenueTotal) * 100 : 0;
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 text-gray-700">
                          {getPaymentIcon(method)}
                          <span className="font-medium">{method}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{fmt(amount)} F</span>
                          <span className="text-gray-400 ml-2">({pct.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </motion.div>

        {/* Top médicaments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Top 5 médicaments vendus
          </h2>
          {stats.topMedicine.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Aucune vente</p>
          ) : (
            <div className="space-y-3">
              {stats.topMedicine.map((med, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{medals[i] || `#${i + 1}`}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.qty} unités vendues</p>
                      </div>
                    </div>
                    <span className="font-bold text-teal-700 text-sm">{fmt(med.revenue)} F</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Filtres */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher commande, article, vendeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtre période */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'all', label: 'Tout' },
              { value: 'today', label: "Auj." },
              { value: 'week', label: 'Semaine' },
              { value: 'month', label: 'Mois' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setFilterPeriod(opt.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filterPeriod === opt.value ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filtre statut */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'Payée', label: 'Payées' },
              { value: 'En attente', label: 'En attente' },
              { value: 'Annulée', label: 'Annulées' },
            ].map(opt => (
              <button key={opt.value}
                onClick={() => setFilterStatus(opt.value as any)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filterStatus === opt.value ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-500 ml-auto">{filteredOrders.length} résultat(s)</span>
        </div>
      </motion.div>

      {/* Tableau des commandes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">N° Commande</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Articles</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Auxiliaire</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Caissier</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Paiement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Aucune vente trouvée</p>
                      <p className="text-sm text-gray-400 mt-1">Essayez de modifier les filtres</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, i) => {
                    const s = getStatusStyle(order.status);
                    const StatusIcon = s.icon;
                    return (
                      <motion.tr key={order.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          <span className="block text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm text-gray-700">
                              {order.items.slice(0, 2).map(i => i.medicineName).join(', ')}
                              {order.items.length > 2 && <span className="text-gray-400"> +{order.items.length - 2}</span>}
                            </span>
                            <span className="text-xs text-gray-400">{order.items.length} article(s)</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 block">{order.auxiliaryName}</span>
                              <span className="text-xs text-gray-400">{order.workstation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {order.cashierName || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {order.paymentMethod ? (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              {getPaymentIcon(order.paymentMethod)}
                              <span>{order.paymentMethod}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{fmt(order.total)} F</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${s.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="text-teal-600 hover:bg-teal-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}