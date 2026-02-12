import { useEffect, useState } from 'react';
import { 
  DollarSign, Package, AlertTriangle, Calendar, Users, TrendingUp, TrendingDown,
  ShoppingCart, CreditCard, Award, Activity, Clock, CheckCircle, Shield,
  Minus, ArrowRight, AlertCircle, MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { StatCard } from '@/app/components/StatCard';
import { useDashboard } from '@/controllers/dashboardController';
import { medicineService } from '@/services/medicineService';
import { settingsService } from '@/services/settingsService';
import type { Medicine } from '@/models/Medicine';

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

  const [timeRange, setTimeRange] = useState<'daily' | 'monthly'>('daily');
  const [chartData, setChartData] = useState<any[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<Medicine[]>([]);
  const [expiringMeds, setExpiringMeds] = useState<Medicine[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
  const [topMedicines, setTopMedicines] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Vue d'ensemble de votre e-pharmacie</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeRange === 'daily' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                timeRange === 'monthly' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              6 mois
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}