export interface PharmacySettings {
  // Identité de la pharmacie
  pharmacyName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  license: string;
  openingHours: string;

  // Paramètres de stock
  lowStockThreshold: number;
  expiryAlertDays: number;

  // Paramètres de prix
  currency: string;
  defaultMarginPct: number;

  // Sauvegarde
  backupEnabled: boolean;
  backupFrequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel';
}
