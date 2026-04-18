export interface BonLivraisonItem {
  medicineId: string;
  medicineName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;             // Prix grossiste (prix d'achat)
  sellingPrice?: number;         // Prix de vente client calculé
  taxRate?: number;              // Taux de taxe en % (ex: 18 pour TVA)
  taxAmount?: number;            // Montant taxe calculé
  batchNumber?: string;
  expirationDate?: Date;
  discrepancy?: number;
  priceChanged?: boolean;        // Vrai si le prix de vente diffère du stock
  previousSellingPrice?: number; // Ancien prix de vente en stock (référence)
  currentStock?: number;         // Stock actuel au moment de la saisie
}

export type RetourReason = 'Périmé' | 'Endommagé' | 'Erreur de commande' | 'Qualité insuffisante' | 'Autre';

export interface RetourItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  reason: RetourReason;
  batchNumber?: string;
  totalAmount: number;
  notes?: string;
}

export interface RetourFournisseur {
  id: string;
  retourNumber: string;
  blId?: string;
  blNumber?: string;
  supplierId?: string;
  supplierName: string;
  returnDate: string;
  createdAt: string;
  items: RetourItem[];
  totalAmount: number;
  status: 'En attente' | 'Envoyé' | 'Accepté' | 'Refusé';
  notes?: string;
  createdBy?: string;
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