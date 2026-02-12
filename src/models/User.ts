export interface User {
  id: string;
  username: string;
  password: string;
  role: 'Admin' | 'Employee' | 'Auxiliaire' | 'Caisse';
  fullName: string;
  email: string;
  createdAt: string;
  workstation?: string; // Identifiant du poste pour les auxiliaires
}

export type UserRole = 'Admin' | 'Employee' | 'Auxiliaire' | 'Caisse';