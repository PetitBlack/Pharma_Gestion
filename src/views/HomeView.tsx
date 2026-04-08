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
  ArrowRight,
  TrendingUp,
  Package,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@/models/User';

interface HomeViewProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface AppModule {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
  stats?: string;
  roles?: string[]; // Rôles autorisés pour ce module
}

export function HomeView({ currentUser, onNavigate, onLogout }: HomeViewProps) {
  // Définition de tous les modules disponibles
  const allModules: AppModule[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      description: 'Vue d\'ensemble et statistiques',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-blue-600',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
      stats: 'Analyses en temps réel',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'medicines',
      label: 'Médicaments',
      description: 'Gestion du stock et inventaire',
      icon: Pill,
      color: 'from-teal-500 to-teal-600',
      bgGradient: 'bg-gradient-to-br from-teal-50 to-teal-100',
      stats: 'Stock & Catalogue',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'clients',
      label: 'Clients',
      description: 'Gestion de la clientèle',
      icon: User2Icon,
      color: 'from-purple-500 to-purple-600',
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
      stats: 'Base clients',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'fournisseurs',
      label: 'Fournisseurs',
      description: 'Gestion des fournisseurs',
      icon: Building2,
      color: 'from-orange-500 to-orange-600',
      bgGradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
      stats: 'Partenaires',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'sales',
      label: 'Ventes',
      description: 'Historique et rapports de ventes',
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgGradient: 'bg-gradient-to-br from-green-50 to-green-100',
      stats: 'Commandes & CA',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'auxiliaire',
      label: 'Point de Vente',
      description: 'Interface de vente auxiliaire',
      icon: ClipboardList,
      color: 'from-indigo-500 to-indigo-600',
      bgGradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      stats: 'Nouvelle commande',
      roles: ['Admin', 'Auxiliaire']
    },
    {
      id: 'caisse',
      label: 'Caisse',
      description: 'Encaissement et paiements',
      icon: CreditCard,
      color: 'from-pink-500 to-pink-600',
      bgGradient: 'bg-gradient-to-br from-pink-50 to-pink-100',
      stats: 'Transactions',
      roles: ['Admin', 'Caisse']
    },
    {
      id: 'alerts',
      label: 'Alertes Stock',
      description: 'Alertes et notifications',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgGradient: 'bg-gradient-to-br from-red-50 to-red-100',
      stats: 'Suivi stock',
      roles: ['Admin', 'Employee']
    },
    {
      id: 'bonsLivraison',
      label: 'Bons de Livraison',
      description: 'Réception et vérification',
      icon: ClipboardList,
      color: 'from-emerald-500 to-emerald-600',
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      stats: 'BL & Contrôle',
      roles: ['Admin']
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      description: 'Gestion des employés',
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      bgGradient: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      stats: 'Équipe & Accès',
      roles: ['Admin']
    },
    {
      id: 'settings',
      label: 'Paramètres',
      description: 'Configuration de l\'application',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      bgGradient: 'bg-gradient-to-br from-gray-50 to-gray-100',
      stats: 'Configuration',
      roles: ['Admin']
    },
  ];

  // Filtrer les modules selon le rôle de l'utilisateur
  const modules = allModules.filter(module => 
    module.roles?.includes(currentUser?.role || '')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
<div className="bg-white border-b border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-400 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src="/logo.jpg"
                  alt="Logo Pharmacie"
                  className="relative w-14 h-14 rounded-xl object-cover shadow-lg border-2 border-white group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML += '<div class="relative w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-white"><svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>';
                  }}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  E-Pharmacie
                </h1>
                <p className="text-sm text-gray-500 font-medium">Système de Gestion Intégré</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{currentUser?.fullName || 'Utilisateur'}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${
                    currentUser?.role === 'Admin' ? 'bg-purple-500' :
                    currentUser?.role === 'Employee' ? 'bg-blue-500' :
                    currentUser?.role === 'Auxiliaire' ? 'bg-indigo-500' :
                    currentUser?.role === 'Caisse' ? 'bg-pink-500' : 'bg-gray-500'
                  }`}></span>
                  <p className="text-xs font-semibold text-gray-600">{currentUser?.role || 'Admin'}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 hover:text-red-700 border border-red-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline font-semibold">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-teal-700 to-teal-600 bg-clip-text text-transparent">
                  Bienvenue, {currentUser?.fullName?.split(' ')[0] || 'Admin'}
                </h2>
              </div>
            </div>
            
            {/* Date et heure */}
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 px-5 py-3 rounded-xl border border-teal-200">
              <p className="text-sm font-semibold text-teal-700">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-xs text-teal-600 mt-0.5">
                {new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">Accès rapide</h3>
          <p className="text-sm text-gray-600">Sélectionnez un module pour commencer</p>
        </motion.div>

        {/* Modules Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {modules.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 text-lg font-semibold mb-2">Aucun module disponible</p>
              <p className="text-gray-500 text-sm">Contactez l'administrateur pour obtenir des accès</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.button
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.03 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate(module.id)}
                    className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-teal-300 p-5 shadow-sm hover:shadow-2xl transition-all duration-300 text-left overflow-hidden"
                  >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300`}></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110 group-hover:rotate-3`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Text */}
                      <h3 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {module.label}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem] leading-relaxed">
                        {module.description}
                      </p>

                      {/* Stats Badge */}
                      {module.stats && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 group-hover:bg-teal-100 rounded-lg text-xs font-semibold text-gray-700 group-hover:text-teal-700 transition-all">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${module.color}`}></div>
                          <span className="truncate">{module.stats}</span>
                        </div>
                      )}

                      {/* Arrow Icon - Bottom Right */}
                      <div className="absolute bottom-4 right-4 w-8 h-8 bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-teal-500 group-hover:to-teal-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shadow-md">
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Top Right Indicator */}
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100"></div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full border border-gray-200">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-gray-700">
              E-Pharmacie Management System v1.0
            </p>
          </div>
          <p className="mt-3 text-sm text-gray-500">© 2024 - Tous droits réservés</p>
        </motion.div>
      </div>
    </div>
  );
}