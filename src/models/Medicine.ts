export interface Medicine {
  id: string;
  name: string;
  category: string;
  batchNumber: string;
  expirationDate: string;
  quantity: number;
  price: number;
  status: 'OK' | 'Low' | 'Expiring' | 'Expired';
  description?: string;
  manufacturer?: string;
  location?: string; // Emplacement dans la pharmacie (ex: "Rayon A - Étagère 2")
}

export type MedicineStatus = 'OK' | 'Low' | 'Expiring' | 'Expired';