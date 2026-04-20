import type { Medicine } from '@/models/Medicine';
import { mockMedicines } from './mockData';

class MedicineService {
  private medicines: Medicine[] = [...mockMedicines];

  /** Calcule la quantité réelle d'un médicament (détail = dérivée du parent). */
  private computeQty(med: Medicine): Medicine {
    if (med.packagingType === 'detail' && med.detailOf && med.detailSize) {
      const parent = this.medicines.find(m => m.id === med.detailOf);
      const computed = parent ? Math.floor(parent.quantity / med.detailSize) : 0;
      return { ...med, quantity: computed };
    }
    return med;
  }

  getAll(): Medicine[] {
    return this.medicines.map(m => this.computeQty(m));
  }

  getById(id: string): Medicine | undefined {
    const med = this.medicines.find(m => m.id === id);
    return med ? this.computeQty(med) : undefined;
  }

  add(medicine: Omit<Medicine, 'id'>): Medicine {
    const newMedicine: Medicine = {
      ...medicine,
      id: `MED${Date.now()}`
    };
    this.medicines.push(newMedicine);
    return newMedicine;
  }

  update(id: string, updates: Partial<Medicine>): Medicine | null {
    const index = this.medicines.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    this.medicines[index] = { ...this.medicines[index], ...updates };
    return this.medicines[index];
  }

  delete(id: string): boolean {
    const index = this.medicines.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.medicines.splice(index, 1);
    return true;
  }

  getLowStock(threshold: number = 20): Medicine[] {
    return this.medicines
      .map(m => this.computeQty(m))
      .filter(m => m.quantity < threshold);
  }

  getExpiring(days: number = 90): Medicine[] {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return this.medicines.filter(m => {
      const expDate = new Date(m.expirationDate);
      return expDate <= futureDate && expDate >= today;
    });
  }

  search(query: string): Medicine[] {
    const lowerQuery = query.toLowerCase();
    return this.medicines.filter(m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery) ||
      m.batchNumber.toLowerCase().includes(lowerQuery)
    );
  }

  updateQuantity(id: string, delta: number): boolean {
    const medicine = this.medicines.find(m => m.id === id);
    if (!medicine) return false;

    if (medicine.packagingType === 'detail' && medicine.detailOf && medicine.detailSize) {
      // Cascader la déduction sur le parent (en unités de base)
      const parent = this.medicines.find(m => m.id === medicine.detailOf);
      if (parent) {
        parent.quantity += delta * medicine.detailSize;
      }
      // La quantité stockée du détail reste à 0 (calculée dynamiquement)
    } else {
      medicine.quantity += delta;
    }
    return true;
  }
}

export const medicineService = new MedicineService();
