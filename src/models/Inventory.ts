export type InventoryStatus = 'En cours' | 'Terminé' | 'Validé';

export interface InventoryItem {
  medicineId: string;
  medicineName: string;
  category: string;
  location?: string;
  systemQty: number;       // Quantité système au moment du snapshot
  physicalQty?: number;    // Quantité comptée physiquement (undefined = pas encore compté)
  discrepancy?: number;    // physicalQty - systemQty (calculé)
  unitPrice: number;       // Prix de vente
  batchNumber: string;
  expirationDate: string;
  countedBy?: string;
  countedAt?: string;
  notes?: string;
}

export interface Inventory {
  id: string;
  inventoryNumber: string;   // INV-YYYY-NNNN
  name: string;
  year: number;
  startDate: string;
  endDate?: string;
  status: InventoryStatus;
  items: InventoryItem[];
  createdBy: string;
  validatedBy?: string;
  validatedAt?: string;
  notes?: string;

  // Statistiques (mises à jour à chaque comptage)
  totalItems: number;
  countedItems: number;
  discrepanciesCount: number;
  totalSystemValue: number;    // Valeur théorique (stock système)
  totalPhysicalValue: number;  // Valeur physique comptée
}
