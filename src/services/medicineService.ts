import type { Medicine } from '@/models/Medicine';
import { mockMedicines } from './mockData';

class MedicineService {
  private medicines: Medicine[] = [...mockMedicines];

  getAll(): Medicine[] {
    return [...this.medicines];
  }

  getById(id: string): Medicine | undefined {
    return this.medicines.find(m => m.id === id);
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
    return this.medicines.filter(m => m.quantity < threshold);
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

  updateQuantity(id: string, quantity: number): boolean {
    const medicine = this.medicines.find(m => m.id === id);
    if (!medicine) return false;
    
    medicine.quantity += quantity;
    return true;
  }
}

export const medicineService = new MedicineService();
