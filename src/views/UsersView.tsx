import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, User as UserIcon, Shield, Briefcase,
  X, Eye, EyeOff, AlertTriangle, LayoutDashboard, Pill,
  ShoppingCart, Users, Settings, Building2, ClipboardList,
  CreditCard, CheckCircle, Package, Lock, ArrowLeft,
  Activity, TrendingUp, BarChart2, Banknote, Smartphone,
  Calendar, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { userService } from '@/services/userService';
import { activityService } from '@/services/activityService';
import { useOrders } from '@/controllers/orderController';
import type { User, UserRole } from '@/models/User';
import type { Order } from '@/models/Order';
import { toast } from 'sonner';

interface UsersViewProps {
  currentUser: User | null;
}

type ViewMode = 'list' | 'add' | 'edit' | 'profile';
type ProfileTab = 'overview' | 'sales' | 'activity';

// Tous les modules disponibles pour la sélection
const ALL_MODULES = [
  { id: 'dashboard',     label: 'Tableau de bord',  icon: LayoutDashboard },
  { id: 'medicines',     label: 'Médicaments',       icon: Pill },
  { id: 'clients',       label: 'Clients',           icon: UserIcon },
  { id: 'fournisseurs',  label: 'Fournisseurs',      icon: Building2 },
  { id: 'bonsLivraison', label: 'Bons de Livraison', icon: ClipboardList },
  { id: 'sales',         label: 'Ventes',            icon: ShoppingCart },
  { id: 'auxiliaire',    label: 'Point de Vente',    icon: ClipboardList },
  { id: 'caisse',        label: 'Caisse',            icon: CreditCard },
  { id: 'alerts',        label: 'Alertes Stock',     icon: AlertTriangle },
];

// Modules Admin (fixes, non modifiables)
const ADMIN_MODULES = [
  ...ALL_MODULES,
  { id: 'users',    label: 'Utilisateurs', icon: Users },
  { id: 'settings', label: 'Paramètres',   icon: Settings },
];

// Modules cochés par défaut selon le rôle
const DEFAULT_MODULES: Record<string, string[]> = {
  Employee:   ['dashboard', 'medicines', 'clients', 'fournisseurs', 'bonsLivraison', 'sales', 'alerts'],
  Auxiliaire: ['auxiliaire'],
  Caisse:     ['caisse'],
};

// Pour la carte liste — modules affichés
const MODULE_CONFIG: Record<string, typeof ALL_MODULES> = {
  Admin:      ADMIN_MODULES,
  Employee:   ALL_MODULES.filter(m => DEFAULT_MODULES.Employee.includes(m.id)),
  Auxiliaire: ALL_MODULES.filter(m => DEFAULT_MODULES.Auxiliaire.includes(m.id)),
  Caisse:     ALL_MODULES.filter(m => DEFAULT_MODULES.Caisse.includes(m.id)),
};

