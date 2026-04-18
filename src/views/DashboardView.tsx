import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign, Package, AlertTriangle, Calendar, Users, TrendingUp, TrendingDown,
  ShoppingCart, CreditCard, Award, Activity, Clock, CheckCircle, Shield,
  Minus, ArrowRight, AlertCircle, MapPin, Building2, Tag, Wallet, Search,
  X, FileText, ChevronDown, ChevronRight as ChevronR,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { StatCard } from '@/app/components/StatCard';
import { useDashboard } from '@/controllers/dashboardController';
import { medicineService } from '@/services/medicineService';
import { settingsService } from '@/services/settingsService';
import { bonLivraisonService } from '@/services/bonLivraisonservice';
import { clientService } from '@/services/clientService';
import { useOrders } from '@/controllers/orderController';
import type { Medicine } from '@/models/Medicine';

type DashboardTab = 'overview' | 'achats' | 'assurances' | 'avoirs';

export function DashboardView() {
  const {
    stats,
    loading,
    getDailySalesChart,
    getMonthlySalesChart,
    getCategoryDistribution,
    getPaymentMethodsDistribution,
    getTopSellingMedicines,
    getTopClients,
    getRecentActivities
  } = useDashboard();
  const { orders } = useOrders();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly'>('daily');
  const [chartData, setChartData] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<Medicine[]>([]);
  const [expiringMeds, setExpiringMeds] = useState<Medicine[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Achats tab
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [selectedMedicineForPrice, setSelectedMedicineForPrice] = useState<string | null>(null);

  // Assurances tab
  const [insuranceMonth, setInsuranceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    loadChartData();
    loadAlerts();
    loadDistributions();
    loadTopData();
    loadActivities();
  }, [timeRange]);

  const loadChartData = () => {
    if (timeRange === 'daily') {
      const data = getDailySalesChart(7);
      setChartData(data.map(d => ({
        date: new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        total: d.total,
        orders: d.orders
      })));
    } else {
      const data = getMonthlySalesChart(6);
      setChartData(data.map(d => ({
        date: new Date(d.date).toLocaleDateString('fr-FR', { month: 'long' }),
        total: d.total,
        orders: d.orders
      })));
    }
  };

  const loadAlerts = () => {
    const settings = settingsService.get();
    setLowStockMeds(medicineService.getLowStock(settings.lowStockThreshold).slice(0, 5));
    setExpiringMeds(medicineService.getExpiring(settings.expiryAlertDays).slice(0, 5));
  };

  const loadDistributions = () => {
    setCategoryData(getCategoryDistribution().slice(0, 6));
    setPaymentMethodsData(getPaymentMethodsDistribution());
  };

  const loadTopData = () => {
    setTopMedicines(getTopSellingMedicines(5));
    setTopClients(getTopClients(5));
  };

  const loadActivities = () => {
    setRecentActivities(getRecentActivities(8));
  };

  // ── Achats: données depuis les BLs ──────────────────────────────────────
  const blData = useMemo(() => {
    const bls = bonLivraisonService.getAll();
    const now = new Date();

    // BLs du mois
    const blsThisMonth = bls.filter(bl => {
      const d = new Date(bl.deliveryDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalPurchasesMonth = blsThisMonth.reduce((s, bl) => s + bl.totalAmount, 0);
    const suppliers = new Set(bls.map(bl => bl.supplierName));

    // Historique achats par mois (6 derniers mois)
    const monthlyPurchases = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthBLs = bls.filter(bl => {
        const bd = new Date(bl.deliveryDate);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      });
      return {
        month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        total: monthBLs.reduce((s, bl) => s + bl.totalAmount, 0),
        count: monthBLs.length,
      };
    });

    // Comparaison de prix par produit
    // Map: medicineName → [{ date, supplierName, unitPrice, blNumber }]
    const priceByMedicine: Record<string, { date: string; supplierName: string; unitPrice: number; blNumber: string }[]> = {};
    bls.forEach(bl => {
      bl.items.forEach(item => {
        const key = item.medicineName;
        if (!priceByMedicine[key]) priceByMedicine[key] = [];
        priceByMedicine[key].push({
          date: new Date(bl.deliveryDate).toLocaleDateString('fr-FR'),
          supplierName: bl.supplierName,
          unitPrice: item.unitPrice,
          blNumber: bl.blNumber,
        });
      });
    });

    // Produits commandés chez plusieurs fournisseurs
    const multiSupplierProducts = Object.entries(priceByMedicine)
      .filter(([, entries]) => new Set(entries.map(e => e.supplierName)).size > 1)
      .map(([name, entries]) => {
        const bySupplier: Record<string, number[]> = {};
        entries.forEach(e => {
          if (!bySupplier[e.supplierName]) bySupplier[e.supplierName] = [];
          bySupplier[e.supplierName].push(e.unitPrice);
        });
        const supplierAvg = Object.entries(bySupplier).map(([sup, prices]) => ({
          supplier: sup,
          avgPrice: prices.reduce((s, p) => s + p, 0) / prices.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          count: prices.length,
        })).sort((a, b) => a.avgPrice - b.avgPrice);
        return { name, supplierAvg };
      });

    return { blsThisMonth: blsThisMonth.length, totalPurchasesMonth, suppliersCount: suppliers.size, monthlyPurchases, priceByMedicine, multiSupplierProducts };
  }, []);

  // Prix du produit sélectionné (pour le graphique)
  const selectedPriceData = useMemo(() => {
    if (!selectedMedicineForPrice || !blData.priceByMedicine[selectedMedicineForPrice]) return [];
    const entries = blData.priceByMedicine[selectedMedicineForPrice];
    const suppliers = Array.from(new Set(entries.map(e => e.supplierName)));
    // Format for recharts: each date becomes a point
    const dates = Array.from(new Set(entries.map(e => e.date))).sort((a, b) => {
      const pa = a.split('/').reverse().join('');
      const pb = b.split('/').reverse().join('');
      return pa.localeCompare(pb);
    });
    return dates.map(date => {
      const point: any = { date };
      suppliers.forEach(sup => {
        const entry = entries.find(e => e.date === date && e.supplierName === sup);
        if (entry) point[sup] = entry.unitPrice;
      });
      return point;
    });
  }, [selectedMedicineForPrice, blData]);

  const priceSupplierNames = useMemo(() => {
    if (!selectedMedicineForPrice || !blData.priceByMedicine[selectedMedicineForPrice]) return [];
    return Array.from(new Set(blData.priceByMedicine[selectedMedicineForPrice].map(e => e.supplierName)));
  }, [selectedMedicineForPrice, blData]);

  const filteredMedicineNames = useMemo(() => {
    if (!priceSearchQuery.trim()) return Object.keys(blData.priceByMedicine).slice(0, 10);
    const q = priceSearchQuery.toLowerCase();
    return Object.keys(blData.priceByMedicine).filter(n => n.toLowerCase().includes(q)).slice(0, 10);
  }, [priceSearchQuery, blData]);

  // ── Assurances: agrégation depuis les commandes ──────────────────────────
  const insuranceData = useMemo(() => {
    const [year, month] = insuranceMonth.split('-').map(Number);
    const paidOrders = orders.filter(o => {
      if (o.status !== 'Payée' || !o.paidAt || !o.insuranceCompany) return false;
      const d = new Date(o.paidAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const byCompany: Record<string, {
      company: string;
      orders: typeof paidOrders;
      totalSales: number;
      totalCoverage: number;
      clientShare: number;
    }> = {};

    paidOrders.forEach(o => {
      const co = o.insuranceCompany!;
      if (!byCompany[co]) byCompany[co] = { company: co, orders: [], totalSales: 0, totalCoverage: 0, clientShare: 0 };
      byCompany[co].orders.push(o);
      byCompany[co].totalSales += o.total;
      byCompany[co].totalCoverage += o.insuranceCoverage ?? 0;
      byCompany[co].clientShare += o.total - (o.insuranceCoverage ?? 0);
    });

    const companies = Object.values(byCompany).sort((a, b) => b.totalCoverage - a.totalCoverage);
    const totalSales = companies.reduce((s, c) => s + c.totalSales, 0);
    const totalCoverage = companies.reduce((s, c) => s + c.totalCoverage, 0);
    const totalOrders = paidOrders.length;

    return { companies, totalSales, totalCoverage, totalOrders };
  }, [orders, insuranceMonth]);

  // ── Avoirs clients ────────────────────────────────────────────────────────
  const avoirData = useMemo(() => {
    const clients = clientService.getAll().filter(c => (c.creditBalance ?? 0) > 0);
    const DEFAULT_THRESHOLD = 5000;
    const withAlerts = clients.filter(c => (c.creditBalance ?? 0) < (c.creditAlertThreshold ?? DEFAULT_THRESHOLD));
    const total = clients.reduce((s, c) => s + (c.creditBalance ?? 0), 0);
    return {
      clients: clients.sort((a, b) => (a.creditBalance ?? 0) - (b.creditBalance ?? 0)),
      withAlerts,
      total,
    };
  }, []);

  const LINE_COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string, status?: string) => {
    if (type === 'order') {
      if (status === 'Payée') return <CheckCircle className="w-4 h-4 text-green-600" />;
      return <ShoppingCart className="w-4 h-4 text-orange-600" />;
    }
    if (type === 'client') return <Users className="w-4 h-4 text-blue-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      {/* Header + Tab bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-gray-600 mt-0.5 text-sm">Vue d'ensemble de votre pharmacie</p>
          </div>
          {activeTab === 'overview' && (
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button onClick={() => setTimeRange('daily')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'daily' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>7 jours</button>
              <button onClick={() => setTimeRange('monthly')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeRange === 'monthly' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>6 mois</button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 w-fit shadow-sm">
          {([
            { id: 'overview',    label: 'Vue générale',     icon: Activity },
            { id: 'achats',      label: 'Achats & Prix',    icon: Package },
            { id: 'assurances',  label: 'Assurances',       icon: Shield,  badge: insuranceData.totalOrders || undefined },
            { id: 'avoirs',      label: 'Avoirs clients',   icon: Wallet,  badge: avoirData.withAlerts.length || undefined },
          ] as { id: DashboardTab; label: string; icon: any; badge?: number }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === tab.id ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab: Achats & Prix ──────────────────────────────────── */}
      {activeTab === 'achats' && (
        <div className="space-y-6">
          {/* KPI Achats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'BLs ce mois',         value: blData.blsThisMonth,                                           icon: Package,    color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: 'Total achats ce mois', value: `${blData.totalPurchasesMonth.toLocaleString('fr-FR')} FCFA`, icon: DollarSign, color: 'text-violet-600',  bg: 'bg-violet-100' },
              { label: 'Fournisseurs actifs',  value: blData.suppliersCount,                                        icon: Building2,  color: 'text-orange-600',  bg: 'bg-orange-100' },
            ].map((k, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                </div>
                <div className={`w-11 h-11 ${k.bg} rounded-lg flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Historique achats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Historique des achats — 6 derniers mois</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={blData.monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} name="Total achats" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparaison prix par fournisseur */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-500" />
                Comparaison prix par fournisseur
              </h3>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un médicament..."
                  value={priceSearchQuery}
                  onChange={e => { setPriceSearchQuery(e.target.value); setSelectedMedicineForPrice(null); }}
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                {priceSearchQuery && (
                  <button onClick={() => { setPriceSearchQuery(''); setSelectedMedicineForPrice(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Liste médicaments trouvés */}
            {!selectedMedicineForPrice && filteredMedicineNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filteredMedicineNames.map(name => {
                  const sups = new Set(blData.priceByMedicine[name].map(e => e.supplierName)).size;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedMedicineForPrice(name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                    >
                      <span>{name}</span>
                      <span className="text-xs text-gray-400">{sups} fournisseur{sups > 1 ? 's' : ''}</span>
                      {sups > 1 && <span className="w-2 h-2 rounded-full bg-amber-400" title="Plusieurs fournisseurs" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Comparaison pour le produit sélectionné */}
            <AnimatePresence>
              {selectedMedicineForPrice && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedMedicineForPrice(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Effacer
                    </button>
                    <span className="font-semibold text-gray-900">{selectedMedicineForPrice}</span>
                  </div>

                  {/* Tableau résumé par fournisseur */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Fournisseur</th>
                          <th className="px-4 py-3 text-right">Prix min</th>
                          <th className="px-4 py-3 text-right">Prix max</th>
                          <th className="px-4 py-3 text-right">Prix moyen</th>
                          <th className="px-4 py-3 text-right">Nb commandes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          const entries = blData.priceByMedicine[selectedMedicineForPrice] ?? [];
                          const bySupplier: Record<string, number[]> = {};
                          entries.forEach(e => {
                            if (!bySupplier[e.supplierName]) bySupplier[e.supplierName] = [];
                            bySupplier[e.supplierName].push(e.unitPrice);
                          });
                          const rows = Object.entries(bySupplier).map(([sup, prices]) => ({
                            sup, min: Math.min(...prices), max: Math.max(...prices),
                            avg: prices.reduce((s, p) => s + p, 0) / prices.length, count: prices.length,
                          })).sort((a, b) => a.avg - b.avg);
                          const cheapest = rows[0]?.sup;
                          return rows.map((r, i) => (
                            <tr key={r.sup} className={i === 0 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                {r.sup}
                                {r.sup === cheapest && <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Le moins cher</span>}
                              </td>
                              <td className="px-4 py-3 text-right text-green-700 font-medium">{r.min.toLocaleString('fr-FR')} F</td>
                              <td className="px-4 py-3 text-right text-red-600">{r.max.toLocaleString('fr-FR')} F</td>
                              <td className="px-4 py-3 text-right font-semibold">{r.avg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F</td>
                              <td className="px-4 py-3 text-right text-gray-500">{r.count}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Graphique prix dans le temps */}
                  {selectedPriceData.length > 1 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Évolution du prix dans le temps</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={selectedPriceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" fontSize={10} />
                          <YAxis fontSize={10} />
                          <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
                          <Legend />
                          {priceSupplierNames.map((sup, i) => (
                            <Line key={sup} type="monotone" dataKey={sup} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Historique détaillé */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Fournisseur</th>
                          <th className="px-4 py-2 text-right">Prix unitaire</th>
                          <th className="px-4 py-2 text-left">N° BL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(blData.priceByMedicine[selectedMedicineForPrice] ?? []).map((e, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-600">{e.date}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{e.supplierName}</td>
                            <td className="px-4 py-2 text-right font-semibold text-violet-700">{e.unitPrice.toLocaleString('fr-FR')} F</td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{e.blNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alertes: même produit moins cher ailleurs */}
            {blData.multiSupplierProducts.length > 0 && !selectedMedicineForPrice && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Produits commandés chez plusieurs grossistes (comparatif disponible)
                </p>
                <div className="space-y-2">
                  {blData.multiSupplierProducts.slice(0, 5).map(({ name, supplierAvg }) => {
                    const cheapest = supplierAvg[0];
                    const mostExpensive = supplierAvg[supplierAvg.length - 1];
                    const diff = mostExpensive.avgPrice - cheapest.avgPrice;
                    const pct = cheapest.avgPrice > 0 ? (diff / cheapest.avgPrice) * 100 : 0;
                    return (
                      <div key={name} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 hover:border-amber-200 cursor-pointer" onClick={() => { setSelectedMedicineForPrice(name); setPriceSearchQuery(name); }}>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Le moins cher: <span className="text-green-700 font-medium">{cheapest.supplier}</span> ({cheapest.avgPrice.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F)
                            {' '}vs le plus cher: <span className="text-red-600 font-medium">{mostExpensive.supplier}</span> ({mostExpensive.avgPrice.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} F)
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">+{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Assurances ─────────────────────────────────────── */}
      {activeTab === 'assurances' && (
        <div className="space-y-6">
          {/* Sélecteur de mois */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Mois de référence :</label>
            <input
              type="month"
              value={insuranceMonth}
              onChange={e => setInsuranceMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <span className="text-xs text-gray-500">
              {new Date(insuranceMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Ventes assurées',      value: insuranceData.totalOrders,                                      icon: Shield,     color: 'text-blue-600',  bg: 'bg-blue-100' },
              { label: 'Montant à facturer',   value: `${insuranceData.totalCoverage.toLocaleString('fr-FR')} FCFA`, icon: FileText,   color: 'text-violet-600', bg: 'bg-violet-100' },
              { label: 'Total ventes assurées',value: `${insuranceData.totalSales.toLocaleString('fr-FR')} FCFA`,    icon: DollarSign, color: 'text-green-600',  bg: 'bg-green-100' },
            ].map((k, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                </div>
                <div className={`w-11 h-11 ${k.bg} rounded-lg flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {insuranceData.companies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune vente assurance ce mois</p>
              <p className="text-sm text-gray-400 mt-1">Les ventes avec tiers payant apparaîtront ici une fois saisies depuis la Caisse</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">État par compagnie d'assurance</h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Imprimer / Exporter
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {insuranceData.companies.map(company => (
                  <div key={company.company}>
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => setExpandedCompany(expandedCompany === company.company ? null : company.company)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{company.company}</p>
                          <p className="text-xs text-gray-500">{company.orders.length} vente(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total ventes</p>
                          <p className="font-semibold text-gray-900">{company.totalSales.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Part assurance</p>
                          <p className="font-bold text-blue-700">{company.totalCoverage.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Part client</p>
                          <p className="font-semibold text-gray-700">{company.clientShare.toLocaleString('fr-FR')} F</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedCompany === company.company ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedCompany === company.company && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                  <th className="px-3 py-2 text-left">N° Commande</th>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-right">Total TTC</th>
                                  <th className="px-3 py-2 text-right">Part assurance</th>
                                  <th className="px-3 py-2 text-right">Part client</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {company.orders.map(o => (
                                  <tr key={o.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900">{o.orderNumber}</td>
                                    <td className="px-3 py-2 text-gray-500">{o.paidAt ? new Date(o.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                                    <td className="px-3 py-2 text-right font-medium">{o.total.toLocaleString('fr-FR')} F</td>
                                    <td className="px-3 py-2 text-right text-blue-700 font-semibold">{(o.insuranceCoverage ?? 0).toLocaleString('fr-FR')} F</td>
                                    <td className="px-3 py-2 text-right text-gray-700">{Math.max(0, o.total - (o.insuranceCoverage ?? 0)).toLocaleString('fr-FR')} F</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-blue-50 font-semibold text-sm">
                                <tr>
                                  <td colSpan={2} className="px-3 py-2 text-gray-700">Total</td>
                                  <td className="px-3 py-2 text-right">{company.totalSales.toLocaleString('fr-FR')} F</td>
                                  <td className="px-3 py-2 text-right text-blue-700">{company.totalCoverage.toLocaleString('fr-FR')} F</td>
                                  <td className="px-3 py-2 text-right">{company.clientShare.toLocaleString('fr-FR')} F</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Récapitulatif total */}
              <div className="p-4 bg-blue-50 border-t border-blue-100 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Total toutes compagnies</p>
                  <p className="font-bold text-gray-900 text-base">{insuranceData.totalSales.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total à demander en remboursement</p>
                  <p className="font-bold text-blue-700 text-base">{insuranceData.totalCoverage.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total encaissé des clients</p>
                  <p className="font-bold text-gray-900 text-base">{(insuranceData.totalSales - insuranceData.totalCoverage).toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Avoirs clients ─────────────────────────────────── */}
      {activeTab === 'avoirs' && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Clients avec avoir',   value: avoirData.clients.length,                                    icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-100' },
              { label: 'Total avoirs (FCFA)',   value: `${avoirData.total.toLocaleString('fr-FR')} FCFA`,          icon: Wallet,       color: 'text-violet-600', bg: 'bg-violet-100' },
              { label: 'Alertes solde faible', value: avoirData.withAlerts.length,                                 icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-100' },
            ].map((k, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500 mb-1">{k.label}</p>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                </div>
                <div className={`w-11 h-11 ${k.bg} rounded-lg flex items-center justify-center`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
              </motion.div>
            ))}
          </div>

          {avoirData.clients.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun client avec un solde avoir</p>
              <p className="text-sm text-gray-400 mt-1">Renseignez le solde avoir dans la fiche de chaque client</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Soldes avoirs — triés par montant croissant</h3>
                <p className="text-xs text-gray-500 mt-0.5">Les clients en rouge sont en dessous du seuil d'alerte</p>
              </div>
              <div className="divide-y divide-gray-100">
                {avoirData.clients.map(client => {
                  const threshold = client.creditAlertThreshold ?? 5000;
                  const isAlert = (client.creditBalance ?? 0) < threshold;
                  return (
                    <div key={client.id} className={`flex items-center justify-between p-4 ${isAlert ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${isAlert ? 'bg-red-500' : 'bg-teal-500'}`}>
                          {client.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{client.fullName}</p>
                            {isAlert && (
                              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                <AlertTriangle className="w-3 h-3" /> Solde faible
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{client.phone} {client.isInsured ? `· ${client.insurance?.company}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isAlert ? 'text-red-600' : 'text-teal-700'}`}>
                          {(client.creditBalance ?? 0).toLocaleString('fr-FR')} FCFA
                        </p>
                        <p className="text-xs text-gray-400">Seuil: {threshold.toLocaleString('fr-FR')} F</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Vue générale (existing content) ────────────────── */}
      {activeTab === 'overview' && (<>
      {/* Stats Cards - Row 1: Ventes */}

      {/* Stats Cards - Row 1: Ventes */}
      <div>
        <h2 className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Ventes & Revenus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <StatCard
              title="Aujourd'hui"
              value={`${stats.totalSalesToday.toLocaleString('fr-FR')} FCFA`}
              icon={DollarSign}
              color="green"
              subtitle={`${stats.ordersToday} commande(s)`}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <StatCard
              title="Cette semaine"
              value={`${stats.totalSalesWeek.toLocaleString('fr-FR')} FCFA`}
              icon={TrendingUp}
              color="blue"
              subtitle={`${stats.ordersWeek} commande(s)`}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Ce mois"
              value={`${stats.totalSalesMonth.toLocaleString('fr-FR')} FCFA`}
              icon={Calendar}
              color="blue"
              subtitle={`${stats.ordersMonth} commande(s)`}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <StatCard
              title="Panier moyen"
              value={`${stats.averageOrderValue.toLocaleString('fr-FR')} FCFA`}
              icon={ShoppingCart}
              color="green"
              subtitle="Par commande"
            />
          </motion.div>
        </div>
      </div>

      {/* Stats Cards - Row 2: Stock & Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Inventaire</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                title="Total Médicaments"
                value={stats.totalMedicines}
                icon={Package}
                color="blue"
                subtitle={`Valeur: ${stats.totalStockValue.toLocaleString('fr-FR')} F`}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <StatCard
                title="Rupture de stock"
                value={stats.outOfStockCount}
                icon={AlertCircle}
                color="red"
                subtitle="Nécessite réapprovisionnement"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatCard
                title="Stock bas"
                value={stats.lowStockCount}
                icon={AlertTriangle}
                color="orange"
                subtitle="Nécessite attention"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <StatCard
                title="Expirent bientôt"
                value={stats.expiringCount}
                icon={Calendar}
                color="red"
                subtitle="Dans 90 jours"
              />
            </motion.div>
          </div>
        </div>

        <div>
          <h2 className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Clients</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatCard
                title="Total Clients"
                value={stats.totalClients}
                icon={Users}
                color="blue"
                subtitle={`${stats.activeClients} actifs`}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <StatCard
                title="Nouveaux ce mois"
                value={stats.newClientsMonth}
                icon={TrendingUp}
                color="green"
                subtitle="Acquisition clients"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <StatCard
                title="Clients assurés"
                value={stats.insuredClients}
                icon={Shield}
                color="blue"
                subtitle={`${((stats.insuredClients / Math.max(stats.totalClients, 1)) * 100).toFixed(0)}% du total`}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <StatCard
                title="Meilleur client"
                value={stats.topClient ? `${stats.topClient.spent.toLocaleString('fr-FR')} F` : 'N/A'}
                icon={Award}
                color="orange"
                subtitle={stats.topClient?.name.substring(0, 20) || 'Aucun'}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              {timeRange === 'daily' ? 'Ventes quotidiennes (7 derniers jours)' : 'Ventes mensuelles (6 derniers mois)'}
            </h3>
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-teal-600 rounded"></div>
                <span className="text-gray-600">Revenus</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'total') return [`${value.toLocaleString('fr-FR')} FCFA`, 'Revenus'];
                  return [value, 'Commandes'];
                }}
              />
              <Bar dataKey="total" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm"
        >
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Distribution par catégorie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category.substring(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString('fr-FR')} FCFA`}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Middle Row: Top Products, Top Clients, Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Selling Medicines */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Top 5 Médicaments
            </h3>
          </div>
          <div className="p-4">
            {topMedicines.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune vente</p>
            ) : (
              <div className="space-y-3">
                {topMedicines.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{med.name}</p>
                        <p className="text-xs text-gray-500">{med.quantity} vendus</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-teal-600">{med.revenue.toLocaleString('fr-FR')} F</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Clients */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Top 5 Clients
            </h3>
          </div>
          <div className="p-4">
            {topClients.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun client</p>
            ) : (
              <div className="space-y-3">
                {topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                          {client.isInsured && <Shield className="w-3 h-3 text-green-600" />}
                        </div>
                        <p className="text-xs text-gray-500">{client.totalPurchases} achats</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-purple-600">{client.totalSpent.toLocaleString('fr-FR')} F</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Modes de paiement
            </h3>
          </div>
          <div className="p-4">
            {paymentMethodsData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun paiement</p>
            ) : (
              <div className="space-y-3">
                {paymentMethodsData.map((method, index) => {
                  const total = paymentMethodsData.reduce((sum, m) => sum + m.amount, 0);
                  const percentage = total > 0 ? (method.amount / total) * 100 : 0;
                  
                  return (
                    <div key={method.method}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{method.method}</p>
                          <p className="text-xs text-gray-500">{method.count} transaction(s)</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{method.amount.toLocaleString('fr-FR')} F</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
              Alertes Stock
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {/* Low Stock */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-700">Stock bas ({lowStockMeds.length})</p>
                </div>
                <div className="space-y-2">
                  {lowStockMeds.length === 0 ? (
                    <p className="text-xs text-gray-500 pl-4">Aucun article en stock bas</p>
                  ) : (
                    lowStockMeds.map(med => (
                      <div key={med.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border-l-2 border-orange-500">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{med.name}</p>
                          {med.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {med.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-orange-700">{med.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expiring Soon */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-700">Expirent bientôt ({expiringMeds.length})</p>
                </div>
                <div className="space-y-2">
                  {expiringMeds.length === 0 ? (
                    <p className="text-xs text-gray-500 pl-4">Aucun article expirant</p>
                  ) : (
                    expiringMeds.map(med => (
                      <div key={med.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border-l-2 border-red-500">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{med.name}</p>
                          {med.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {med.location}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-red-700">{med.expirationDate}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
              Activité Récente
            </h3>
          </div>
          <div className="p-4">
            {recentActivities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune activité récente</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type, activity.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleString('fr-FR', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-semibold text-gray-900">
                        {activity.amount.toLocaleString('fr-FR')} F
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-4 md:p-6 shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-white">
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-1">Besoin d'aide ?</h3>
            <p className="text-teal-100 text-sm md:text-base">Consultez les guides ou contactez le support</p>
          </div>
          <div className="flex gap-3">
            <button className="px-3 md:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm md:text-base">
              <span>Guide</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-3 md:px-4 py-2 bg-white text-teal-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm md:text-base">
              Support
            </button>
          </div>
        </div>
      </motion.div>
      </>)}
    </div>
  );
}