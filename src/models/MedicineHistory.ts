export type HistoryEventType = 'entry' | 'restock' | 'price_change' | 'sale';

export interface MedicineHistoryEvent {
  id: string;
  medicineId: string;
  medicineName: string;
  type: HistoryEventType;
  date: string; // ISO string

  // Entrée / Réapprovisionnement
  quantityAdded?: number;
  quantityAfter?: number;

  // Changement de prix
  wholesalePriceBefore?: number;
  wholesalePriceAfter?: number;
  sellingPriceBefore?: number;
  sellingPriceAfter?: number;

  // Vente
  quantitySold?: number;
  sellingPrice?: number;
  saleTotal?: number;

  note?: string;
  userId?: string;
  userName?: string;
}
