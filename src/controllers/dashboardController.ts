import { useState, useEffect } from 'react';
import { useOrders } from './orderController';
import { useClients } from './clientController';
import { medicineService } from '@/services/medicineService';
import { supplierService } from '@/services/fournisseurs';
import { settingsService } from '@/services/settingsService';
import type { Order } from '@/models/Order';

interface DashboardStats {
  // Ventes
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalSalesYear: number;
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  averageOrderValue: number;
  
  // Stock
  totalMedicines: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
  outOfStockCount: number;
  
  // Clients
  totalClients: number;
  newClientsMonth: number;
  insuredClients: number;
  activeClients: number;
  
  // Performance
  topSellingMedicine: { name: string; quantity: number } | null;
  topClient: { name: string; spent: number } | null;
  bestPaymentMethod: string;
  
  // Comparaisons (vs période précédente)
  salesGrowth: number; // Pourcentage de croissance
  ordersGrowth: number;
  clientsGrowth: number;
}

interface SalesData {
  date: string;
  total: number;
  orders: number;
}

interface CategoryData {
  category: string;
  value: number;
  count: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

export function useDashboard() {
  const { orders } = useOrders();
  const { clients } = useClients();
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesToday: 0,
    totalSalesWeek: 0,
    totalSalesMonth: 0,
    totalSalesYear: 0,
    ordersToday: 0,
    ordersWeek: 0,
    ordersMonth: 0,
    averageOrderValue: 0,
    totalMedicines: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    expiringCount: 0,
    outOfStockCount: 0,
    totalClients: 0,
    newClientsMonth: 0,
    insuredClients: 0,
    activeClients: 0,
    topSellingMedicine: null,
    topClient: null,
    bestPaymentMethod: '',
    salesGrowth: 0,
    ordersGrowth: 0,
    clientsGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStats();
  }, [orders, clients]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    const d = new Date(date);
    return d.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date): boolean => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d = new Date(date);
    return d >= weekAgo && d <= now;
  };

  const isThisMonth = (date: Date): boolean => {
    const now = new Date();
    const d = new Date(date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isThisYear = (date: Date): boolean => {
    const now = new Date();
    const d = new Date(date);
    return d.getFullYear() === now.getFullYear();
  };

  const isLastMonth = (date: Date): boolean => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const d = new Date(date);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  };

  const isLastWeek = (date: Date): boolean => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d = new Date(date);
    return d >= twoWeeksAgo && d < weekAgo;
  };

  const calculateStats = () => {
    const paidOrders = orders.filter(o => o.status === 'Payée' && o.paidAt);
    const medicines = medicineService.getAll();
    const settings = settingsService.get();

    // Ventes
    const salesToday = paidOrders.filter(o => o.paidAt && isToday(new Date(o.paidAt))).reduce((sum, o) => sum + o.total, 0);
    const salesWeek = paidOrders.filter(o => o.paidAt && isThisWeek(new Date(o.paidAt))).reduce((sum, o) => sum + o.total, 0);
    const salesMonth = paidOrders.filter(o => o.paidAt && isThisMonth(new Date(o.paidAt))).reduce((sum, o) => sum + o.total, 0);
    const salesYear = paidOrders.filter(o => o.paidAt && isThisYear(new Date(o.paidAt))).reduce((sum, o) => sum + o.total, 0);
    
    const ordersToday = paidOrders.filter(o => o.paidAt && isToday(new Date(o.paidAt))).length;
    const ordersWeek = paidOrders.filter(o => o.paidAt && isThisWeek(new Date(o.paidAt))).length;
    const ordersMonth = paidOrders.filter(o => o.paidAt && isThisMonth(new Date(o.paidAt))).length;
    
    // Comparaisons avec période précédente
    const salesLastMonth = paidOrders.filter(o => o.paidAt && isLastMonth(new Date(o.paidAt))).reduce((sum, o) => sum + o.total, 0);
    const ordersLastMonth = paidOrders.filter(o => o.paidAt && isLastMonth(new Date(o.paidAt))).length;
    const ordersLastWeek = paidOrders.filter(o => o.paidAt && isLastWeek(new Date(o.paidAt))).length;
    
    const salesGrowth = salesLastMonth > 0 ? ((salesMonth - salesLastMonth) / salesLastMonth) * 100 : 0;
    const ordersGrowth = ordersLastWeek > 0 ? ((ordersWeek - ordersLastWeek) / ordersLastWeek) * 100 : 0;

    // Stock
    const totalStockValue = medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);
    const lowStockCount = medicineService.getLowStock(settings.lowStockThreshold).length;
    const expiringCount = medicineService.getExpiring(settings.expiryAlertDays).length;
    const outOfStockCount = medicines.filter(m => m.quantity === 0).length;

    // Clients
    const newClientsMonth = clients.filter(c => isThisMonth(c.createdAt)).length;
    const insuredClients = clients.filter(c => c.isInsured).length;
    const activeClients = clients.filter(c => c.status === 'Actif').length;
    
    const clientsLastMonth = clients.filter(c => isLastMonth(c.createdAt)).length;
    const clientsGrowth = clientsLastMonth > 0 ? ((newClientsMonth - clientsLastMonth) / clientsLastMonth) * 100 : 0;

    // Top selling medicine
    const medicinesSold: { [key: string]: { name: string; quantity: number } } = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!medicinesSold[item.medicineId]) {
          medicinesSold[item.medicineId] = { name: item.medicineName, quantity: 0 };
        }
        medicinesSold[item.medicineId].quantity += item.quantity;
      });
    });
    
    const topSellingMedicine = Object.values(medicinesSold).sort((a, b) => b.quantity - a.quantity)[0] || null;

    // Top client
    const topClient = clients.length > 0 
      ? clients.reduce((max, c) => c.totalSpent > max.totalSpent ? c : max, clients[0])
      : null;

    // Best payment method
    const paymentMethods: { [key: string]: number } = {};
    paidOrders.forEach(order => {
      if (order.paymentMethod) {
        paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
      }
    });
    const bestPaymentMethod = Object.keys(paymentMethods).sort((a, b) => paymentMethods[b] - paymentMethods[a])[0] || 'N/A';

    setStats({
      totalSalesToday: salesToday,
      totalSalesWeek: salesWeek,
      totalSalesMonth: salesMonth,
      totalSalesYear: salesYear,
      ordersToday,
      ordersWeek,
      ordersMonth,
      averageOrderValue: ordersMonth > 0 ? salesMonth / ordersMonth : 0,
      totalMedicines: medicines.length,
      totalStockValue,
      lowStockCount,
      expiringCount,
      outOfStockCount,
      totalClients: clients.length,
      newClientsMonth,
      insuredClients,
      activeClients,
      topSellingMedicine,
      topClient: topClient ? { name: topClient.fullName, spent: topClient.totalSpent } : null,
      bestPaymentMethod,
      salesGrowth,
      ordersGrowth,
      clientsGrowth
    });

    setLoading(false);
  };

  const getDailySalesChart = (days: number = 7): SalesData[] => {
    const data: SalesData[] = [];
    const paidOrders = orders.filter(o => o.status === 'Payée' && o.paidAt);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = paidOrders.filter(o => {
        const paidDate = new Date(o.paidAt!);
        return paidDate >= date && paidDate < nextDate;
      });

      data.push({
        date: date.toISOString(),
        total: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length
      });
    }

    return data;
  };

  const getMonthlySalesChart = (months: number = 6): SalesData[] => {
    const data: SalesData[] = [];
    const paidOrders = orders.filter(o => o.status === 'Payée' && o.paidAt);

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const monthOrders = paidOrders.filter(o => {
        const paidDate = new Date(o.paidAt!);
        return paidDate.getMonth() === date.getMonth() && 
               paidDate.getFullYear() === date.getFullYear();
      });

      data.push({
        date: date.toISOString(),
        total: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length
      });
    }

    return data;
  };

  const getCategoryDistribution = (): CategoryData[] => {
    const medicines = medicineService.getAll();
    const categories: { [key: string]: { value: number; count: number } } = {};

    medicines.forEach(med => {
      if (!categories[med.category]) {
        categories[med.category] = { value: 0, count: 0 };
      }
      categories[med.category].value += med.price * med.quantity;
      categories[med.category].count += med.quantity;
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count
    })).sort((a, b) => b.value - a.value);
  };

  const getPaymentMethodsDistribution = (): PaymentMethodData[] => {
    const paidOrders = orders.filter(o => o.status === 'Payée' && o.paymentMethod);
    const methods: { [key: string]: { amount: number; count: number } } = {};

    paidOrders.forEach(order => {
      const method = order.paymentMethod!;
      if (!methods[method]) {
        methods[method] = { amount: 0, count: 0 };
      }
      methods[method].amount += order.total;
      methods[method].count += 1;
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount);
  };

  const getTopSellingMedicines = (limit: number = 10) => {
    const paidOrders = orders.filter(o => o.status === 'Payée');
    const medicinesSold: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!medicinesSold[item.medicineId]) {
          medicinesSold[item.medicineId] = { name: item.medicineName, quantity: 0, revenue: 0 };
        }
        medicinesSold[item.medicineId].quantity += item.quantity;
        medicinesSold[item.medicineId].revenue += item.total;
      });
    });

    return Object.values(medicinesSold)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  };

  const getTopClients = (limit: number = 10) => {
    return clients
      .filter(c => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map(c => ({
        id: c.id,
        name: c.fullName,
        totalSpent: c.totalSpent,
        totalPurchases: c.totalPurchases,
        isInsured: c.isInsured
      }));
  };

  const getRecentActivities = (limit: number = 10) => {
    const activities: any[] = [];

    // Commandes récentes
    orders.slice(-limit).reverse().forEach(order => {
      activities.push({
        id: order.id,
        type: 'order',
        status: order.status,
        description: `Commande ${order.orderNumber} - ${order.auxiliaryName}`,
        amount: order.total,
        date: order.status === 'Payée' ? order.paidAt : order.createdAt
      });
    });

    // Nouveaux clients
    clients.slice(-5).reverse().forEach(client => {
      activities.push({
        id: client.id,
        type: 'client',
        description: `Nouveau client: ${client.fullName}`,
        date: client.createdAt
      });
    });

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  return {
    stats,
    loading,
    getDailySalesChart,
    getMonthlySalesChart,
    getCategoryDistribution,
    getPaymentMethodsDistribution,
    getTopSellingMedicines,
    getTopClients,
    getRecentActivities
  };
}