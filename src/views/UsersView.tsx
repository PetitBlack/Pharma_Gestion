import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, User as UserIcon, Shield, Briefcase,
  X, Eye, EyeOff, AlertTriangle, LayoutDashboard, Pill,
  ShoppingCart, Users, Settings, Building2, ClipboardList,
  CreditCard, CheckCircle, Package, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { userService } from '@/services/userService';
import type { User, UserRole } from '@/models/User';
import { toast } from 'sonner';

interface UsersViewProps {
  currentUser: User | null;
}

type ViewMode = 'list' | 'add' | 'edit';

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
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
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
    resetForm();
    setViewMode('list');
    loadUsers();
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
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-7 h-7 text-white" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-lg text-gray-900 mb-1">{user.fullName}</h4>
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
              setViewMode('list');
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
              setViewMode('list');
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