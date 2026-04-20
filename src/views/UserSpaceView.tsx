import { useState, useMemo } from 'react';
import {
  User, ShoppingCart, TrendingUp, CheckCircle, Clock, XCircle,
  Activity, ArrowLeft, Banknote, Smartphone, CreditCard,
  Package, BarChart2, Calendar, Eye, X, Star, Award,
  Pill, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOrders } from '@/controllers/orderController';
import { activityService } from '@/services/activityService';
import type { User as AppUser } from '@/models/User';
import type { Order } from '@/models/Order';

interface UserSpaceViewProps {
  currentUser: AppUser;
  onBack: () => void;
}

type Tab = 'overview' | 'sales' | 'activity';

const ROLE_COLOR: Record<string, string> = {
  Admin:      'bg-purple-500',
  Employee:   'bg-blue-500',
  Auxiliaire: 'bg-indigo-500',
  Caisse:     'bg-pink-500',
};
const ROLE_BADGE: Record<string, string> = {
  Admin:      'bg-purple-100 text-purple-700',
  Employee:   'bg-blue-100 text-blue-700',
  Auxiliaire: 'bg-indigo-100 text-indigo-700',
  Caisse:     'bg-pink-100 text-pink-700',
};

const ACTION_LABELS: Record<string, string> = {
  medicine_add:          'Ajout médicament',
  medicine_edit:         'Modification médicament',
  medicine_delete:       'Suppression médicament',
  medicine_price_change: 'Changement de prix',
  stock_adjust:          'Ajustement stock',
  sale_create:           'Vente enregistrée',
  user_add:              'Ajout utilisateur',
  user_edit:             'Modification utilisateur',
  user_delete:           'Suppression utilisateur',
  login:                 'Connexion',
};

const ACTION_COLOR: Record<string, string> = {
  medicine_add:          'bg-teal-100 text-teal-700',
  medicine_edit:         'bg-blue-100 text-blue-700',
  medicine_delete:       'bg-red-100 text-red-700',
  medicine_price_change: 'bg-orange-100 text-orange-700',
  stock_adjust:          'bg-yellow-100 text-yellow-700',
  sale_create:           'bg-green-100 text-green-700',
  user_add:              'bg-purple-100 text-purple-700',
  user_edit:             'bg-indigo-100 text-indigo-700',
  user_delete:           'bg-red-100 text-red-700',
  login:                 'bg-gray-100 text-gray-600',
};

