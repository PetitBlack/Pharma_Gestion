import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from 'sonner';

import type { User } from '@/models/User';
import { AuxiliaireView } from '@/views/AuxiliaireView';
import { CaisseView } from '@/views/CaisseView';
import { ClientsView } from '@/views/client';
import { DashboardView } from '@/views/DashboardView';
import { SuppliersView } from '@/views/fournisseurs';
import { HomeView } from '@/views/HomeView';
import { LoginView } from '@/views/LoginView';
import { MedicinesView } from '@/views/MedicinesView';
import { SalesView } from '@/views/SalesView';
import { UsersView } from '@/views/UsersView';
import { Sidebar } from './components/Sidebar';
import { BonLivraisonView } from '@/views/bonLivraisonView';
import { InventoryView } from '@/views/InventoryView';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Si pas connecté, afficher la page de login
  if (!currentUser) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <LoginView onLogin={handleLogin} />
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-right" />
      </>
    );
  }

  // Si sur la page d'accueil, afficher HomeView sans sidebar
  if (currentPage === 'home') {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <HomeView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-right" />
      </>
    );
  }

  // Pour les autres pages, afficher avec Sidebar
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          activePage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {currentPage === 'dashboard' && <DashboardView />}
          {currentPage === 'medicines' && <MedicinesView currentUser={currentUser} />}
          {currentPage === 'clients' && <ClientsView currentUser={currentUser} />}
          {currentPage === 'fournisseurs' && <SuppliersView currentUser={currentUser} />}
          {currentPage === 'bonsLivraison' && <BonLivraisonView currentUser={currentUser} />}
          {currentPage === 'sales' && <SalesView currentUser={currentUser} />}
          {currentPage === 'auxiliaire' && <AuxiliaireView currentUser={currentUser} />}
          {currentPage === 'caisse' && <CaisseView currentUser={currentUser} />}
          {currentPage === 'alerts' && <div className="p-8">Page Alertes (à implémenter)</div>}
          {currentPage === 'inventory' && <InventoryView currentUser={currentUser} />}
          {currentPage === 'users' && <UsersView currentUser={currentUser} />}
          {currentPage === 'settings' && <div className="p-8">Page Paramètres (à implémenter)</div>}
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

export default App;