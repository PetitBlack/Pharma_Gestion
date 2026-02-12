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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img
                src="src\local\logo.jpg"
                alt="Logo Pharmacie"
                className="w-15 h-15"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-Pharmacie</h1>
                <p className="text-sm text-gray-500">Système de Gestion Intégré</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.fullName || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500">{currentUser?.role || 'Admin'}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
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
          className="mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bienvenue, {currentUser?.fullName?.split(' ')[0] || 'Admin'} 
          </h2>
        </motion.div>

        {/* Modules Grid */}
        <div>
          {modules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg mb-2">Aucun module disponible</p>
              <p className="text-gray-500 text-sm">Contactez l'administrateur pour obtenir des accès</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.button
                    key={module.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavigate(module.id)}
                    className="group relative bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-lg hover:border-transparent transition-all duration-300 text-left overflow-hidden"
                  >
                    {/* Background Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center mb-3 shadow group-hover:shadow-md transition-all group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Text */}
                      <h3 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {module.label}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2 min-h-[2rem]">
                        {module.description}
                      </p>

                      {/* Stats Badge */}
                      {module.stats && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 group-hover:bg-teal-50 rounded-md text-xs font-medium text-gray-600 group-hover:text-teal-700 transition-colors">
                          <span className="truncate">{module.stats}</span>
                        </div>
                      )}

                      {/* Arrow Icon - Bottom Right */}
                      <div className="absolute bottom-3 right-3 w-6 h-6 bg-gray-100 group-hover:bg-teal-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2">
                        <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-white" />
                      </div>
                    </div>

                    {/* Top Right Indicator */}
                    <div className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>E-Pharmacie Management System v1.0</p>
          <p className="mt-1">© 2024 - Tous droits réservés</p>
        </motion.div>
      </div>
    </div>
  );
}