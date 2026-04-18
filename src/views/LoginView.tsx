import { useState } from 'react';
import { Lock, EyeIcon, EyeOffIcon, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { User } from '@/models/User';
import logoSrc from '@/app/assets/Logo.png';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError("Veuillez entrer votre nom d'utilisateur et mot de passe");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    let user: User | null = null;
    const now = new Date().toISOString();

    if (username === 'admin' && password === 'admin123') {
      user = { id: '1', username: 'admin', password: 'admin123', role: 'Admin', fullName: 'Administrateur Principal', email: 'admin@pharma.local', createdAt: now };
    } else if (username === 'caisse' && password === 'caisse123') {
      user = { id: '2', username: 'caisse', password: 'caisse123', role: 'Caisse', fullName: 'Agent de Caisse', email: 'caisse@pharma.local', createdAt: now };
    } else if (username === 'aux1' && password === 'aux123') {
      user = { id: '3', username: 'aux1', password: 'aux123', role: 'Auxiliaire', fullName: 'Auxiliaire de Pharmacie', email: 'aux1@pharma.local', createdAt: now, workstation: 'POSTE-01' };
    } else if (username === 'employee' && password === 'emp123') {
      user = { id: '4', username: 'employee', password: 'emp123', role: 'Employee', fullName: 'Employé Pharmacie', email: 'employee@pharma.local', createdAt: now };
    }

    setIsLoading(false);

    if (!user) {
      setError("Nom d'utilisateur ou mot de passe invalide");
      return;
    }

    // Animation de succès avant transition
    setIsSuccess(true);
    await new Promise(resolve => setTimeout(resolve, 900));
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">

      {/* Carte principale */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isSuccess ? { scale: 0.96, opacity: 0, y: -16 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden flex relative"
      >
        {/* Overlay succès */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center gap-4 rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-semibold text-gray-700"
              >
                Connexion réussie
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panneau gauche — formulaire */}
        <div className="flex-1 p-10 flex flex-col justify-center">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenue</h1>
            <p className="text-sm text-gray-500">Connectez-vous à votre espace Pharmaa Gest</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 bg-white border border-gray-200"
                placeholder="Nom d'utilisateur"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10 bg-white border border-gray-200"
                  placeholder="Mot de passe"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Bouton */}
            <Button
              type="submit"
              className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>

          </form>
        </div>

        {/* Panneau droit — branding */}
        <div className="hidden md:flex w-72 bg-gray-100 flex-col items-center justify-center p-8 gap-6">
          <img
            src={logoSrc}
            alt="Pharmaa Gest"
            className="w-full max-w-[200px] object-contain"
          />
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Système de gestion intégré pour pharmacies
          </p>
        </div>

      </motion.div>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400">© 2025 Pharmaa Gest</p>

    </div>
  );
}
