import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  CreditCard,
  Building2,
  User2Icon,
  Package,
  BookOpen,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@/models/User';
import logoSrc from '@/app/assets/Logo.png';

interface HomeViewProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface AppModule {
  id: string;
  label: string;
  icon: any;
  color: string;
  roles?: string[];
}

export function HomeView({ currentUser, onNavigate, onLogout }: HomeViewProps) {
  const allModules: AppModule[] = [
    { id: 'dashboard',     label: 'Tableau de bord',   icon: LayoutDashboard, color: 'bg-blue-500',    roles: ['Admin', 'Employee'] },
    { id: 'medicines',     label: 'Médicaments',        icon: Pill,            color: 'bg-teal-500',    roles: ['Admin', 'Employee'] },
    { id: 'clients',       label: 'Clients',            icon: User2Icon,       color: 'bg-purple-500',  roles: ['Admin', 'Employee'] },
    { id: 'fournisseurs',  label: 'Fournisseurs',       icon: Building2,       color: 'bg-orange-500',  roles: ['Admin', 'Employee'] },
    { id: 'sales',         label: 'Ventes',             icon: ShoppingCart,    color: 'bg-green-500',   roles: ['Admin', 'Employee'] },
    { id: 'auxiliaire',    label: 'Point de Vente',     icon: ClipboardList,   color: 'bg-indigo-500',  roles: ['Admin', 'Auxiliaire'] },
    { id: 'caisse',        label: 'Caisse',             icon: CreditCard,      color: 'bg-pink-500',    roles: ['Admin', 'Caisse'] },
    { id: 'alerts',        label: 'Alertes Stock',      icon: AlertTriangle,   color: 'bg-red-500',     roles: ['Admin', 'Employee'] },
    { id: 'bonsLivraison',    label: 'Bons de Livraison',      icon: ClipboardList, color: 'bg-emerald-500', roles: ['Admin'] },
    { id: 'inventory',     label: 'Inventaires',         icon: BookOpen,        color: 'bg-indigo-500',  roles: ['Admin'] },
    { id: 'users',         label: 'Utilisateurs',        icon: Users,           color: 'bg-cyan-500',    roles: ['Admin'] },
    { id: 'settings',      label: 'Paramètres',         icon: Settings,        color: 'bg-gray-500',    roles: ['Admin'] },
  ];

  const modules = allModules.filter(m => {
    if (!m.roles?.includes(currentUser?.role ?? '')) return false;
    if (currentUser?.role === 'Admin') return true;
    if (currentUser?.allowedModules) return currentUser.allowedModules.includes(m.id);
    return true;
  });

  const roleColor: Record<string, string> = {
    Admin:      'bg-purple-100 text-purple-700',
    Employee:   'bg-blue-100 text-blue-700',
    Auxiliaire: 'bg-indigo-100 text-indigo-700',
    Caisse:     'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-1">
          <img src={logoSrc} alt="Pharmaa Gest" className="h-9 w-auto object-contain" />
        </div>

        {/* Date */}
        <div className="hidden md:flex flex-col items-center text-xs text-gray-400 flex-1">
          <span className="font-medium text-gray-600 capitalize">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Avatar + infos */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
              currentUser?.role === 'Admin'      ? 'bg-purple-500' :
              currentUser?.role === 'Employee'   ? 'bg-blue-500'   :
              currentUser?.role === 'Auxiliaire' ? 'bg-indigo-500' :
              currentUser?.role === 'Caisse'     ? 'bg-pink-500'   : 'bg-gray-400'
            }`}>
              {currentUser?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800 leading-none">{currentUser?.fullName}</p>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${roleColor[currentUser?.role ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                {currentUser?.role}
              </span>
            </div>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-gray-200" />

          {/* Bouton déconnexion */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full">

        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-gray-700 mb-8"
        >
          Bonjour, {currentUser?.fullName?.split(' ')[0]} — que souhaitez-vous faire ?
        </motion.h2>

        {modules.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun module disponible pour ce rôle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <motion.button
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(module.id)}
                  className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 aspect-square group"
                >
                  <div className={`w-14 h-14 ${module.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {module.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        © 2025 Pharmaa Gest
      </footer>
    </div>
  );
}
