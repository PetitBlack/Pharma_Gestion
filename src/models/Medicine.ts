export interface Medicine {
  id: string;
  name: string;          // Nom commercial / marque (ex: Doliprane)
  moleculeName?: string; // Principe actif / DCI (ex: Paracétamol)
  brandName?: string;    // Nom de marque alternatif si différent du name
  category: string;
  batchNumber: string;
  expirationDate: string;
  quantity: number;      // Peut être négatif (erreurs de stock autorisées)
  price: number;
  status: 'OK' | 'Low' | 'Expiring' | 'Expired' | 'Negative';
  description?: string;
  manufacturer?: string;
  location?: string;
  requiresPrescription?: boolean; // Produit sous ordonnance / sous clé
}

export type MedicineStatus = 'OK' | 'Low' | 'Expiring' | 'Expired';