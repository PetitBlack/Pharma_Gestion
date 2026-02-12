export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  auxiliaryId: string;
  auxiliaryName: string;
  workstation: string; // Poste / machine d'origine
  items: OrderItem[];
  total: number;
  status: 'En attente' | 'Payée' | 'Annulée';
  paymentMethod?: 'Espèces' | 'Mobile Money' | 'Autre';
  createdAt: string;
  paidAt?: string;
  cashierId?: string;
  cashierName?: string;
}

export type OrderStatus = 'En attente' | 'Payée' | 'Annulée';
export type OrderPaymentMethod = 'Espèces' | 'Mobile Money' | 'Autre';
