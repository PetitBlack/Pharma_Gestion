export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;           // montant final (après remise)
  discount?: number;       // remise en % (0–100)
  prescriptionId?: string; // référence à l'ordonnancier
}

export interface Order {
  cancelledBy: string;
  cancelledAt: any;
  cancellationReason: any;
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

  // Tiers payant (assurance / mutuelle)
  insuranceCompany?: string;   // Nom de la compagnie
  insuranceCoverage?: number;  // Montant pris en charge par l'assurance
}

export type OrderStatus = 'En attente' | 'Payée' | 'Annulée';
export type OrderPaymentMethod = 'Espèces' | 'Mobile Money' | 'Autre';
