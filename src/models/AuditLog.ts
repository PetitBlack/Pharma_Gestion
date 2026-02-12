export interface AuditLog {
  id: string;
  action: 'Création commande' | 'Envoi à caisse' | 'Encaissement' | 'Annulation';
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details?: string;
}

export type AuditAction = 'Création commande' | 'Envoi à caisse' | 'Encaissement' | 'Annulation';
