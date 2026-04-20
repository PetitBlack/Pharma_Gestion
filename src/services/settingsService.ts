import type { PharmacySettings } from '@/models/Settings';

const STORAGE_KEY = 'epharmacy_settings';

const DEFAULTS: PharmacySettings = {
  pharmacyName: 'Pharmaa Gest',
  address: '',
  city: '',
  phone: '',
  email: '',
  license: '',
  openingHours: 'Lun – Sam : 07h30 – 20h00',
  lowStockThreshold: 20,
  expiryAlertDays: 90,
  currency: 'FCFA',
  defaultMarginPct: 50,
  backupEnabled: false,
  backupFrequency: 'Quotidien',
};

class SettingsService {
  get(): PharmacySettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  update(updates: Partial<PharmacySettings>): PharmacySettings {
    const current = this.get();
    const next = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
}

export const settingsService = new SettingsService();
