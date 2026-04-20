import { useState, useMemo } from 'react';
import {
  Search, ShoppingCart, CheckCircle, XCircle, Clock,
  TrendingUp, Package, User, CreditCard,
  Smartphone, Banknote, Eye, X, ChevronDown,
  ArrowUpRight, BarChart2, Trophy, Medal, Star, Pill,
  Users, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { useOrders } from '@/controllers/orderController';
import type { Order } from '@/models/Order';
import type { User as AppUser } from '@/models/User';
import { ProductTrackingView } from '@/views/ProductTrackingView';

interface SalesViewProps {
  currentUser?: AppUser;
}

export function SalesView({ currentUser }: SalesViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'sales' | 'tracking'>('sales');
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
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

      const matchUser = filterUser === 'all' ||
        order.auxiliaryName === filterUser ||
        order.cashierName === filterUser;

      return matchSearch && matchStatus && matchPeriod && matchUser;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, filterStatus, filterPeriod, filterUser]);

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

    const topSellers = (() => {
      const sellers: Record<string, { name: string; orders: number; revenue: number; role: string }> = {};
      paid.forEach(o => {
        // Auxiliaire (créateur)
        const auxKey = o.auxiliaryId || o.auxiliaryName;
        if (!sellers[auxKey]) sellers[auxKey] = { name: o.auxiliaryName, orders: 0, revenue: 0, role: 'Auxiliaire' };
        sellers[auxKey].orders += 1;
        sellers[auxKey].revenue += o.total;
        // Caissier si différent
        if (o.cashierName && o.cashierName !== o.auxiliaryName) {
          const cashKey = o.cashierId || o.cashierName;
          if (!sellers[cashKey]) sellers[cashKey] = { name: o.cashierName, orders: 0, revenue: 0, role: 'Caisse' };
          sellers[cashKey].orders += 1;
          sellers[cashKey].revenue += o.total;
        }
      });
      return Object.values(sellers).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    })();

    // Vendeurs uniques pour le filtre
    const uniqueUsers = Array.from(new Set([
      ...orders.map(o => o.auxiliaryName),
      ...orders.filter(o => o.cashierName).map(o => o.cashierName!),
    ])).sort();

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
      topSellers,
      uniqueUsers,
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
  if (activeTab === 'tracking') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-8 pt-4 flex gap-1">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Historique des ventes
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium bg-violet-600 text-white shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Suivi nouveaux produits
          </button>
        </div>
        <ProductTrackingView currentUser={currentUser ?? null} />
      </div>
    );
  }

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
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-white text-green-700 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Ventes
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Suivi produits
          </button>
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

      {/* Modes de paiement + Top médicaments + Top vendeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Modes de paiement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Modes de paiement
          </h2>
          {Object.keys(stats.byPayment).length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucune vente payée</p>
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
            <Pill className="w-5 h-5 text-teal-600" />
            Top 5 médicaments
          </h2>
          {stats.topMedicine.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucune vente</p>
          ) : (
            <div className="space-y-2">
              {stats.topMedicine.map((med, i) => {
                const rankConfig = [
                  { icon: Trophy, bg: 'bg-yellow-100', text: 'text-yellow-600', bar: 'from-yellow-400 to-yellow-500' },
                  { icon: Medal,  bg: 'bg-gray-100',   text: 'text-gray-500',   bar: 'from-gray-400 to-gray-500'   },
                  { icon: Medal,  bg: 'bg-orange-100', text: 'text-orange-500', bar: 'from-orange-400 to-orange-500' },
                  { icon: Star,   bg: 'bg-blue-50',    text: 'text-blue-400',   bar: 'from-blue-300 to-blue-400'   },
                  { icon: Star,   bg: 'bg-blue-50',    text: 'text-blue-400',   bar: 'from-blue-300 to-blue-400'   },
                ][i] ?? { icon: Star, bg: 'bg-gray-50', text: 'text-gray-400', bar: 'from-gray-300 to-gray-400' };
                const RankIcon = rankConfig.icon;
                const maxRevenue = stats.topMedicine[0]?.revenue || 1;
                const pct = (med.revenue / maxRevenue) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${rankConfig.bg} rounded-lg flex items-center justify-center shrink-0`}>
                        <RankIcon className={`w-4 h-4 ${rankConfig.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{med.name}</p>
                        <p className="text-xs text-gray-400">{med.qty} unités · {fmt(med.revenue)} F</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-11">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${rankConfig.bar} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top vendeurs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Performances vendeurs
          </h2>
          {stats.topSellers.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Aucune vente payée</p>
          ) : (
            <div className="space-y-2">
              {stats.topSellers.map((seller, i) => {
                const maxRev = stats.topSellers[0]?.revenue || 1;
                const pct = (seller.revenue / maxRev) * 100;
                const initials = seller.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const avatarColors = [
                  'bg-indigo-500', 'bg-teal-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'
                ];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFilterUser(filterUser === seller.name ? 'all' : seller.name)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold transition-all ${avatarColors[i % avatarColors.length]} ${filterUser === seller.name ? 'ring-2 ring-offset-1 ring-indigo-400' : 'hover:opacity-80'}`}
                        title={`Filtrer par ${seller.name}`}
                      >
                        {initials}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-900 text-sm truncate">{seller.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${seller.role === 'Auxiliaire' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                            {seller.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{seller.orders} vente{seller.orders > 1 ? 's' : ''} · {fmt(seller.revenue)} F</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-11">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.35 + i * 0.05, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full"
                      />
                    </div>
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

          {/* Filtre vendeur */}
          {stats.uniqueUsers.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className={`pl-8 pr-8 py-2 rounded-lg border text-sm font-medium bg-white transition-all appearance-none cursor-pointer ${
                  filterUser !== 'all'
                    ? 'border-indigo-400 text-indigo-700 bg-indigo-50'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <option value="all">Tous les vendeurs</option>
                {stats.uniqueUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          <span className="text-sm text-gray-500 ml-auto">{filteredOrders.length} résultat(s)</span>
        </div>

        {/* Filtre actif — badge cliquable pour le vendeur */}
        {filterUser !== 'all' && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtré par :</span>
            <button
              onClick={() => setFilterUser('all')}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-200 transition-colors"
            >
              <User className="w-3 h-3" />
              {filterUser}
              <X className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        )}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vendeur</th>
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
                          <button
                            onClick={() => setFilterUser(filterUser === order.auxiliaryName ? 'all' : order.auxiliaryName)}
                            className="flex items-center gap-2 group"
                            title={`Filtrer par ${order.auxiliaryName}`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${filterUser === order.auxiliaryName ? 'bg-indigo-600 ring-2 ring-indigo-300' : 'bg-indigo-400 group-hover:bg-indigo-500'}`}>
                              {order.auxiliaryName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 block group-hover:text-indigo-600 transition-colors">{order.auxiliaryName}</span>
                              <span className="text-xs text-gray-400">{order.workstation}</span>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {order.cashierName ? (
                            <button
                              onClick={() => setFilterUser(filterUser === order.cashierName ? 'all' : order.cashierName!)}
                              className="flex items-center gap-1.5 group"
                              title={`Filtrer par ${order.cashierName}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${filterUser === order.cashierName ? 'bg-pink-600 ring-2 ring-pink-300' : 'bg-pink-400 group-hover:bg-pink-500'}`}>
                                {order.cashierName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700 group-hover:text-pink-600 transition-colors">{order.cashierName}</span>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
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