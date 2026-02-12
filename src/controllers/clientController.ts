import { useState, useEffect } from 'react';
import type { Client, ClientPurchase } from '@/models/clients';
import { clientService } from '@/services/clientService';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les clients au démarrage
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    try {
      const allClients = clientService.getAll();
      setClients(allClients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getById = (id: string): Client | null => {
    return clientService.getById(id);
  };

  const searchClients = (query: string): Client[] => {
    return clientService.search(query);
  };

  const createClient = (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalSpent'>
  ): Client => {
    const newClient = clientService.create(clientData);
    loadClients(); // Recharger la liste
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>): Client | null => {
    const updatedClient = clientService.update(id, updates);
    if (updatedClient) {
      loadClients(); // Recharger la liste
    }
    return updatedClient;
  };

  const deleteClient = (id: string): boolean => {
    const success = clientService.delete(id);
    if (success) {
      loadClients(); // Recharger la liste
    }
    return success;
  };

  const getInsuredClients = (): Client[] => {
    return clientService.getInsuredClients();
  };

  const getUninsuredClients = (): Client[] => {
    return clientService.getUninsuredClients();
  };

  const getActiveClients = (): Client[] => {
    return clientService.getActiveClients();
  };

  const getClientStats = (clientId: string) => {
    return clientService.getClientStats(clientId);
  };

  const getPurchasesByClientId = (clientId: string): ClientPurchase[] => {
    return clientService.getPurchasesByClientId(clientId);
  };

  const addPurchase = (purchase: Omit<ClientPurchase, 'id'>): ClientPurchase => {
    const newPurchase = clientService.addPurchase(purchase);
    loadClients(); // Recharger pour mettre à jour les stats
    return newPurchase;
  };

  return {
    clients,
    loading,
    getById,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
    getInsuredClients,
    getUninsuredClients,
    getActiveClients,
    getClientStats,
    getPurchasesByClientId,
    addPurchase,
    refresh: loadClients
  };
}