export function UsersView({ currentUser }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders } = useOrders();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'Employee' as UserRole,
    workstation: '',
    allowedModules: DEFAULT_MODULES['Employee'] as string[],
  });

  const handleRoleChange = (value: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: value,
      allowedModules: DEFAULT_MODULES[value] ?? [],
    }));
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(moduleId)
        ? prev.allowedModules.filter(id => id !== moduleId)
        : [...prev.allowedModules, moduleId],
    }));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(userService.getAll());
  };

  const handleAdd = () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    userService.add({
      ...formData,
      allowedModules: formData.role === 'Admin' ? undefined : formData.allowedModules,
    });
    toast.success('Utilisateur ajouté avec succès');
    resetForm();
    setViewMode('list');
    loadUsers();
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email || '',
      role: user.role,
      workstation: user.workstation || '',
      allowedModules: user.allowedModules ?? DEFAULT_MODULES[user.role] ?? [],
    });
    setViewMode('edit');
  };

  const handleUpdate = () => {
    if (!selectedUser) return;

    if (!formData.fullName) {
      toast.error('Le nom complet est obligatoire');
      return;
    }

    const updates: any = {
      fullName: formData.fullName,
      email: formData.email || undefined,
      role: formData.role,
      workstation: formData.workstation || undefined,
      allowedModules: formData.role === 'Admin' ? undefined : formData.allowedModules,
    };

    // Mettre à jour le mot de passe seulement s'il est fourni
    if (formData.password) {
      updates.password = formData.password;
    }

    userService.update(selectedUser.id, updates);
    toast.success('Utilisateur modifié avec succès');
    const wasProfileUser = profileUser?.id === selectedUser.id;
    resetForm();
    loadUsers();
    if (wasProfileUser) {
      // Rafraîchir le profileUser avec les données mises à jour
      const updated = userService.getAll().find(u => u.id === selectedUser.id) ?? null;
      setProfileUser(updated);
      setViewMode('profile');
    } else {
      setViewMode('list');
    }
  };

  const confirmDelete = (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!userToDelete) return;

    userService.delete(userToDelete.id);
    toast.success('Utilisateur supprimé avec succès');
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
    setProfileUser(null);
    setViewMode('list');
    loadUsers();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'Employee',
      workstation: '',
      allowedModules: DEFAULT_MODULES['Employee'],
    });
    setSelectedUser(null);
    setShowPassword(false);
  };

  const isAdmin = currentUser?.role === 'Admin';

  // ── Helpers formatage ──────────────────────────────────────
  const fmt    = (n: number) => n.toLocaleString('fr-FR');
  const fmtDate = (d: any)  => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const fmtShort = (d: any) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isMonth = (d: Date) => { const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); };

  const getPaymentIcon = (method?: string) => {
    if (method === 'Mobile Money')   return <Smartphone className="w-4 h-4" />;
    if (method === 'Carte bancaire') return <CreditCard className="w-4 h-4" />;
    return <Banknote className="w-4 h-4" />;
  };

  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'Payée':      return { bg: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  };
      case 'En attente': return { bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' };
      case 'Annulée':    return { bg: 'bg-red-100 text-red-700',       dot: 'bg-red-500'    };
      default:           return { bg: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400'   };
    }
  };

  // ── Données profil ─────────────────────────────────────────
  const profileOrders = useMemo(() => {
    if (!profileUser) return [];
    return orders
      .filter(o =>
        o.auxiliaryName === profileUser.fullName ||
        o.auxiliaryId   === profileUser.id       ||
        o.cashierName   === profileUser.fullName  ||
        o.cashierId     === profileUser.id
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, profileUser]);

  const profileActivity = useMemo(() =>
    profileUser ? activityService.getByUser(profileUser.id) : [],
    [profileUser]
  );

  const profileKpis = useMemo(() => {
    const paid    = profileOrders.filter(o => o.status === 'Payée');
    const created = profileOrders.filter(o => o.auxiliaryName === profileUser?.fullName || o.auxiliaryId === profileUser?.id);
    const cashed  = profileOrders.filter(o => o.cashierName   === profileUser?.fullName || o.cashierId  === profileUser?.id);
    const revenueTotal = paid.reduce((s, o) => s + o.total, 0);
    const revenueMonth = paid.filter(o => isMonth(new Date(o.paidAt || o.createdAt))).reduce((s, o) => s + o.total, 0);
    const avgOrder     = paid.length > 0 ? revenueTotal / paid.length : 0;

    const medCounts: Record<string, { name: string; qty: number; revenue: number }> = {};
    paid.forEach(o => o.items.forEach(item => {
      if (!medCounts[item.medicineId]) medCounts[item.medicineId] = { name: item.medicineName, qty: 0, revenue: 0 };
      medCounts[item.medicineId].qty     += item.quantity;
      medCounts[item.medicineId].revenue += item.total;
    }));
    const topProducts = Object.values(medCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const last7: { label: string; count: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = paid.filter(o => { const t = new Date(o.paidAt || o.createdAt); return t >= d && t < next; });
      last7.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), count: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + o.total, 0) });
    }

    return { totalCreated: created.length, totalCashed: cashed.length, revenueTotal, revenueMonth, avgOrder, topProducts, last7, activityCount: profileActivity.length };
  }, [profileOrders, profileActivity, profileUser]);

  const ACTION_LABELS: Record<string, string> = {
    medicine_add: 'Ajout médicament', medicine_edit: 'Modification médicament',
    medicine_delete: 'Suppression médicament', medicine_price_change: 'Changement de prix',
    stock_adjust: 'Ajustement stock', sale_create: 'Vente enregistrée',
    user_add: 'Ajout utilisateur', user_edit: 'Modification utilisateur',
    user_delete: 'Suppression utilisateur', login: 'Connexion',
  };
  const ACTION_COLOR: Record<string, string> = {
    medicine_add: 'bg-teal-100 text-teal-700', medicine_edit: 'bg-blue-100 text-blue-700',
    medicine_delete: 'bg-red-100 text-red-700', medicine_price_change: 'bg-orange-100 text-orange-700',
    stock_adjust: 'bg-yellow-100 text-yellow-700', sale_create: 'bg-green-100 text-green-700',
    user_add: 'bg-purple-100 text-purple-700', user_edit: 'bg-indigo-100 text-indigo-700',
    user_delete: 'bg-red-100 text-red-700', login: 'bg-gray-100 text-gray-600',
  };

  const ROLE_AVATAR: Record<string, string> = {
    Admin: 'bg-purple-500', Employee: 'bg-blue-500', Auxiliaire: 'bg-indigo-500', Caisse: 'bg-pink-500',
  };
  const ROLE_BADGE: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700', Employee: 'bg-blue-100 text-blue-700',
    Auxiliaire: 'bg-indigo-100 text-indigo-700', Caisse: 'bg-pink-100 text-pink-700',
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700';
      case 'Employee': return 'bg-blue-100 text-blue-700';
      case 'Auxiliaire': return 'bg-indigo-100 text-indigo-700';
      case 'Caisse': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin': return Shield;
      case 'Employee': return Briefcase;
      case 'Auxiliaire': return ClipboardList;
      case 'Caisse': return CreditCard;
      default: return UserIcon;
    }
  };

  // ── Vue Profil ────────────────────────────────────────────
  if (viewMode === 'profile' && profileUser) {
    const initials = profileUser.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const avatarColor = ROLE_AVATAR[profileUser.role] ?? 'bg-gray-400';

    // Détail commande dans le profil
    if (selectedOrder) {
      const s = getStatusStyle(selectedOrder.status);
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedOrder(null)}
                  className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{selectedOrder.orderNumber}</h1>
                  <p className="text-xs text-gray-500">{fmtDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${s.bg}`}>
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />{selectedOrder.status}
              </span>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Créée par</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center"><UserIcon className="w-3.5 h-3.5 text-indigo-600" /></div>
                  <div><p className="font-semibold text-gray-900 text-sm">{selectedOrder.auxiliaryName}</p><p className="text-xs text-gray-400">{selectedOrder.workstation}</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Encaissée par</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-pink-100 rounded-full flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-pink-600" /></div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedOrder.cashierName || '—'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Paiement</p>
                <div className="flex items-center gap-2 text-gray-700">
                  {getPaymentIcon(selectedOrder.paymentMethod)}
                  <p className="font-semibold text-gray-900 text-sm">{selectedOrder.paymentMethod || '—'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-gray-900 text-sm">Articles ({selectedOrder.items.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-5 py-2.5 text-left font-semibold">Médicament</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Qté</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Prix unit.</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 flex items-center gap-2">
                        <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center"><Pill className="w-3.5 h-3.5 text-teal-600" /></div>
                        <span className="text-sm font-medium text-gray-900">{item.medicineName}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-sm text-gray-700">{fmt(item.price)} F</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{fmt(item.total)} F</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-teal-50">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-right font-bold text-gray-900 text-sm">Total</td>
                    <td className="px-5 py-3 text-right text-lg font-bold text-teal-600">{fmt(selectedOrder.total)} FCFA</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button
              onClick={() => { setViewMode('list'); setProfileUser(null); setProfileTab('overview'); }}
              className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className={`w-12 h-12 ${avatarColor} rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{profileUser.fullName}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[profileUser.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {profileUser.role}
                </span>
                {profileUser.id === currentUser?.id && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Vous</span>
                )}
              </div>
              <p className="text-sm text-gray-500">@{profileUser.username} · {profileUser.email || 'Pas d\'email'}</p>
            </div>

            {/* Onglets */}
            <div className="ml-auto flex gap-1 bg-gray-100 p-1 rounded-lg">
              {([
                { id: 'overview',  label: 'Vue d\'ensemble', icon: BarChart2  },
                { id: 'sales',     label: 'Ventes',          icon: ShoppingCart },
                { id: 'activity',  label: 'Activité',        icon: Activity  },
              ] as const).map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setProfileTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${profileTab === t.id ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Icon className="w-4 h-4" />{t.label}
                  </button>
                );
              })}
            </div>

            {/* Actions rapides */}
            {isAdmin && (
              <div className="flex gap-2 border-l border-gray-200 pl-4">
                <Button variant="outline" size="sm" onClick={() => { handleEdit(profileUser); }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Edit className="w-4 h-4 mr-1.5" /> Modifier
                </Button>
                {profileUser.id !== currentUser?.id && (
                  <Button variant="outline" size="sm" onClick={() => confirmDelete(profileUser)}
                    className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-8 space-y-6">

          {/* ── VUE D'ENSEMBLE ────────────────────────────── */}
          {profileTab === 'overview' && (
            <>
              {/* KPI */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Ventes créées',          value: profileKpis.totalCreated,              icon: ShoppingCart, bg: 'from-indigo-50 to-indigo-100', iconBg: 'bg-indigo-500' },
                  { label: 'Encaissements',           value: profileKpis.totalCashed,               icon: CreditCard,   bg: 'from-pink-50 to-pink-100',    iconBg: 'bg-pink-500'   },
                  { label: 'CA total généré',         value: `${fmt(profileKpis.revenueTotal)} F`,  icon: TrendingUp,   bg: 'from-teal-50 to-teal-100',    iconBg: 'bg-teal-500'   },
                  { label: 'Actions enregistrées',    value: profileKpis.activityCount,             icon: Activity,     bg: 'from-blue-50 to-blue-100',    iconBg: 'bg-blue-500'   },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`bg-gradient-to-br ${card.bg} rounded-xl p-5 border border-white shadow-sm`}>
                      <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-600 mt-1">{card.label}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique 7 jours */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" /> Ventes — 7 derniers jours
                  </h2>
                  <p className="text-xs text-gray-400 mb-5">Ventes payées attribuées à ce compte</p>
                  {profileKpis.last7.every(d => d.count === 0) ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Aucune vente sur la période</div>
                  ) : (
                    <div className="flex items-end gap-2 h-32">
                      {profileKpis.last7.map((day, i) => {
                        const maxCount = Math.max(...profileKpis.last7.map(d => d.count), 1);
                        const pct = (day.count / maxCount) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {day.count > 0 && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {day.count} vente{day.count > 1 ? 's' : ''} · {fmt(day.revenue)} F
                              </div>
                            )}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(pct, day.count > 0 ? 8 : 0)}%` }}
                              transition={{ delay: 0.3 + i * 0.04, duration: 0.4 }}
                              className="w-full rounded-t-md bg-teal-200 group-hover:bg-teal-300 transition-colors"
                            />
                            <span className="text-xs text-gray-400 capitalize">{day.label}</span>
                            {day.count > 0 && <span className="text-xs font-bold text-teal-700">{day.count}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* Top produits */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" /> Produits les plus vendus
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">Classement par chiffre d'affaires</p>
                  {profileKpis.topProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Aucune vente</div>
                  ) : (
                    <div className="space-y-3">
                      {profileKpis.topProducts.map((prod, i) => {
                        const maxRev = profileKpis.topProducts[0]?.revenue || 1;
                        const pct = (prod.revenue / maxRev) * 100;
                        const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400', 'text-blue-400', 'text-blue-300'];
                        return (
                          <div key={i}>
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-sm font-bold w-5 text-center shrink-0 ${rankColors[i] ?? 'text-gray-300'}`}>#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                                  <span className="text-xs text-teal-700 font-bold ml-2 shrink-0">{fmt(prod.revenue)} F</span>
                                </div>
                                <p className="text-xs text-gray-400">{prod.qty} unité{prod.qty > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-8">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Infos profil */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-600" /> Informations du compte
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Nom d\'utilisateur', value: `@${profileUser.username}` },
                    { label: 'Email',              value: profileUser.email || '—' },
                    { label: 'Poste',              value: profileUser.workstation || '—' },
                    { label: 'Membre depuis',      value: new Date(profileUser.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  ].map((info, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{info.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {/* ── VENTES ──────────────────────────────────────── */}
          {profileTab === 'sales' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'CA ce mois',    value: `${fmt(profileKpis.revenueMonth)} F`, icon: TrendingUp,  color: 'text-teal-600 bg-teal-50 border-teal-100'  },
                  { label: 'Panier moyen',  value: `${fmt(Math.round(profileKpis.avgOrder))} F`, icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  { label: 'Total ventes',  value: profileOrders.length, icon: Calendar,     color: 'text-blue-600 bg-blue-50 border-blue-100'      },
                ].map((s, i) => {
                  const Icon = s.icon;
                  const [textC, bgC, borderC] = s.color.split(' ');
                  return (
                    <div key={i} className={`${bgC} ${borderC} border rounded-xl p-4 flex items-center gap-4`}>
                      <Icon className={`w-6 h-6 ${textC} shrink-0`} />
                      <div>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-sm text-gray-500">{s.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">N° Commande</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Articles</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Paiement</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profileOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-gray-400">
                          <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucune vente enregistrée</p>
                        </td>
                      </tr>
                    ) : (
                      profileOrders.map((order, i) => {
                        const s = getStatusStyle(order.status);
                        const isCreator = order.auxiliaryName === profileUser.fullName || order.auxiliaryId === profileUser.id;
                        return (
                          <motion.tr key={order.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                            className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {fmtShort(order.createdAt)}
                              <span className="block text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-700">
                              {order.items[0]?.medicineName}
                              {order.items.length > 1 && <span className="text-gray-400"> +{order.items.length - 1}</span>}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCreator ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                                {isCreator ? 'Vendeur' : 'Caissier'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {order.paymentMethod ? (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  {getPaymentIcon(order.paymentMethod)}<span>{order.paymentMethod}</span>
                                </div>
                              ) : <span className="text-gray-300 text-sm">—</span>}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-gray-900">{fmt(order.total)} F</td>
                            <td className="px-6 py-3">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${s.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{order.status}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <button onClick={() => setSelectedOrder(order)}
                                className="text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── ACTIVITÉ ──────────────────────────────────── */}
          {profileTab === 'activity' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{profileKpis.activityCount} action{profileKpis.activityCount > 1 ? 's' : ''} enregistrée{profileKpis.activityCount > 1 ? 's' : ''}</p>
                  <p className="text-sm text-gray-500">Journal complet des actions de {profileUser.fullName}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {profileActivity.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune activité enregistrée pour cet utilisateur</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {profileActivity.map((entry, i) => (
                      <motion.div key={entry.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                        className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`mt-0.5 shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLOR[entry.action] ?? 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                        <div className="flex-1 min-w-0">
                          {entry.targetName && <p className="text-sm font-medium text-gray-900 truncate">{entry.targetName}</p>}
                          {entry.detail && <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.detail}</p>}
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">
                          {new Date(entry.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Vue Liste
  if (viewMode === 'list') {
    return (
      <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
              <p className="text-sm text-gray-600 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setViewMode('add')} 
                className="bg-gradient-to-r from-teal-500 to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            )}
          </div>
        </motion.div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => {
            const RoleIcon = getRoleIcon(user.role);
            const modules = MODULE_CONFIG[user.role] || [];
            
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Avatar cliquable → profil */}
                  <button
                    onClick={() => { setProfileUser(user); setProfileTab('overview'); setViewMode('profile'); }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl hover:opacity-80 transition-opacity ${ROLE_AVATAR[user.role] ?? 'bg-gray-400'}`}
                  >
                    {user.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </button>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setProfileUser(user); setProfileTab('overview'); setViewMode('profile'); }}
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" title="Voir le profil">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button variant="ghost" size="sm" onClick={() => confirmDelete(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setProfileUser(user); setProfileTab('overview'); setViewMode('profile'); }}
                  className="text-left hover:underline decoration-teal-400"
                >
                  <h4 className="font-bold text-lg text-gray-900 mb-1">{user.fullName}</h4>
                </button>
                <p className="text-sm text-gray-600 mb-3">@{user.username}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="w-4 h-4" />
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                  {user.email && (
                    <p className="text-sm text-gray-600">✉️ {user.email}</p>
                  )}
                  {user.workstation && (
                    <p className="text-sm text-gray-600">📍 {user.workstation}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Modules accessibles */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Modules accessibles ({modules.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {modules.slice(0, 4).map((module) => {
                      const ModuleIcon = module.icon;
                      return (
                        <div
                          key={module.id}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md"
                          title={module.label}
                        >
                          <ModuleIcon className="w-3 h-3 text-gray-600" />
                          <span className="text-xs text-gray-600 truncate max-w-[80px]">
                            {module.label}
                          </span>
                        </div>
                      );
                    })}
                    {modules.length > 4 && (
                      <div className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                        +{modules.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {user.id === currentUser?.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
                      ✓ Utilisateur actuel
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirmer la suppression
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer cet utilisateur ?
              </p>
              {userToDelete && (
                <div className="bg-gray-50 rounded-lg p-4 mt-3">
                  <p className="font-semibold text-gray-900">{userToDelete.fullName}</p>
                  <p className="text-sm text-gray-600">@{userToDelete.username}</p>
                  <p className="text-sm text-gray-600">{userToDelete.role}</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-3">
                ⚠️ Cette action est irréversible !
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vue Ajout/Édition

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {viewMode === 'add' ? 'Nouvel Utilisateur' : 'Modifier Utilisateur'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm();
              setViewMode(profileUser ? 'profile' : 'list');
            }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations de base */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Jean Dupont"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur * {viewMode === 'edit' && <span className="text-xs text-gray-500">(non modifiable)</span>}</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="jeandupont"
                  disabled={viewMode === 'edit'}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@pharmacie.bf"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password">
                  Mot de passe {viewMode === 'add' ? '*' : <span className="text-xs text-gray-500">(laisser vide pour ne pas modifier)</span>}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rôle et permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rôle et Permissions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => handleRoleChange(value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Admin - Accès complet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Employee">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span>Employé - Gestion courante</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Auxiliaire">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-indigo-600" />
                        <span>Auxiliaire - Point de vente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Caisse">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-pink-600" />
                        <span>Caisse - Encaissement</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === 'Auxiliaire' && (
                <div className="col-span-2">
                  <Label htmlFor="workstation">Poste de travail</Label>
                  <Input
                    id="workstation"
                    value={formData.workstation || ''}
                    onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                    placeholder="Ex: Poste 1, Poste 2..."
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Modules accessibles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Modules visibles</h3>
            <p className="text-sm text-gray-500 mb-4">
              {formData.role === 'Admin'
                ? 'Les administrateurs ont accès à tous les modules par défaut.'
                : 'Sélectionnez les modules visibles pour cet utilisateur.'}
            </p>

            {formData.role === 'Admin' ? (
              /* Admin — tous les modules verrouillés */
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_MODULES.map((module) => {
                  const ModuleIcon = module.icon;
                  return (
                    <div
                      key={module.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-80"
                    >
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                        <ModuleIcon className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">{module.label}</span>
                      <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Autres rôles — checkboxes */
              <div className="grid grid-cols-2 gap-2">
                {ALL_MODULES.map((module) => {
                  const ModuleIcon = module.icon;
                  const isChecked = formData.allowedModules.includes(module.id);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        isChecked
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-teal-100' : 'bg-gray-100'
                      }`}>
                        <ModuleIcon className={`w-4 h-4 ${isChecked ? 'text-teal-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${isChecked ? 'text-teal-800' : 'text-gray-600'}`}>
                        {module.label}
                      </span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                      }`}>
                        {isChecked && <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {formData.role !== 'Admin' && (
              <p className="text-xs text-gray-400 mt-3">
                {formData.allowedModules.length} module{formData.allowedModules.length > 1 ? 's' : ''} sélectionné{formData.allowedModules.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setViewMode(profileUser ? 'profile' : 'list');
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={viewMode === 'add' ? handleAdd : handleUpdate}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {viewMode === 'add' ? 'Créer l\'utilisateur' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}