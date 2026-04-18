import type { Inventory, InventoryItem } from '@/models/Inventory';
import { medicineService } from '@/services/medicineService';

const STORAGE_KEY = 'epharmacy_inventories';

class InventoryService {
  private getAll(): Inventory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(inventories: Inventory[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventories));
  }

  private recalcStats(inv: Inventory): Inventory {
    const counted = inv.items.filter(i => i.physicalQty !== undefined);
    const discrepancies = counted.filter(i => i.discrepancy !== 0 && i.discrepancy !== undefined);
    const physValue = counted.reduce((s, i) => s + (i.physicalQty ?? 0) * i.unitPrice, 0);
    return {
      ...inv,
      countedItems: counted.length,
      discrepanciesCount: discrepancies.length,
      totalPhysicalValue: physValue,
    };
  }

  list(): Inventory[] {
    return [...this.getAll()];
  }

  getById(id: string): Inventory | undefined {
    return this.getAll().find(inv => inv.id === id);
  }

  /** Crée un nouvel inventaire en prenant un snapshot du stock actuel. */
  create(name: string, year: number, createdBy: string, notes?: string): Inventory {
    const all = this.getAll();
    const count = all.filter(i => i.inventoryNumber.startsWith(`INV-${year}`)).length + 1;
    const medicines = medicineService.getAll();

    const items: InventoryItem[] = medicines.map(med => ({
      medicineId: med.id,
      medicineName: med.name,
      category: med.category,
      location: med.location,
      systemQty: med.quantity,
      unitPrice: med.price,
      batchNumber: med.batchNumber,
      expirationDate: med.expirationDate,
    }));

    const totalSystemValue = items.reduce((s, i) => s + i.systemQty * i.unitPrice, 0);

    const inventory: Inventory = {
      id: `INV${Date.now()}`,
      inventoryNumber: `INV-${year}-${String(count).padStart(4, '0')}`,
      name,
      year,
      startDate: new Date().toISOString(),
      status: 'En cours',
      items,
      createdBy,
      notes,
      totalItems: items.length,
      countedItems: 0,
      discrepanciesCount: 0,
      totalSystemValue,
      totalPhysicalValue: 0,
    };

    all.unshift(inventory);
    this.save(all);
    return inventory;
  }

  /** Met à jour la quantité physique d'un article. */
  updateItemCount(
    inventoryId: string,
    medicineId: string,
    physicalQty: number,
    countedBy?: string
  ): Inventory | null {
    const all = this.getAll();
    const idx = all.findIndex(i => i.id === inventoryId);
    if (idx === -1) return null;

    const inv = { ...all[idx] };
    const itemIdx = inv.items.findIndex(i => i.medicineId === medicineId);
    if (itemIdx === -1) return null;

    inv.items = [...inv.items];
    inv.items[itemIdx] = {
      ...inv.items[itemIdx],
      physicalQty,
      discrepancy: physicalQty - inv.items[itemIdx].systemQty,
      countedBy,
      countedAt: new Date().toISOString(),
    };

    all[idx] = this.recalcStats(inv);
    this.save(all);
    return all[idx];
  }

  /** Efface le comptage d'un article (retour à "non compté"). */
  resetItemCount(inventoryId: string, medicineId: string): Inventory | null {
    const all = this.getAll();
    const idx = all.findIndex(i => i.id === inventoryId);
    if (idx === -1) return null;

    const inv = { ...all[idx] };
    const itemIdx = inv.items.findIndex(i => i.medicineId === medicineId);
    if (itemIdx === -1) return null;

    inv.items = [...inv.items];
    const { physicalQty, discrepancy, countedBy, countedAt, ...rest } = inv.items[itemIdx];
    inv.items[itemIdx] = rest;

    all[idx] = this.recalcStats(inv);
    this.save(all);
    return all[idx];
  }

  /** Marque l'inventaire comme terminé (tous les articles doivent être comptés). */
  finish(inventoryId: string): Inventory | null {
    const all = this.getAll();
    const idx = all.findIndex(i => i.id === inventoryId);
    if (idx === -1) return null;

    all[idx] = { ...all[idx], status: 'Terminé', endDate: new Date().toISOString() };
    this.save(all);
    return all[idx];
  }

  /** Valide l'inventaire et met à jour le stock en conséquence. */
  validate(inventoryId: string, validatedBy: string): Inventory | null {
    const all = this.getAll();
    const idx = all.findIndex(i => i.id === inventoryId);
    if (idx === -1) return null;

    const inv = all[idx];

    // Met à jour le stock pour chaque article compté
    inv.items.forEach(item => {
      if (item.physicalQty !== undefined) {
        medicineService.update(item.medicineId, { quantity: item.physicalQty });
      }
    });

    all[idx] = {
      ...inv,
      status: 'Validé',
      validatedBy,
      validatedAt: new Date().toISOString(),
    };
    this.save(all);
    return all[idx];
  }

  delete(inventoryId: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(i => i.id !== inventoryId);
    if (filtered.length === all.length) return false;
    this.save(filtered);
    return true;
  }
}

export const inventoryService = new InventoryService();
