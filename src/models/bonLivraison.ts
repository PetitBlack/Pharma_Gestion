export interface BonLivraisonItem {
  medicineId: string;
  medicineName: string;
  quantityOrdered: number; // Quantité commandée
  quantityReceived: number; // Quantité réellement reçue
  unitPrice: number;
  batchNumber?: string; // Numéro de lot
  expirationDate?: Date; // Date d'expiration
  discrepancy?: number; // Écart (reçu - commandé)
}

export interface BonLivraison {
  id: string;
  blNumber: string; // Numéro du BL (ex: BL-2024-001)
  
  // Référence commande fournisseur
  supplierOrderId?: string;
  supplierOrderNumber?: string;
  
  // Informations fournisseur
  supplierId: string;
  supplierName: string;
  
  // Dates
  orderDate?: Date; // Date de la commande
  deliveryDate: Date; // Date de livraison
  createdAt: Date;
  
  // Articles
  items: BonLivraisonItem[];
  
  // Totaux
  subtotal: number;
  tax: number;
  totalAmount: number;
  
  // Statut
  status: 'En attente' | 'Vérifié' | 'Validé' | 'Litige' | 'Archivé';
  
  // Vérification
  hasDiscrepancies: boolean; // Y'a-t-il des écarts ?
  discrepancyNotes?: string; // Notes sur les écarts
  
  // Livreur
  deliveryPerson?: string;
  
  // Validation
  verifiedBy?: string; // Qui a vérifié
  verifiedAt?: Date;
  validatedBy?: string; // Qui a validé
  validatedAt?: Date;
  
  // Documents
  attachments?: string[]; // URLs ou chemins vers documents scannés
  
  // Notes
  notes?: string;
}

export interface BLComparison {
  blId: string;
  orderId: string;
  blNumber: string;
  orderNumber: string;
  matchStatus: 'Parfait' | 'Écarts mineurs' | 'Écarts majeurs';
  itemsComparison: {
    medicineId: string;
    medicineName: string;
    ordered: number;
    received: number;
    difference: number;
    status: 'OK' | 'Moins' | 'Plus' | 'Manquant' | 'Non commandé';
  }[];
  totalOrdered: number;
  totalReceived: number;
  totalDifference: number;
}