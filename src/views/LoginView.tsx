import { useState } from 'react';
import { Pill, Lock, User2, EyeIcon, EyeOffIcon, Shield, Briefcase, ClipboardList, CreditCard } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { User } from '@/models/User';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError("Veuillez entrer votre nom d'utilisateur et mot de passe");
      return;
    }

    setIsLoading(true);

    // Simulation d'une requête (pour l'effet visuel)
    await new Promise(resolve => setTimeout(resolve, 800));

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
    else if (username === 'employee' && password === 'emp123') {
      user = {
        id: '4',
        username: 'employee',
        password: 'emp123',
        role: 'Employee',
        fullName: 'Employé Pharmacie',
        email: 'employee@pharma.local',
        createdAt: now,
      };
    }

    setIsLoading(false);

    if (!user) {
      setError("Nom d'utilisateur ou mot de passe invalide");
      return;
    }

    onLogin(user);
  };

  const demoAccounts = [
    { 
      role: 'Admin', 
      username: 'admin', 
      password: 'admin123',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      description: 'Accès complet'
    },
    { 
      role: 'Employee', 
      username: 'employee', 
      password: 'emp123',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      description: 'Gestion courante'
    },
    { 
      role: 'Auxiliaire', 
      username: 'aux1', 
      password: 'aux123',
      icon: ClipboardList,
      color: 'from-indigo-500 to-indigo-600',
      description: 'Point de vente'
    },
    { 
      role: 'Caisse', 
      username: 'caisse', 
      password: 'caisse123',
      icon: CreditCard,
      color: 'from-pink-500 to-pink-600',
      description: 'Encaissement'
    },
  ];

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-blue-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, delay: 5 }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-7xl grid lg:grid-cols-5 gap-8 relative z-10">
        
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:col-span-2 flex-col justify-center items-center px-12"
        >
          <div className="text-center">
            {/* Logo - Remplace par ton image */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-3xl shadow-2xl mb-6 overflow-hidden border-4 border-white/50">
                {/* Remplace cette ligne par ton logo */}
                <img
                  src="/logo.jpg"
                  alt="Logo Pharmacie"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center"><svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>';
                  }}
                />
              </div>
            </div>

            {/* Texte principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                E-Pharmacie
              </h1>
              <p className="text-2xl text-gray-700 font-medium mb-3">
                Système de Gestion Intégré
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                Plateforme sécurisée
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3 flex items-center"
        >
          <div className="w-full max-w-2xl mx-auto">
            
            {/* Logo mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-2xl overflow-hidden border-4 border-white/50">
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center"><svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg></div>';
                  }}
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">E-Pharmacie</h1>
              <p className="text-gray-600">Système de Gestion</p>
            </div>

            {/* Login Card - Plus grande et améliorée */}
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-white/60 p-10">
              
              {/* Header de la card */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue !</h2>
                <p className="text-gray-600">Connectez-vous pour accéder à votre espace</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-base font-semibold text-gray-700 mb-3 block">
                    Nom d'utilisateur
                  </Label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <User2 className="w-5 h-5 text-teal-600" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-20 pr-5 h-14 text-base border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-xl transition-all"
                      placeholder="Entrez votre nom d'utilisateur"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-base font-semibold text-gray-700 mb-3 block">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-teal-600" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-20 pr-16 h-14 text-base border-2 border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 rounded-xl transition-all"
                      placeholder="Entrez votre mot de passe"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold">!</span>
                      </div>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600 hover:from-teal-600 hover:via-teal-700 hover:to-blue-700 text-white text-base font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      Connexion en cours...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Se connecter</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo accounts */}
              {/* <div className="mt-10 pt-8 border-t-2 border-gray-100">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 rounded-full">
                    <span className="text-lg">🔑</span>
                    <span className="text-sm font-bold text-gray-700">Comptes de démonstration</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {demoAccounts.map((account, i) => {
                    const Icon = account.icon;
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        onClick={() => fillCredentials(account.username, account.password)}
                        className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 hover:from-teal-50 hover:to-blue-50 border-2 border-gray-200 hover:border-teal-300 rounded-2xl p-4 transition-all hover:shadow-xl transform hover:scale-105 active:scale-95"
                        disabled={isLoading}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-12 h-12 bg-gradient-to-br ${account.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-base font-bold text-gray-900 mb-1">{account.role}</span>
                          <p className="text-xs text-gray-500 mb-2">{account.description}</p>
                          <div className="px-3 py-1 bg-gray-100 group-hover:bg-teal-100 rounded-lg">
                            <span className="text-xs font-mono text-gray-600 group-hover:text-teal-700 transition-colors">
                              {account.username}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div> */}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-center mt-8"
            >
              <p className="text-sm text-gray-500">
                © 2024 E-Pharmacie • Système sécurisé
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}