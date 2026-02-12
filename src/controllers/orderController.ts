import { useState, useEffect } from 'react';
import type { Order, OrderItem, OrderPaymentMethod } from '@/models/Order';
import { medicineService } from '@/services/medicineService';

const ORDERS_STORAGE_KEY = 'epharmacy_orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les commandes au démarrage
  useEffect(() => {
    loadOrders();
  }, []);

  // Sauvegarder les commandes dans localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders, loading]);

  const loadOrders = () => {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = (
    items: OrderItem[],
    auxiliaryId: string,
    auxiliaryName: string,
    workstation: string
  ): Order => {
    const orderNumber = `CMD${Date.now()}`;
    const total = items.reduce((sum, item) => sum + item.total, 0);

    const newOrder: Order = {
      id: `order_${Date.now()}`,
      orderNumber,
      items,
      total,
      status: 'En attente',
      auxiliaryId,
      auxiliaryName,
      workstation,
      createdAt: new Date(),
      paymentMethod: undefined,
      cashierId: undefined,
      cashierName: undefined,
      paidAt: undefined
    };

    // Déduire du stock
    items.forEach(item => {
      medicineService.updateQuantity(item.medicineId, -item.quantity);
    });

    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const updateOrder = (orderId: string, updatedOrder: Order): Order | null => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    const oldOrder = orders[orderIndex];

    // Remettre l'ancien stock
    oldOrder.items.forEach(item => {
      medicineService.updateQuantity(item.medicineId, item.quantity);
    });

    // Déduire le nouveau stock
    updatedOrder.items.forEach(item => {
      medicineService.updateQuantity(item.medicineId, -item.quantity);
    });

    const newOrders = [...orders];
    newOrders[orderIndex] = updatedOrder;
    setOrders(newOrders);

    return updatedOrder;
  };

  const processPayment = (
    orderId: string,
    paymentMethod: OrderPaymentMethod,
    cashierId: string,
    cashierName: string
  ): Order | null => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    const updatedOrder: Order = {
      ...orders[orderIndex],
      status: 'Payée',
      paymentMethod,
      cashierId,
      cashierName,
      paidAt: new Date()
    };

    const newOrders = [...orders];
    newOrders[orderIndex] = updatedOrder;
    setOrders(newOrders);

    return updatedOrder;
  };

  const cancelOrder = (
    orderId: string,
    userId?: string,
    userName?: string,
    reason?: string
  ): Order | null => {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return null;

    const order = orders[orderIndex];

    // Remettre le stock
    order.items.forEach(item => {
      medicineService.updateQuantity(item.medicineId, item.quantity);
    });

    const updatedOrder: Order = {
      ...order,
      status: 'Annulée',
      cancelledAt: new Date(),
      cancelledBy: userName,
      cancellationReason: reason
    };

    const newOrders = [...orders];
    newOrders[orderIndex] = updatedOrder;
    setOrders(newOrders);

    return updatedOrder;
  };

  const getOrdersByAuxiliary = (auxiliaryId: string): Order[] => {
    return orders.filter(o => o.auxiliaryId === auxiliaryId);
  };

  const getOrdersByCashier = (cashierId: string): Order[] => {
    return orders.filter(o => o.cashierId === cashierId);
  };

  const getOrdersByStatus = (status: Order['status']): Order[] => {
    return orders.filter(o => o.status === status);
  };

  const getTodayOrders = (): Order[] => {
    const today = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });
  };

  const getTodayRevenue = (): number => {
    const today = new Date();
    return orders
      .filter(o => {
        if (o.status !== 'Payée' || !o.paidAt) return false;
        const paidDate = new Date(o.paidAt);
        return paidDate.toDateString() === today.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0);
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    processPayment,
    cancelOrder,
    getOrdersByAuxiliary,
    getOrdersByCashier,
    getOrdersByStatus,
    getTodayOrders,
    getTodayRevenue
  };
}