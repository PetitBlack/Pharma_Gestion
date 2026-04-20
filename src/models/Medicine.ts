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
  minStock?: number;              // Quantité minimale pour suggestion de commande

  // ── Conditionnement ──────────────────────────────────────────────────────
  packagingType?: 'standard' | 'bulk' | 'detail';
  // bulk : quantité stockée = total unités de base (ex. 3000 gélules)
  packSize?: number;    // nb d'unités de base dans un colis reçu (ex. 1000)
  packLabel?: string;   // libellé du colis (ex. "boîte")
  // detail : quantité calculée dynamiquement depuis le parent
  detailOf?: string;    // id du médicament parent (bulk)
  detailSize?: number;  // nb d'unités de base par unité détail (ex. 10 par plaquette)
  detailLabel?: string; // libellé de l'unité détail (ex. "plaquette")
}

export type MedicineStatus = 'OK' | 'Low' | 'Expiring' | 'Expired';