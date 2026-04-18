import type { RetourFournisseur } from '@/models/bonLivraison';

const STORAGE_KEY = 'epharmacy_retours_fournisseur';

class RetourService {
  private getAll(): RetourFournisseur[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(retours: RetourFournisseur[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(retours));
  }

  list(): RetourFournisseur[] {
    return [...this.getAll()];
  }

  getById(id: string): RetourFournisseur | undefined {
    return this.getAll().find(r => r.id === id);
  }

  create(data: Omit<RetourFournisseur, 'id' | 'createdAt' | 'retourNumber'>): RetourFournisseur {
    const all = this.getAll();
    const year = new Date().getFullYear();
    const count = all.filter(r => r.retourNumber.startsWith(`RET-${year}`)).length + 1;
    const entry: RetourFournisseur = {
      ...data,
      id: `RET${Date.now()}`,
      retourNumber: `RET-${year}-${String(count).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(entry);
    this.save(all);
    return entry;
  }

  update(id: string, updates: Partial<RetourFournisseur>): RetourFournisseur | null {
    const all = this.getAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    this.save(all);
    return all[idx];
  }

  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(r => r.id !== id);
    if (filtered.length === all.length) return false;
    this.save(filtered);
    return true;
  }

  getBySupplier(supplierName: string): RetourFournisseur[] {
    return this.getAll().filter(r =>
      r.supplierName.toLowerCase().includes(supplierName.toLowerCase())
    );
  }

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      enAttente: all.filter(r => r.status === 'En attente').length,
      envoye: all.filter(r => r.status === 'Envoyé').length,
      accepte: all.filter(r => r.status === 'Accepté').length,
      refuse: all.filter(r => r.status === 'Refusé').length,
    };
  }
}

export const retourService = new RetourService();
