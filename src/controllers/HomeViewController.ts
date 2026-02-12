import { User } from "@/models/User";
import { LayoutDashboard, Pill, User2Icon, Building2, ShoppingCart, ClipboardList, CreditCard, AlertTriangle, Users, Settings } from "lucide-react";

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
  );}