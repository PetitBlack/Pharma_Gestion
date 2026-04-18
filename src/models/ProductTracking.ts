export type TrackingStatus =
  | 'En suivi'
  | 'Retourné partiellement'
  | 'Retourné totalement'
  | 'Vendu'
  | 'Expiré';

export interface ProductTracking {
  id: string;
  trackingNumber: string;      // TRK-YYYY-NNNN

  medicineId: string;
  medicineName: string;

  supplierName: string;
  supplierId?: string;

  delegateName?: string;       // Délégué commercial qui a proposé le produit

  blId?: string;               // Référence au bon de livraison
  blNumber?: string;

  entryDate: string;           // Date de mise en suivi (ISO)
  returnDeadline: string;      // Date limite de retour (ISO)

  initialQuantity: number;     // Quantité reçue / commandée
  quantityReturned: number;    // Quantité retournée au grossiste

  unitCost: number;            // Prix grossiste (prix d'achat)
  sellingPrice: number;        // Prix de vente client

  status: TrackingStatus;

  notes?: string;
  createdAt: string;
  createdBy?: string;
}
