export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string; // Numéro fiscal / IFU
  paymentTerms: string; // Conditions de paiement (ex: "30 jours", "À la livraison")
  category: string[]; // Catégories de produits fournis
  status: 'Actif' | 'Inactif' | 'Suspendu';
  rating: number; // Note de 1 à 5
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderNumber: string;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'En attente' | 'Commandé' | 'Livré' | 'Annulé';
  items: SupplierOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SupplierOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference?: string;
  createdBy: string;
  createdAt: Date;
}