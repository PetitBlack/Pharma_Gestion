import type { PharmacySettings } from '@/models/Settings';
import { mockSettings } from './mockData';

class SettingsService {
  private settings: PharmacySettings = { ...mockSettings };

  get(): PharmacySettings {
    return { ...this.settings };
  }

  update(updates: Partial<PharmacySettings>): PharmacySettings {
    this.settings = { ...this.settings, ...updates };
    return { ...this.settings };
  }
}

export const settingsService = new SettingsService();
