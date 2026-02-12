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
import { Sidebar } from './components/Sidebar';
import { BonLivraisonView } from '@/views/bonLivraisonView';
import { SalesView } from '@/views/SalesView';
import { SettingsView } from '@/views/SettingsView';
import { StockAlertsView } from '@/views/StockAlertsView';
import { UsersView } from '@/views/UsersView';
import { Header } from './components/Header';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home'); // Rediriger vers la page d'accueil après connexion
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
      
      <div className="flex-1 flex flex-col">

        <Header 
        user={currentUser} 
        currentPage={currentPage} 
        
        />

        {/* CONTENU */}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <DashboardView />}
          {currentPage === 'medicines' && <MedicinesView currentUser={currentUser} />}
          {currentPage === 'clients' && <ClientsView currentUser={currentUser} />}
          {currentPage === 'fournisseurs' && <SuppliersView currentUser={currentUser} />}
          {currentPage === 'sales' && <SalesView currentUser={currentUser} />}
          {currentPage === 'auxiliaire' && <AuxiliaireView currentUser={currentUser} />}
          {currentPage === 'caisse' && <CaisseView currentUser={currentUser} />}
          {currentPage === 'alerts' && <StockAlertsView currentUser={currentUser} />}
          {currentPage === 'bonsLivraisons' && <BonLivraisonView currentUser={currentUser} />}
          {currentPage === 'users' && <UsersView currentUser={currentUser} />}
          {currentPage === 'settings' && <SettingsView currentUser={currentUser} />}
        </main>

      </div>
    </div>
    <Toaster position="top-right" />
  </>
);

}

export default App;