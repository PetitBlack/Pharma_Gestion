import { BLComparison, BonLivraison } from "@/models/bonLivraison";


class BonLivraisonService {
  private storageKey = 'epharmacy_bons_livraison';

  getAll(): BonLivraison[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : this.getInitialData();
  }

  getById(id: string): BonLivraison | null {
    const bls = this.getAll();
    return bls.find(bl => bl.id === id) || null;
  }

  getBySupplier(supplierId: string): BonLivraison[] {
    return this.getAll().filter(bl => bl.supplierId === supplierId);
  }

  getByStatus(status: BonLivraison['status']): BonLivraison[] {
    return this.getAll().filter(bl => bl.status === status);
  }

  getWithDiscrepancies(): BonLivraison[] {
    return this.getAll().filter(bl => bl.hasDiscrepancies);
  }

  search(query: string): BonLivraison[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(bl =>
      bl.blNumber.toLowerCase().includes(lowerQuery) ||
      bl.supplierName.toLowerCase().includes(lowerQuery) ||
      bl.supplierOrderNumber?.toLowerCase().includes(lowerQuery)
    );
  }

  create(bl: Omit<BonLivraison, 'id' | 'createdAt' | 'hasDiscrepancies'>): BonLivraison {
    const bls = this.getAll();
    
    // Calculer les écarts
    const hasDiscrepancies = bl.items.some(item => 
      item.quantityReceived !== item.quantityOrdered
    );

    // Calculer les discrepancy pour chaque item
    const itemsWithDiscrepancy = bl.items.map(item => ({
      ...item,
      discrepancy: item.quantityReceived - item.quantityOrdered
    }));

    const newBL: BonLivraison = {
      ...bl,
      id: `BL${Date.now()}`,
      items: itemsWithDiscrepancy,
      createdAt: new Date(),
      hasDiscrepancies
    };

    bls.push(newBL);
    localStorage.setItem(this.storageKey, JSON.stringify(bls));
    return newBL;
  }

  update(id: string, updates: Partial<BonLivraison>): BonLivraison | null {
    const bls = this.getAll();
    const index = bls.findIndex(bl => bl.id === id);
    if (index === -1) return null;

    // Recalculer hasDiscrepancies si items sont mis à jour
    let hasDiscrepancies = bls[index].hasDiscrepancies;
    if (updates.items) {
      hasDiscrepancies = updates.items.some(item => 
        item.quantityReceived !== item.quantityOrdered
      );
    }

    bls[index] = {
      ...bls[index],
      ...updates,
      hasDiscrepancies
    };

    localStorage.setItem(this.storageKey, JSON.stringify(bls));
    return bls[index];
  }

  delete(id: string): boolean {
    const bls = this.getAll();
    const filtered = bls.filter(bl => bl.id !== id);
    if (filtered.length === bls.length) return false;
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return true;
  }

  verify(id: string, verifiedBy: string): BonLivraison | null {
    return this.update(id, {
      status: 'Vérifié',
      verifiedBy,
      verifiedAt: new Date()
    });
  }

  validate(id: string, validatedBy: string): BonLivraison | null {
    return this.update(id, {
      status: 'Validé',
      validatedBy,
      validatedAt: new Date()
    });
  }

  markAsDispute(id: string, notes: string): BonLivraison | null {
    return this.update(id, {
      status: 'Litige',
      discrepancyNotes: notes
    });
  }

