import type { Client, ClientPurchase } from '@/models/clients';

class ClientService {
  private storageKey = 'epharmacy_clients';
  private purchasesKey = 'epharmacy_client_purchases';

  // Clients
  getAll(): Client[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this.getInitialClients();
  }

  getById(id: string): Client | null {
    const clients = this.getAll();
    return clients.find(c => c.id === id) || null;
  }

  search(query: string): Client[] {
    const clients = this.getAll();
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query) ||
      c.email?.toLowerCase().includes(lowerQuery) ||
      c.insurance?.policyNumber?.toLowerCase().includes(lowerQuery)
    );
  }

  create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalSpent'>): Client {
    const clients = this.getAll();
    const newClient: Client = {
      ...client,
      id: `CLT${Date.now()}`,
      totalPurchases: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    clients.push(newClient);
    localStorage.setItem(this.storageKey, JSON.stringify(clients));
    return newClient;
  }

  update(id: string, updates: Partial<Client>): Client | null {
    const clients = this.getAll();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    clients[index] = {
      ...clients[index],
      ...updates,
      updatedAt: new Date()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(clients));
    return clients[index];
  }

  delete(id: string): boolean {
    const clients = this.getAll();
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }

  // Achats
  getAllPurchases(): ClientPurchase[] {
    const data = localStorage.getItem(this.purchasesKey);
    return data ? JSON.parse(data) : [];
  }

  getPurchasesByClientId(clientId: string): ClientPurchase[] {
    const purchases = this.getAllPurchases();
    return purchases.filter(p => p.clientId === clientId);
  }

  addPurchase(purchase: Omit<ClientPurchase, 'id'>): ClientPurchase {
    const purchases = this.getAllPurchases();
    const newPurchase: ClientPurchase = {
      ...purchase,
      id: `PUR${Date.now()}`
    };
    purchases.push(newPurchase);
    localStorage.setItem(this.purchasesKey, JSON.stringify(purchases));

    // Mettre à jour les statistiques du client
    const client = this.getById(purchase.clientId);
    if (client) {
      this.update(client.id, {
        totalPurchases: client.totalPurchases + 1,
        totalSpent: client.totalSpent + purchase.amountPaid,
        lastVisit: purchase.purchaseDate
      });
    }

    return newPurchase;
  }

  // Statistiques
  getClientStats(clientId: string) {
    const client = this.getById(clientId);
    const purchases = this.getPurchasesByClientId(clientId);

    if (!client) return null;

    const totalSaved = purchases.reduce((sum, p) => sum + p.insuranceCoverage, 0);
    const averageSpending = client.totalPurchases > 0 ? client.totalSpent / client.totalPurchases : 0;

    return {
      totalPurchases: client.totalPurchases,
      totalSpent: client.totalSpent,
      totalSaved,
      averageSpending,
      lastVisit: client.lastVisit
    };
  }

  // Filtres
  getInsuredClients(): Client[] {
    return this.getAll().filter(c => c.isInsured);
  }

  getUninsuredClients(): Client[] {
    return this.getAll().filter(c => !c.isInsured);
  }

  getActiveClients(): Client[] {
    return this.getAll().filter(c => c.status === 'Actif');
  }

  private getInitialClients(): Client[] {
    const initial: Client[] = [
      {
        id: 'CLT001',
        firstName: 'Aminata',
        lastName: 'Ouédraogo',
        fullName: 'Aminata Ouédraogo',
        email: 'aminata.ouedraogo@email.bf',
        phone: '+226 70 12 34 56',
        address: 'Secteur 15, Ouaga 2000',
        city: 'Ouagadougou',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'Femme',
        isInsured: true,
        insurance: {
          company: 'SONAR Assurances',
          policyNumber: 'POL123456',
          coveragePercentage: 80,
          expiryDate: new Date('2025-12-31'),
          cardNumber: 'CARD789012'
        },
        allergies: ['Pénicilline'],
        chronicDiseases: [],
        notes: 'Cliente régulière, préfère les génériques',
        totalPurchases: 12,
        totalSpent: 45000,
        lastVisit: new Date('2024-12-15'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-12-15'),
        status: 'Actif'
      },
      {
        id: 'CLT002',
        firstName: 'Moussa',
        lastName: 'Kaboré',
        fullName: 'Moussa Kaboré',
        phone: '+226 76 98 76 54',
        address: 'Zone 1, Bobo-Dioulasso',
        city: 'Bobo-Dioulasso',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'Homme',
        isInsured: false,
        allergies: [],
        chronicDiseases: ['Diabète Type 2'],
        notes: 'Suivi régulier pour diabète',
        totalPurchases: 8,
        totalSpent: 32000,
        lastVisit: new Date('2024-12-10'),
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-12-10'),
        status: 'Actif'
      },
      {
        id: 'CLT003',
        firstName: 'Fatimata',
        lastName: 'Sawadogo',
        fullName: 'Fatimata Sawadogo',
        email: 'f.sawadogo@email.bf',
        phone: '+226 71 23 45 67',
        address: 'Secteur 30, Ouagadougou',
        city: 'Ouagadougou',
        dateOfBirth: new Date('1978-11-05'),
        gender: 'Femme',
        isInsured: true,
        insurance: {
          company: 'ALLIANZ Burkina',
          policyNumber: 'POL654321',
          coveragePercentage: 70,
          expiryDate: new Date('2025-06-30'),
          cardNumber: 'CARD345678'
        },
        allergies: ['Aspirine', 'Iode'],
        chronicDiseases: ['Hypertension'],
        totalPurchases: 15,
        totalSpent: 52000,
        lastVisit: new Date('2024-12-18'),
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-12-18'),
        status: 'Actif'
      }
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }
}

export const clientService = new ClientService();