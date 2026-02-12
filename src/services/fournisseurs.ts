import type { Supplier, SupplierOrder, SupplierPayment } from '@/models/fournisseurs';

class SupplierService {
  private storageKey = 'epharmacy_suppliers';
  private ordersKey = 'epharmacy_supplier_orders';
  private paymentsKey = 'epharmacy_supplier_payments';

  // Fournisseurs
  getAll(): Supplier[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this.getInitialSuppliers();
  }

  getById(id: string): Supplier | null {
    const suppliers = this.getAll();
    return suppliers.find(s => s.id === id) || null;
  }

  create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const suppliers = this.getAll();
    const newSupplier: Supplier = {
      ...supplier,
      id: `SUP${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    suppliers.push(newSupplier);
    localStorage.setItem(this.storageKey, JSON.stringify(suppliers));
    return newSupplier;
  }

  update(id: string, updates: Partial<Supplier>): Supplier | null {
    const suppliers = this.getAll();
    const index = suppliers.findIndex(s => s.id === id);
    if (index === -1) return null;

    suppliers[index] = {
      ...suppliers[index],
      ...updates,
      updatedAt: new Date()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(suppliers));
    return suppliers[index];
  }

  delete(id: string): boolean {
    const suppliers = this.getAll();
    const filtered = suppliers.filter(s => s.id !== id);
    if (filtered.length === suppliers.length) return false;
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }

  // Commandes fournisseurs
  getAllOrders(): SupplierOrder[] {
    const data = localStorage.getItem(this.ordersKey);
    return data ? JSON.parse(data) : [];
  }

  getOrdersBySupplierId(supplierId: string): SupplierOrder[] {
    const orders = this.getAllOrders();
    return orders.filter(o => o.supplierId === supplierId);
  }

  createOrder(order: Omit<SupplierOrder, 'id' | 'orderNumber' | 'createdAt'>): SupplierOrder {
    const orders = this.getAllOrders();
    const orderNumber = `PO${Date.now()}`;
    const newOrder: SupplierOrder = {
      ...order,
      id: `ORDER${Date.now()}`,
      orderNumber,
      createdAt: new Date()
    };
    orders.push(newOrder);
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    return newOrder;
  }

  updateOrderStatus(id: string, status: SupplierOrder['status']): SupplierOrder | null {
    const orders = this.getAllOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index].status = status;
    if (status === 'Livré' && !orders[index].deliveryDate) {
      orders[index].deliveryDate = new Date();
    }
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
    return orders[index];
  }

  // Paiements
  getAllPayments(): SupplierPayment[] {
    const data = localStorage.getItem(this.paymentsKey);
    return data ? JSON.parse(data) : [];
  }

  getPaymentsBySupplierId(supplierId: string): SupplierPayment[] {
    const payments = this.getAllPayments();
    return payments.filter(p => p.supplierId === supplierId);
  }

  createPayment(payment: Omit<SupplierPayment, 'id' | 'createdAt'>): SupplierPayment {
    const payments = this.getAllPayments();
    const newPayment: SupplierPayment = {
      ...payment,
      id: `PAY${Date.now()}`,
      createdAt: new Date()
    };
    payments.push(newPayment);
    localStorage.setItem(this.paymentsKey, JSON.stringify(payments));
    return newPayment;
  }

  // Statistiques
  getSupplierStats(supplierId: string) {
    const orders = this.getOrdersBySupplierId(supplierId);
    const payments = this.getPaymentsBySupplierId(supplierId);

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalSpent - totalPaid;

    const deliveredOrders = orders.filter(o => o.status === 'Livré').length;
    const pendingOrders = orders.filter(o => o.status === 'En attente' || o.status === 'Commandé').length;

    return {
      totalOrders,
      totalSpent,
      totalPaid,
      balance,
      deliveredOrders,
      pendingOrders
    };
  }

  private getInitialSuppliers(): Supplier[] {
    const initial: Supplier[] = [
      {
        id: 'SUP001',
        name: 'Koné Mamadou',
        companyName: 'Pharma Distribution BF',
        email: 'contact@pharmadistribution.bf',
        phone: '+226 70 12 34 56',
        address: 'Avenue Kwamé N\'Krumah',
        city: 'Ouagadougou',
        country: 'Burkina Faso',
        taxId: 'IFU001234567',
        paymentTerms: '30 jours',
        category: ['Antibiotiques', 'Antalgiques', 'Vitamines'],
        status: 'Actif',
        rating: 4.5,
        notes: 'Fournisseur principal, livraisons rapides',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'SUP002',
        name: 'Traoré Aminata',
        companyName: 'MediStock Sahel',
        email: 'info@medistock.bf',
        phone: '+226 76 98 76 54',
        address: 'Zone industrielle Gounghin',
        city: 'Ouagadougou',
        country: 'Burkina Faso',
        taxId: 'IFU007654321',
        paymentTerms: 'À la livraison',
        category: ['Antiseptiques', 'Matériel médical', 'Pansements'],
        status: 'Actif',
        rating: 4.0,
        notes: 'Bon rapport qualité-prix',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
      },
      {
        id: 'SUP003',
        name: 'Sawadogo Ibrahim',
        companyName: 'Global Pharma Import',
        email: 'contact@globalpharma.bf',
        phone: '+226 71 23 45 67',
        address: 'Boulevard Charles de Gaulle',
        city: 'Bobo-Dioulasso',
        country: 'Burkina Faso',
        paymentTerms: '60 jours',
        category: ['Médicaments génériques', 'Produits de parapharmacie'],
        status: 'Actif',
        rating: 3.5,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05')
      }
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }
}

export const supplierService = new SupplierService();