  // Comparer BL avec une commande fournisseur
  compareWithOrder(blId: string, orderId: string): BLComparison | null {
    const bl = this.getById(blId);
    if (!bl) return null;

    // Ici tu devras importer ton service de commandes fournisseur
    // Pour l'exemple, je simule une commande
    const order = {
      id: orderId,
      orderNumber: bl.supplierOrderNumber || 'CMD-001',
      items: bl.items.map(item => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantityOrdered
      }))
    };

    const itemsComparison = bl.items.map(blItem => {
      const orderItem = order.items.find(oi => oi.medicineId === blItem.medicineId);
      const ordered = orderItem?.quantity || 0;
      const received = blItem.quantityReceived;
      const difference = received - ordered;

      let status: 'OK' | 'Moins' | 'Plus' | 'Manquant' | 'Non commandé' = 'OK';
      
      if (!orderItem) {
        status = 'Non commandé';
      } else if (received === 0) {
        status = 'Manquant';
      } else if (received < ordered) {
        status = 'Moins';
      } else if (received > ordered) {
        status = 'Plus';
      }

      return {
        medicineId: blItem.medicineId,
        medicineName: blItem.medicineName,
        ordered,
        received,
        difference,
        status
      };
    });

    const totalOrdered = itemsComparison.reduce((sum, item) => sum + item.ordered, 0);
    const totalReceived = itemsComparison.reduce((sum, item) => sum + item.received, 0);
    const totalDifference = totalReceived - totalOrdered;

    let matchStatus: 'Parfait' | 'Écarts mineurs' | 'Écarts majeurs' = 'Parfait';
    const hasIssues = itemsComparison.some(item => item.status !== 'OK');
    
    if (hasIssues) {
      const majorIssues = itemsComparison.some(
        item => item.status === 'Manquant' || item.status === 'Non commandé' || 
        Math.abs(item.difference) > 10
      );
      matchStatus = majorIssues ? 'Écarts majeurs' : 'Écarts mineurs';
    }

    return {
      blId,
      orderId,
      blNumber: bl.blNumber,
      orderNumber: order.orderNumber,
      matchStatus,
      itemsComparison,
      totalOrdered,
      totalReceived,
      totalDifference
    };
  }

  // Générer un numéro de BL automatique
  generateBLNumber(): string {
    const bls = this.getAll();
    const year = new Date().getFullYear();
    const count = bls.filter(bl => bl.blNumber.startsWith(`BL-${year}`)).length + 1;
    return `BL-${year}-${String(count).padStart(4, '0')}`;
  }

  // Statistiques
  getStats() {
    const bls = this.getAll();
    return {
      total: bls.length,
      enAttente: bls.filter(bl => bl.status === 'En attente').length,
      verifie: bls.filter(bl => bl.status === 'Vérifié').length,
      valide: bls.filter(bl => bl.status === 'Validé').length,
      litige: bls.filter(bl => bl.status === 'Litige').length,
      withDiscrepancies: bls.filter(bl => bl.hasDiscrepancies).length
    };
  }

  private getInitialData(): BonLivraison[] {
    const initial: BonLivraison[] = [
      {
        id: 'BL001',
        blNumber: 'BL-2024-0001',
        supplierId: 'SUP001',
        supplierName: 'Laboratoires Laafi',
        supplierOrderNumber: 'CMD-2024-001',
        deliveryDate: new Date('2024-12-15'),
        createdAt: new Date('2024-12-15'),
        items: [
          {
            medicineId: 'MED001',
            medicineName: 'Paracétamol 500mg',
            quantityOrdered: 100,
            quantityReceived: 100,
            unitPrice: 500,
            batchNumber: 'LOT2024-A',
            expirationDate: new Date('2026-12-31'),
            discrepancy: 0
          },
          {
            medicineId: 'MED002',
            medicineName: 'Amoxicilline 1g',
            quantityOrdered: 50,
            quantityReceived: 48,
            unitPrice: 1500,
            batchNumber: 'LOT2024-B',
            expirationDate: new Date('2026-06-30'),
            discrepancy: -2
          }
        ],
        subtotal: 122000,
        tax: 0,
        totalAmount: 122000,
        status: 'Vérifié',
        hasDiscrepancies: true,
        discrepancyNotes: 'Manque 2 boîtes d\'Amoxicilline',
        deliveryPerson: 'Moussa Traoré',
        verifiedBy: 'Jean Dupont',
        verifiedAt: new Date('2024-12-15')
      },
      {
        id: 'BL002',
        blNumber: 'BL-2024-0002',
        supplierId: 'SUP002',
        supplierName: 'Pharmacie Centrale',
        deliveryDate: new Date('2024-12-18'),
        createdAt: new Date('2024-12-18'),
        items: [
          {
            medicineId: 'MED003',
            medicineName: 'Ibuprofène 400mg',
            quantityOrdered: 200,
            quantityReceived: 200,
            unitPrice: 750,
            batchNumber: 'LOT2024-C',
            expirationDate: new Date('2027-03-31'),
            discrepancy: 0
          }
        ],
        subtotal: 150000,
        tax: 0,
        totalAmount: 150000,
        status: 'Validé',
        hasDiscrepancies: false,
        deliveryPerson: 'Aminata Sana',
        verifiedBy: 'Jean Dupont',
        verifiedAt: new Date('2024-12-18'),
        validatedBy: 'Admin',
        validatedAt: new Date('2024-12-18')
      }
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(initial));
    return initial;
  }
}

export const bonLivraisonService = new BonLivraisonService();