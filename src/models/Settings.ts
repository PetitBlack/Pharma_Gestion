export interface PharmacySettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  license: string;
  lowStockThreshold: number;
  expiryAlertDays: number;
  backupEnabled: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';
}
