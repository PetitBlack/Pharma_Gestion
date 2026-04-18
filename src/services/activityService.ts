export type ActivityAction =
  | 'medicine_add'
  | 'medicine_edit'
  | 'medicine_delete'
  | 'medicine_price_change'
  | 'stock_adjust'
  | 'sale_create'
  | 'user_add'
  | 'user_edit'
  | 'user_delete'
  | 'login';

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  // Cible de l'action
  targetId?: string;
  targetName?: string;
  // Détail lisible
  detail?: string;
  // Champs avant/après pour les modifications
  before?: Record<string, any>;
  after?: Record<string, any>;
}

const ACTION_LABELS: Record<ActivityAction, string> = {
  medicine_add:         'Ajout médicament',
  medicine_edit:        'Modification médicament',
  medicine_delete:      'Suppression médicament',
  medicine_price_change:'Changement de prix',
  stock_adjust:         'Ajustement stock',
  sale_create:          'Vente enregistrée',
  user_add:             'Ajout utilisateur',
  user_edit:            'Modification utilisateur',
  user_delete:          'Suppression utilisateur',
  login:                'Connexion',
};

class ActivityService {
  private entries: ActivityEntry[] = [];

  log(params: Omit<ActivityEntry, 'id' | 'timestamp'>): ActivityEntry {
    const entry: ActivityEntry = {
      ...params,
      id: `ACT${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.entries.unshift(entry); // plus récent en tête
    return entry;
  }

  getAll(): ActivityEntry[] {
    return [...this.entries];
  }

  getByTarget(targetId: string): ActivityEntry[] {
    return this.entries.filter(e => e.targetId === targetId);
  }

  getByUser(userId: string): ActivityEntry[] {
    return this.entries.filter(e => e.userId === userId);
  }

  getRecent(limit = 50): ActivityEntry[] {
    return this.entries.slice(0, limit);
  }

  getActionLabel(action: ActivityAction): string {
    return ACTION_LABELS[action] ?? action;
  }
}

export const activityService = new ActivityService();
