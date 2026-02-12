import { Calendar, User } from 'lucide-react';
import type { User as UserType } from '@/models/User';

interface HeaderProps {
  user: UserType | null;
  currentPage: string;
}

export function Header({ user, currentPage }: HeaderProps) {
  const getPageTitle = (page: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Tableau de bord',
      medicines: 'Gestion des Médicaments',
      sales: 'Ventes',
      alerts: 'Alertes de Stock',
      users: 'Gestion des Utilisateurs',
      bonsLivraison: 'Bon de Livraison',
      fournisseurs: 'Fournisseurs',
      clients: 'Clients',
      settings: 'Paramètres',
      auxiliaire: 'Poste Auxiliaire',
      caisse: 'Caisse - Encaissement',
    };
    return titles[page] || 'Tableau de bord';
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700';
      case 'Employee': return 'bg-blue-100 text-blue-700';
      case 'Auxiliaire': return 'bg-green-100 text-green-700';
      case 'Caisse': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{getPageTitle(currentPage)}</h2>
          {user?.workstation && (
            <p className="text-sm text-gray-600 mt-1">{user.workstation}</p>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{today}</span>
          </div>
          
          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Utilisateur'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user?.role)}`}>
                {user?.role || 'Employee'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}