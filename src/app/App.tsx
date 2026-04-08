import { useState } from 'react';
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
        <LoginView onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Si sur la page d'accueil, afficher HomeView sans sidebar
  if (currentPage === 'home') {
    return (
      <>
        <HomeView 
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
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
          {currentPage === 'users' && <UsersView currentUser={currentUser} />}
          {currentPage === 'settings' && <div className="p-8">Page Paramètres (à implémenter)</div>}
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

export default App;