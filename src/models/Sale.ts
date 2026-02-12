export interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'Cash' | 'Mobile Money';
  date: string;
  userId: string;
  userName: string;
}

export type PaymentMethod = 'Cash' | 'Mobile Money';