export function UserSpaceView({ currentUser, onBack }: UserSpaceViewProps) {
  const { orders } = useOrders();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtDate = (d: any) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const fmtShort = (d: any) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isWeek  = (d: Date) => { const s = new Date(); s.setDate(s.getDate() - s.getDay()); s.setHours(0,0,0,0); return d >= s; };
  const isMonth = (d: Date) => { const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); };

  // ── Commandes liées à cet utilisateur ──────────────────────
  const myOrders = useMemo(() => {
    return orders.filter(o =>
      o.auxiliaryName === currentUser.fullName ||
      o.auxiliaryId   === currentUser.id       ||
      o.cashierName   === currentUser.fullName  ||
      o.cashierId     === currentUser.id
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentUser]);

  const filteredOrders = useMemo(() => {
    return myOrders.filter(o => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const d = new Date(o.createdAt);
      const matchPeriod =
        filterPeriod === 'all'   ? true :
        filterPeriod === 'today' ? isToday(d) :
        filterPeriod === 'week'  ? isWeek(d)  :
        isMonth(d);
      return matchStatus && matchPeriod;
    });
  }, [myOrders, filterStatus, filterPeriod]);

  // ── Activités de cet utilisateur ──────────────────────────
  const myActivity = useMemo(() =>
    activityService.getByUser(currentUser.id),
    [currentUser.id]
  );

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const paid    = myOrders.filter(o => o.status === 'Payée');
    const created = myOrders.filter(o =>
      o.auxiliaryName === currentUser.fullName || o.auxiliaryId === currentUser.id
    );
    const cashed  = myOrders.filter(o =>
      o.cashierName === currentUser.fullName || o.cashierId === currentUser.id
    );
    const revenueTotal = paid.reduce((s, o) => s + o.total, 0);
    const todayPaid    = paid.filter(o => isToday(new Date(o.paidAt || o.createdAt)));
    const monthPaid    = paid.filter(o => isMonth(new Date(o.paidAt || o.createdAt)));
    const avgOrder     = paid.length > 0 ? revenueTotal / paid.length : 0;

    // Top produits vendus par cet utilisateur
    const medCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
    paid.forEach(o => o.items.forEach(item => {
      if (!medCounts[item.medicineId]) medCounts[item.medicineId] = { name: item.medicineName, qty: 0, revenue: 0 };
      medCounts[item.medicineId].qty     += item.quantity;
      medCounts[item.medicineId].revenue += item.total;
    }));
    const topProducts = Object.values(medCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Ventes par jour (7 derniers jours)
    const last7: { label: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = paid.filter(o => {
        const t = new Date(o.paidAt || o.createdAt);
        return t >= d && t < next;
      });
      last7.push({
        label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      });
    }

    return {
      totalCreated: created.length,
      totalCashed:  cashed.length,
      revenueTotal,
      revenueToday: todayPaid.reduce((s, o) => s + o.total, 0),
      revenueMonth: monthPaid.reduce((s, o) => s + o.total, 0),
      avgOrder,
      topProducts,
      last7,
      activityCount: myActivity.length,
    };
  }, [myOrders, myActivity, currentUser]);

  const getPaymentIcon = (method?: string) => {
    if (method === 'Mobile Money')    return <Smartphone className="w-4 h-4" />;
    if (method === 'Carte bancaire')  return <CreditCard className="w-4 h-4" />;
    return <Banknote className="w-4 h-4" />;
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Payée':      return { bg: 'bg-green-100 text-green-700',  icon: CheckCircle, dot: 'bg-green-500'  };
      case 'En attente': return { bg: 'bg-yellow-100 text-yellow-700', icon: Clock,       dot: 'bg-yellow-500' };
      case 'Annulée':    return { bg: 'bg-red-100 text-red-700',       icon: XCircle,     dot: 'bg-red-500'    };
      default:           return { bg: 'bg-gray-100 text-gray-700',     icon: Clock,       dot: 'bg-gray-400'   };
    }
  };

  const initials = currentUser.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColor = ROLE_COLOR[currentUser.role] ?? 'bg-gray-400';

  // ── Détail commande ────────────────────────────────────────
  if (selectedOrder) {
    const s = getStatusStyle(selectedOrder.status);
    const StatusIcon = s.icon;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedOrder.orderNumber}</h1>
                <p className="text-sm text-gray-500">{fmtDate(selectedOrder.createdAt)}</p>
              </div>
            </div>
            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${s.bg}`}>
              <StatusIcon className="w-4 h-4" />{selectedOrder.status}
            </span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-2">Créée par</p>
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
              <p className="text-xs text-gray-500 mb-2">Encaissée par</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedOrder.cashierName || '—'}</p>
                  {selectedOrder.paidAt && <p className="text-xs text-gray-500">{fmtDate(selectedOrder.paidAt)}</p>}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-500 mb-2">Paiement</p>
              <div className="flex items-center gap-2 text-gray-700">
                {getPaymentIcon(selectedOrder.paymentMethod)}
                <p className="font-semibold text-gray-900 text-sm">{selectedOrder.paymentMethod || '—'}</p>
              </div>
            </div>
          </div>
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
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                        <Pill className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="font-medium text-gray-900">{item.medicineName}</span>
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
        </div>
      </div>
    );
  }

  // ── VUE PRINCIPALE ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar */}
          <div className={`w-12 h-12 ${avatarColor} rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{currentUser.fullName}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[currentUser.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-sm text-gray-500">@{currentUser.username} · {currentUser.email}</p>
          </div>

          {/* Tabs */}
          <div className="ml-auto flex gap-1 bg-gray-100 p-1 rounded-lg">
            {([
              { id: 'overview',  label: 'Vue d\'ensemble', icon: BarChart2 },
              { id: 'sales',     label: 'Mes ventes',      icon: ShoppingCart },
              { id: 'activity',  label: 'Mon activité',    icon: Activity },
            ] as const).map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-8 space-y-6">

        {/* ─── VUE D'ENSEMBLE ──────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Ventes créées',
                  value: kpis.totalCreated,
                  icon: ShoppingCart,
                  color: 'from-indigo-50 to-indigo-100',
                  iconBg: 'bg-indigo-500',
                  textColor: 'text-indigo-600',
                },
                {
                  label: 'Encaissements',
                  value: kpis.totalCashed,
                  icon: CreditCard,
                  color: 'from-pink-50 to-pink-100',
                  iconBg: 'bg-pink-500',
                  textColor: 'text-pink-600',
                },
                {
                  label: 'CA total généré',
                  value: `${fmt(kpis.revenueTotal)} F`,
                  icon: TrendingUp,
                  color: 'from-teal-50 to-teal-100',
                  iconBg: 'bg-teal-500',
                  textColor: 'text-teal-600',
                },
                {
                  label: 'Actions enregistrées',
                  value: kpis.activityCount,
                  icon: Activity,
                  color: 'from-blue-50 to-blue-100',
                  iconBg: 'bg-blue-500',
                  textColor: 'text-blue-600',
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`bg-gradient-to-br ${card.color} rounded-xl p-5 border border-white shadow-sm`}
                  >
                    <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{card.label}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activité des 7 derniers jours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Ventes — 7 derniers jours
                </h2>
                <p className="text-xs text-gray-400 mb-5">Ventes payées attribuées à votre compte</p>
                {kpis.last7.every(d => d.count === 0) ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucune vente sur la période</div>
                ) : (
                  <div className="flex items-end gap-2 h-32">
                    {kpis.last7.map((day, i) => {
                      const maxCount = Math.max(...kpis.last7.map(d => d.count), 1);
                      const pct = (day.count / maxCount) * 100;
                      const isLast = i === kpis.last7.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {day.count > 0 && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {day.count} vente{day.count > 1 ? 's' : ''}<br />{fmt(day.revenue)} F
                            </div>
                          )}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(pct, day.count > 0 ? 8 : 0)}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.4 }}
                            className={`w-full rounded-t-md ${isLast ? 'bg-teal-500' : 'bg-teal-200 group-hover:bg-teal-300'} transition-colors`}
                          />
                          <span className="text-xs text-gray-400 capitalize">{day.label}</span>
                          {day.count > 0 && (
                            <span className="text-xs font-bold text-teal-700">{day.count}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Top produits vendus */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Mes produits les plus vendus
                </h2>
                <p className="text-xs text-gray-400 mb-4">Classement par chiffre d'affaires</p>
                {kpis.topProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Aucune vente</div>
                ) : (
                  <div className="space-y-3">
                    {kpis.topProducts.map((prod, i) => {
                      const maxRev = kpis.topProducts[0]?.revenue || 1;
                      const pct = (prod.revenue / maxRev) * 100;
                      const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400', 'text-blue-400', 'text-blue-300'];
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                              {i === 0 ? (
                                <Award className={`w-5 h-5 ${rankColors[0]}`} />
                              ) : (
                                <span className={`text-sm font-bold ${rankColors[i] ?? 'text-gray-300'}`}>#{i + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                                <span className="text-xs text-teal-700 font-bold ml-2 shrink-0">{fmt(prod.revenue)} F</span>
                              </div>
                              <p className="text-xs text-gray-400">{prod.qty} unité{prod.qty > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-9">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Dernières ventes (aperçu) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  <h2 className="font-bold text-gray-900">Dernières ventes</h2>
                </div>
                <button
                  onClick={() => setActiveTab('sales')}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                >
                  Voir tout <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {myOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  Aucune vente enregistrée
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Commande</th>
                      <th className="px-6 py-3 text-left font-semibold">Date</th>
                      <th className="px-6 py-3 text-left font-semibold">Articles</th>
                      <th className="px-6 py-3 text-left font-semibold">Rôle</th>
                      <th className="px-6 py-3 text-right font-semibold">Total</th>
                      <th className="px-6 py-3 text-left font-semibold">Statut</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myOrders.slice(0, 5).map(order => {
                      const s = getStatusStyle(order.status);
                      const isCreator = order.auxiliaryName === currentUser.fullName || order.auxiliaryId === currentUser.id;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-sm text-gray-900 font-semibold">{order.orderNumber}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{fmtShort(order.createdAt)}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {order.items[0]?.medicineName}
                            {order.items.length > 1 && <span className="text-gray-400"> +{order.items.length - 1}</span>}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCreator ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                              {isCreator ? 'Vendeur' : 'Caissier'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(order.total)} F</td>
                          <td className="px-6 py-3">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${s.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 p-1.5 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </motion.div>
          </>
        )}

        {/* ─── MES VENTES ───────────────────────────────────────── */}
        {activeTab === 'sales' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Résumé rapide */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'CA ce mois', value: `${fmt(kpis.revenueMonth)} F`, icon: TrendingUp, color: 'teal' },
                { label: 'CA aujourd\'hui', value: `${fmt(kpis.revenueToday)} F`, icon: Calendar, color: 'blue' },
                { label: 'Panier moyen', value: `${fmt(Math.round(kpis.avgOrder))} F`, icon: ShoppingCart, color: 'indigo' },
              ].map((s, i) => {
                const Icon = s.icon;
                const colorMap: Record<string, string> = {
                  teal: 'bg-teal-50 border-teal-100 text-teal-500 text-teal-900',
                  blue: 'bg-blue-50 border-blue-100 text-blue-500 text-blue-900',
                  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-500 text-indigo-900',
                };
                const [bg, border, iconColor] = colorMap[s.color].split(' ');
                return (
                  <div key={i} className={`${bg} ${border} border rounded-xl p-4 flex items-center gap-4`}>
                    <Icon className={`w-6 h-6 ${iconColor} shrink-0`} />
                    <div>
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-sm text-gray-500">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['all', 'today', 'week', 'month'] as const).map(p => (
                  <button key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterPeriod === p ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {{ all: 'Tout', today: "Auj.", week: 'Semaine', month: 'Mois' }[p]}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {(['all', 'Payée', 'En attente', 'Annulée'] as const).map(st => (
                  <button key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === st ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {{ all: 'Tous', Payée: 'Payées', 'En attente': 'En attente', Annulée: 'Annulées' }[st]}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-sm text-gray-400">{filteredOrders.length} vente(s)</span>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">N° Commande</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Articles</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Mon rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Paiement</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-gray-400">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucune vente pour cette période</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, i) => {
                        const s = getStatusStyle(order.status);
                        const isCreator = order.auxiliaryName === currentUser.fullName || order.auxiliaryId === currentUser.id;
                        return (
                          <motion.tr key={order.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-3 font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {fmtShort(order.createdAt)}
                              <span className="block text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">
                              {order.items.slice(0, 2).map(it => it.medicineName).join(', ')}
                              {order.items.length > 2 && <span className="text-gray-400"> +{order.items.length - 2}</span>}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCreator ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                                {isCreator ? 'Vendeur' : 'Caissier'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {order.paymentMethod ? (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  {getPaymentIcon(order.paymentMethod)}
                                  <span>{order.paymentMethod}</span>
                                </div>
                              ) : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(order.total)} F</td>
                            <td className="px-6 py-3">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${s.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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
        )}

        {/* ─── MON ACTIVITÉ ─────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{kpis.activityCount} action{kpis.activityCount > 1 ? 's' : ''} enregistrée{kpis.activityCount > 1 ? 's' : ''}</p>
                <p className="text-sm text-gray-500">Toutes les actions effectuées depuis votre compte</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {myActivity.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune activité enregistrée</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myActivity.map((entry, i) => (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Badge action */}
                      <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLOR[entry.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>

                      {/* Détail */}
                      <div className="flex-1 min-w-0">
                        {entry.targetName && (
                          <p className="text-sm font-medium text-gray-900 truncate">{entry.targetName}</p>
                        )}
                        {entry.detail && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.detail}</p>
                        )}
                      </div>

                      {/* Horodatage */}
                      <p className="text-xs text-gray-400 shrink-0">
                        {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
