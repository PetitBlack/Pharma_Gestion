import type { ProductTracking } from '@/models/ProductTracking';

const STORAGE_KEY = 'epharmacy_product_tracking';

class ProductTrackingService {
  private getAll(): ProductTracking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(items: ProductTracking[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  list(): ProductTracking[] {
    return [...this.getAll()];
  }

  getById(id: string): ProductTracking | undefined {
    return this.getAll().find(t => t.id === id);
  }

  create(data: Omit<ProductTracking, 'id' | 'createdAt' | 'trackingNumber'>): ProductTracking {
    const all = this.getAll();
    const year = new Date().getFullYear();
    const count = all.filter(t => t.trackingNumber.startsWith(`TRK-${year}`)).length + 1;
    const entry: ProductTracking = {
      ...data,
      id: `TRK${Date.now()}`,
      trackingNumber: `TRK-${year}-${String(count).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(entry);
    this.save(all);
    return entry;
  }

  update(id: string, updates: Partial<ProductTracking>): ProductTracking | null {
    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    this.save(all);
    return all[idx];
  }

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    this.save(filtered);
    return true;
  }

  /** Enregistre un retour partiel ou total et met à jour le statut. */
  addReturn(id: string, quantity: number): ProductTracking | null {
    const item = this.getById(id);
    if (!item) return null;
    const newReturned = item.quantityReturned + quantity;
    const status: ProductTracking['status'] =
      newReturned >= item.initialQuantity ? 'Retourné totalement' : 'Retourné partiellement';
    return this.update(id, { quantityReturned: newReturned, status });
  }

  /** Clôture un suivi (vendu ou expiré). */
  close(id: string, reason: 'Vendu' | 'Expiré'): ProductTracking | null {
    return this.update(id, { status: reason });
  }

  getStats(getLiveStock: (medicineId: string) => number) {
    const all = this.getAll();
    const active = all.filter(t => t.status === 'En suivi' || t.status === 'Retourné partiellement');
    const today = new Date();

    const expiringSoon = active.filter(t => {
      const days = Math.ceil((new Date(t.returnDeadline).getTime() - today.getTime()) / 86400000);
      return days >= 0 && days <= 7;
    });

    const overdueWithStock = active.filter(t => {
      const days = Math.ceil((new Date(t.returnDeadline).getTime() - today.getTime()) / 86400000);
      const liveStock = getLiveStock(t.medicineId);
      const remaining = Math.max(0, liveStock - t.quantityReturned);
      return days < 0 && remaining > 0;
    });

    const stockValue = active.reduce((sum, t) => {
      const liveStock = getLiveStock(t.medicineId);
      const remaining = Math.max(0, liveStock);
      return sum + remaining * t.unitCost;
    }, 0);

    return {
      total: all.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      overdueWithStock: overdueWithStock.length,
      stockValue,
    };
  }
}

export const productTrackingService = new ProductTrackingService();
