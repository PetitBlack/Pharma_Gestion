import type { Order, OrderItem, OrderPaymentMethod } from '@/models/Order';

class OrderService {
  private orders: Order[] = [];
  private orderCounter = 1;

  getAll(): Order[] {
    return [...this.orders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id);
  }

  getPendingOrders(): Order[] {
    return this.orders.filter(o => o.status === 'En attente');
  }

  getOrdersByAuxiliary(auxiliaryId: string): Order[] {
    return this.orders.filter(o => o.auxiliaryId === auxiliaryId);
  }

  createOrder(
    items: OrderItem[],
    auxiliaryId: string,
    auxiliaryName: string,
    workstation: string
  ): Order {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const orderNumber = `CMD${String(this.orderCounter).padStart(6, '0')}`;
    this.orderCounter++;

    const newOrder: Order = {
      id: `ORD${Date.now()}`,
      orderNumber,
      auxiliaryId,
      auxiliaryName,
      workstation,
      items,
      total,
      status: 'En attente',
      createdAt: new Date().toISOString()
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  processPayment(
    orderId: string,
    paymentMethod: OrderPaymentMethod,
    cashierId: string,
    cashierName: string
  ): Order | null {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;
    
    // Vérifier que la commande n'a pas déjà été payée
    if (order.status === 'Payée') {
      throw new Error('Cette commande a déjà été encaissée');
    }

    order.status = 'Payée';
    order.paymentMethod = paymentMethod;
    order.paidAt = new Date().toISOString();
    order.cashierId = cashierId;
    order.cashierName = cashierName;

    return order;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;
    
    if (order.status === 'Payée') {
      throw new Error('Impossible d\'annuler une commande déjà payée');
    }

    order.status = 'Annulée';
    return true;
  }

  getTodayOrders(): Order[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });
  }

  getTodayRevenue(): number {
    return this.getTodayOrders()
      .filter(o => o.status === 'Payée')
      .reduce((sum, order) => sum + order.total, 0);
  }
}

export const orderService = new OrderService();
