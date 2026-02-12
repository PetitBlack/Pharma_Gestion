import { useState, useEffect } from 'react';
import { Save, Building2, Shield, Database } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { settingsService } from '@/services/settingsService';
import type { PharmacySettings } from '@/models/Settings';
import { toast } from 'sonner';
import { User } from '@/models/User';

interface SettingsViewProps {
  currentUser: User;
}

export function SettingsView({ currentUser }: SettingsViewProps) {
  const [settings, setSettings] = useState<PharmacySettings>(settingsService.get());

  const handleSave = () => {
    settingsService.update(settings);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Pharmacy Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pharmacy Information</h3>
                <p className="text-sm text-gray-600">Basic pharmacy details</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                <Input
                  id="pharmacyName"
                  value={settings.pharmacyName}
                  onChange={(e) => setSettings({ ...settings, pharmacyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={settings.license}
                  onChange={(e) => setSettings({ ...settings, license: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock Alerts Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
                <p className="text-sm text-gray-600">Configure alert thresholds</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 20 })}
                />
                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this quantity</p>
              </div>
              <div>
                <Label htmlFor="expiryAlertDays">Expiry Alert (Days)</Label>
                <Input
                  id="expiryAlertDays"
                  type="number"
                  value={settings.expiryAlertDays}
                  onChange={(e) => setSettings({ ...settings, expiryAlertDays: parseInt(e.target.value) || 90 })}
                />
                <p className="text-xs text-gray-500 mt-1">Alert for medicines expiring within this period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Backup Configuration</h3>
                <p className="text-sm text-gray-600">Manage data backup settings</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backupEnabled">Automatic Backup</Label>
                <p className="text-sm text-gray-600">Enable automated database backups</p>
              </div>
              <Switch
                id="backupEnabled"
                checked={settings.backupEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, backupEnabled: checked })}
              />
            </div>

            {settings.backupEnabled && (
              <div>
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value: 'Daily' | 'Weekly' | 'Monthly') =>
                    setSettings({ ...settings, backupFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
