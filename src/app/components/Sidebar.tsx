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
  Home,
  ChevronRight,
  ArrowLeft,
  ArrowUpLeftFromCircle,
  BookOpen,
  ListOrdered,
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentUser?: { role: string; fullName: string } | null;
}

export function Sidebar({ activePage, onNavigate, onLogout, currentUser }: SidebarProps) {
  
  // Configuration des menus par module
  const getModuleConfig = () => {
    switch (activePage) {
      case 'auxiliaire':
        return {
          title: 'Point de Vente',
          subtitle: 'Auxiliaire',
          icon: ClipboardList,
          color: 'from-indigo-500 to-indigo-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: ArrowUpLeftFromCircle },
            { id: 'auxiliaire', label: 'Mes commandes', icon: ClipboardList, active: true },
          ]
        };
      
      case 'caisse':
        return {
          title: 'Caisse',
          subtitle: 'Encaissement',
          icon: CreditCard,
          color: 'from-pink-500 to-pink-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'caisse', label: 'Encaissement', icon: CreditCard, active: true },
          ]
        };
      
      case 'dashboard':
        return {
          title: 'Tableau de bord',
          subtitle: 'Vue d\'ensemble',
          icon: LayoutDashboard,
          color: 'from-blue-500 to-blue-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'dashboard', label: 'Statistiques', icon: LayoutDashboard, active: true },
          ]
        };
      
      case 'medicines':
        return {
          title: 'Médicaments',
          subtitle: 'Gestion du stock',
          icon: Pill,
          color: 'from-teal-500 to-teal-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'medicines', label: 'Stock', icon: Pill, active: true },
          ]
        };
      
      case 'clients':
        return {
          title: 'Clients',
          subtitle: 'Gestion clientèle',
          icon: User2Icon,
          color: 'from-purple-500 to-purple-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'clients', label: 'Liste clients', icon: User2Icon, active: true },
          ]
        };
      
      case 'fournisseurs':
        return {
          title: 'Fournisseurs',
          subtitle: 'Gestion partenaires',
          icon: Building2,
          color: 'from-orange-500 to-orange-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'fournisseurs', label: 'Liste fournisseurs', icon: Building2, active: true },
          ]
        };
      
      case 'sales':
        return {
          title: 'Ventes',
          subtitle: 'Historique & Rapports',
          icon: ShoppingCart,
          color: 'from-green-500 to-green-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'sales', label: 'Historique', icon: ShoppingCart, active: true },
          ]
        };
      
      case 'alerts':
        return {
          title: 'Alertes Stock',
          subtitle: 'Suivi & Notifications',
          icon: AlertTriangle,
          color: 'from-red-500 to-red-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'alerts', label: 'Alertes actives', icon: AlertTriangle, active: true },
          ]
        };

      case 'bonsLivraison':
        return {
          title: 'Bons de Livraison',
          subtitle: 'Réception & Contrôle',
          icon: ClipboardList,
          color: 'from-emerald-500 to-emerald-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'bonsLivraison', label: 'Liste BL', icon: ClipboardList, active: true },
          ]
        };

      case 'orderSuggestions':
        return {
          title: 'Suggestions commande',
          subtitle: 'Analyse des ventes',
          icon: ListOrdered,
          color: 'from-violet-500 to-violet-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'orderSuggestions', label: 'Suggestions', icon: ListOrdered, active: true },
          ]
        };

      case 'inventory':
        return {
          title: 'Inventaires',
          subtitle: 'Comptages physiques',
          icon: BookOpen,
          color: 'from-indigo-500 to-indigo-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'inventory', label: 'Inventaires', icon: BookOpen, active: true },
          ]
        };

      case 'users':
        return {
          title: 'Utilisateurs',
          subtitle: 'Gestion équipe',
          icon: Users,
          color: 'from-cyan-500 to-cyan-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'users', label: 'Employés', icon: Users, active: true },
          ]
        };
      
      case 'settings':
        return {
          title: 'Paramètres',
          subtitle: 'Configuration',
          icon: Settings,
          color: 'from-gray-500 to-gray-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: ArrowLeft },
            { id: 'settings', label: 'Configuration', icon: Settings, active: true },
          ]
        };
      
      default:
        return {
          title: 'Pharmacie',
          subtitle: 'Système de Gestion',
          icon: Pill,
          color: 'from-teal-500 to-teal-600',
          menuItems: [
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
            { id: 'medicines', label: 'Médicaments', icon: Pill },
            { id: 'clients', label: 'Clients', icon: User2Icon },
            { id: 'fournisseurs', label: 'Fournisseurs', icon: Building2 },
            { id: 'sales', label: 'Ventes', icon: ShoppingCart },
            { id: 'alerts', label: 'Alertes Stock', icon: AlertTriangle },
            { id: 'bonsLivraison',      label: 'Bons de livraison',       icon: ClipboardList },
            { id: 'orderSuggestions', label: 'Suggestions commande',    icon: ListOrdered },
            { id: 'inventory',        label: 'Inventaires',              icon: BookOpen },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'settings', label: 'Paramètres', icon: Settings },
          ]
        };
    }
  };

  const config = getModuleConfig();
  const HeaderIcon = config.icon;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header dynamique */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center shadow-md`}>
            <HeaderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">{config.title}</h1>
            <p className="text-xs text-gray-500">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* User Info (optionnel) */}
      {currentUser && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-500">Connecté en tant que</p>
          <p className="text-sm font-medium text-gray-900 truncate">{currentUser.fullName}</p>
          <p className="text-xs text-teal-600">{currentUser.role}</p>
        </div>
      )}

      {/* Menu Items contextuel */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {config.menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active || activePage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-700 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}