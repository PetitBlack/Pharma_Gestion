export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  dateOfBirth?: Date;
  gender?: 'Homme' | 'Femme' | 'Autre';
  
  // Informations d'assurance
  isInsured: boolean;
  insurance?: {
    company: string; // Nom de la compagnie d'assurance
    policyNumber: string; // Numéro de police
    coveragePercentage: number; // Pourcentage de couverture (ex: 80%)
    expiryDate?: Date; // Date d'expiration
    cardNumber?: string; // Numéro de carte d'assuré
  };
  
  // Informations médicales optionnelles
  allergies?: string[];
  chronicDiseases?: string[];
  notes?: string;
  
  // Historique
  totalPurchases: number; // Nombre total d'achats
  totalSpent: number; // Montant total dépensé
  lastVisit?: Date;
  
  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  status: 'Actif' | 'Inactif';
}

export interface ClientPurchase {
  id: string;
  clientId: string;
  clientName: string;
  orderId: string;
  orderNumber: string;
  items: {
    medicineName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  insuranceCoverage: number; // Montant couvert par l'assurance
  amountPaid: number; // Montant payé par le client
  total: number;
  purchaseDate: Date;
  paymentMethod: string;
}