import { useState } from 'react';
import { Pill, Lock, User2, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { User } from '@/models/User';


import type { User as AppUser } from '@/models/User';

interface LoginViewProps {
  onLogin: (user: AppUser) => void;
}


export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!username || !password) {
    setError("Veuillez entrer votre nom d'utilisateur et mot de passe");
    return;
  }

  let user: User | null = null;
  const now = new Date().toISOString();

  if (username === 'admin' && password === 'admin123') {
    user = {
      id: '1',
      username: 'admin',
      password: 'admin123',
      role: 'Admin',
      fullName: 'Administrateur Principal',
      email: 'admin@pharma.local',
      createdAt: now,
    };
  } 
  else if (username === 'caisse' && password === 'caisse123') {
    user = {
      id: '2',
      username: 'caisse',
      password: 'caisse123',
      role: 'Caisse',
      fullName: 'Agent de Caisse',
      email: 'caisse@pharma.local',
      createdAt: now,
    };
  } 
  else if (username === 'aux1' && password === 'aux123') {
    user = {
      id: '3',
      username: 'aux1',
      password: 'aux123',
      role: 'Auxiliaire',
      fullName: 'Auxiliaire de Pharmacie',
      email: 'aux1@pharma.local',
      createdAt: now,
      workstation: 'POSTE-01',
    };
  }

  if (!user) {
    setError("Nom d'utilisateur ou mot de passe invalide");
    return;
  }

  onLogin(user);
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16  rounded-2xl mb-4 shadow-lg">
            <img
                src="src\local\logo.jpg"
                alt="Logo Pharmacie"
                className="w-15 h-15"
              />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion de Pharmacie</h1>
          <p className="text-gray-600">Système de Gestion Local</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Connexion à votre compte</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative mt-2">
                <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            <div>
          <Label htmlFor="password">Mot de passe</Label>

          <div className="relative mt-2">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              placeholder="Entrez votre mot de passe"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>


            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-teal-600">
              Se connecter
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Identifiants de démonstration: <br />
              <span className="font-medium">Admin: admin / admin123</span><br />
              <span className="font-medium">Caisse: caisse / caisse123</span><br />
              <span className="font-medium">Auxiliaire: aux1 / aux123</span>
            </p>
          </div>
        </div>  

        <p className="text-center text-sm text-gray-500 mt-6">
          © 2026 Système de Gestion de Pharmacie. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}