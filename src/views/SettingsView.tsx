import { useState } from 'react';
import {
  Save, Building2, AlertTriangle, Database, Download, Upload,
  Package, DollarSign, Clock, Phone, Mail, MapPin, FileText,
  CheckCircle, Settings,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { settingsService } from '@/services/settingsService';
import type { PharmacySettings } from '@/models/Settings';
import { toast } from 'sonner';
import type { User } from '@/models/User';

interface SettingsViewProps {
  currentUser: User;
}

// ── Composant section ────────────────────────────────────────────────────────
function Section({
  icon: Icon, iconBg, iconColor, title, subtitle, children,
}: {
  icon: any; iconBg: string; iconColor: string;
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
        <div className={`w-11 h-11 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Champ de formulaire ──────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Clés localStorage à exporter ─────────────────────────────────────────────
const EXPORT_KEYS = [
  'epharmacy_medicines',
  'epharmacy_orders',
  'epharmacy_clients',
  'epharmacy_suppliers',
  'epharmacy_bons_livraison',
  'epharmacy_retours',
  'epharmacy_product_trackings',
  'epharmacy_inventories',
  'epharmacy_settings',
  'epharmacy_users',
  'epharmacy_sales',
  'epharmacy_activity_log',
];

export function SettingsView({ currentUser }: SettingsViewProps) {
  const [settings, setSettings] = useState<PharmacySettings>(settingsService.get());
  const [saved, setSaved] = useState(false);

  const set = (patch: Partial<PharmacySettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    settingsService.update(settings);
    setSaved(true);
    toast.success('Paramètres enregistrés');
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Export données ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const data: Record<string, any> = {};
    EXPORT_KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmaa-gest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Données exportées avec succès');
  };

  // ── Import données ──────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let count = 0;
        Object.entries(data).forEach(([key, val]) => {
          if (EXPORT_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(val));
            count++;
          }
        });
        toast.success(`Import réussi — ${count} section(s) restaurée(s). Rechargez la page.`);
      } catch {
        toast.error('Fichier invalide. Vérifiez le format JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-gray-600" />
              Paramètres
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Configuration générale de l'application</p>
          </div>
          <Button
            onClick={handleSave}
            className={`transition-all ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {saved
              ? <><CheckCircle className="w-4 h-4 mr-2" />Enregistré</>
              : <><Save className="w-4 h-4 mr-2" />Enregistrer</>
            }
          </Button>
        </motion.div>

        {/* ── 1. Identité de la pharmacie ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section
            icon={Building2} iconBg="bg-teal-100" iconColor="text-teal-700"
            title="Informations de la pharmacie"
            subtitle="Nom, coordonnées et identifiants officiels"
          >
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <Field label="Nom de la pharmacie *">
                  <Input
                    value={settings.pharmacyName}
                    onChange={e => set({ pharmacyName: e.target.value })}
                    placeholder="Ex : Pharmacie Centrale"
                    className="h-11"
                  />
                </Field>
              </div>
              <Field label="Numéro d'autorisation / licence">
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={settings.license}
                    onChange={e => set({ license: e.target.value })}
                    placeholder="Ex : PHM-2024-00123"
                    className="pl-9 h-11"
                  />
                </div>
              </Field>
              <Field label="Horaires d'ouverture">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={settings.openingHours}
                    onChange={e => set({ openingHours: e.target.value })}
                    placeholder="Ex : Lun – Sam : 07h30 – 20h00"
                    className="pl-9 h-11"
                  />
                </div>
              </Field>
              <div className="col-span-2">
                <Field label="Adresse">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={settings.address}
                      onChange={e => set({ address: e.target.value })}
                      placeholder="Rue, quartier..."
                      className="pl-9 h-11"
                    />
                  </div>
                </Field>
              </div>
              <Field label="Ville / Localité">
                <Input
                  value={settings.city}
                  onChange={e => set({ city: e.target.value })}
                  placeholder="Ex : Dakar"
                  className="h-11"
                />
              </Field>
              <Field label="Téléphone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={settings.phone}
                    onChange={e => set({ phone: e.target.value })}
                    placeholder="Ex : +221 77 000 00 00"
                    className="pl-9 h-11"
                  />
                </div>
              </Field>
              <Field label="Adresse email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={e => set({ email: e.target.value })}
                    placeholder="contact@pharmacie.com"
                    className="pl-9 h-11"
                  />
                </div>
              </Field>
            </div>
          </Section>
        </motion.div>

        {/* ── 2. Gestion du stock ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section
            icon={Package} iconBg="bg-orange-100" iconColor="text-orange-700"
            title="Gestion du stock"
            subtitle="Seuils d'alerte et surveillance des dates de péremption"
          >
            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Seuil de stock bas (unités)"
                hint="Une alerte est déclenchée en dessous de ce seuil"
              >
                <Input
                  type="number" min="1"
                  value={settings.lowStockThreshold}
                  onChange={e => set({ lowStockThreshold: parseInt(e.target.value) || 20 })}
                  className="h-11"
                />
              </Field>
              <Field
                label="Alerte péremption (jours)"
                hint="Signaler les produits expirant dans ce délai"
              >
                <Input
                  type="number" min="1"
                  value={settings.expiryAlertDays}
                  onChange={e => set({ expiryAlertDays: parseInt(e.target.value) || 90 })}
                  className="h-11"
                />
              </Field>
            </div>

            {/* Aperçu */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-orange-800">Stock bas</p>
                  <p className="text-orange-600">Alerte si quantité &lt; <strong>{settings.lowStockThreshold}</strong> unités</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800">Péremption</p>
                  <p className="text-yellow-600">Alerte à <strong>{settings.expiryAlertDays}</strong> jours avant expiration</p>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* ── 3. Prix et marges ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section
            icon={DollarSign} iconBg="bg-green-100" iconColor="text-green-700"
            title="Prix et marges"
            subtitle="Devise et marge bénéficiaire par défaut"
          >
            <div className="grid grid-cols-2 gap-5">
              <Field label="Devise" hint="Utilisée sur toutes les factures et rapports">
                <Input
                  value={settings.currency}
                  onChange={e => set({ currency: e.target.value })}
                  placeholder="Ex : FCFA"
                  className="h-11"
                />
              </Field>
              <Field
                label="Marge bénéficiaire par défaut (%)"
                hint="Pré-remplie lors de l'ajout d'un nouveau médicament"
              >
                <div className="relative">
                  <Input
                    type="number" min="0" max="500" step="1"
                    value={settings.defaultMarginPct}
                    onChange={e => set({ defaultMarginPct: parseFloat(e.target.value) || 0 })}
                    className="h-11 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">%</span>
                </div>
              </Field>
            </div>
            <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm text-green-700">
              Exemple : pour un achat à <strong>1 000 {settings.currency}</strong> avec {settings.defaultMarginPct}% de marge → prix de vente = <strong>{(1000 * (1 + settings.defaultMarginPct / 100)).toLocaleString('fr-FR')} {settings.currency}</strong>
            </div>
          </Section>
        </motion.div>

        {/* ── 4. Données & Sauvegarde ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section
            icon={Database} iconBg="bg-blue-100" iconColor="text-blue-700"
            title="Données & Sauvegarde"
            subtitle="Exportez ou importez l'ensemble des données de l'application"
          >
            <div className="space-y-4">
              {/* Export */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Exporter les données</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Télécharge un fichier JSON contenant médicaments, ventes, clients, inventaires…
                  </p>
                </div>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0 ml-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>

              {/* Import */}
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Importer des données</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Restaure depuis un fichier de sauvegarde. <span className="font-semibold">Les données actuelles seront remplacées.</span>
                  </p>
                </div>
                <label className="shrink-0 ml-4 cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-white text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    Importer
                  </span>
                </label>
              </div>

              {/* Info stockage */}
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 flex items-start gap-2">
                <Database className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                <span>
                  Les données sont stockées localement dans le navigateur (localStorage).
                  Utilisez l'export régulièrement pour éviter toute perte en cas de vidage du cache.
                </span>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Bouton Enregistrer bas de page */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="flex justify-end pb-4"
        >
          <Button
            onClick={handleSave}
            size="lg"
            className={`px-8 transition-all ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {saved
              ? <><CheckCircle className="w-4 h-4 mr-2" />Paramètres enregistrés</>
              : <><Save className="w-4 h-4 mr-2" />Enregistrer les paramètres</>
            }
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
