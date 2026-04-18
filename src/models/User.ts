export interface User {
  id: string;
  username: string;
  password: string;
  role: 'Admin' | 'Employee' | 'Auxiliaire' | 'Caisse';
  fullName: string;
  email: string;
  createdAt: string;
  workstation?: string;
  allowedModules?: string[]; // Modules visibles (undefined = tous les modules du rôle)
}

export type UserRole = 'Admin' | 'Employee' | 'Auxiliaire' | 'Caisse';