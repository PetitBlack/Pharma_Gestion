import type { Prescription, PrescriptionMedicine } from '@/models/Prescription';

const STORAGE_KEY = 'epharmacy_prescriptions';

class PrescriptionService {
  private entries: Prescription[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) this.entries = JSON.parse(stored);
    } catch {
      this.entries = [];
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
  }

  add(data: Omit<Prescription, 'id'>): Prescription {
    const entry: Prescription = {
      ...data,
      id: `PRESC${Date.now()}_${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    };
    this.entries.unshift(entry);
    this.save();
    return entry;
  }

  getAll(): Prescription[] {
    return [...this.entries];
  }

  getById(id: string): Prescription | undefined {
    return this.entries.find(p => p.id === id);
  }

  getByPatient(name: string): Prescription[] {
    return this.entries.filter(p =>
      p.patientName.toLowerCase().includes(name.toLowerCase())
    );
  }

  getByAuxiliary(auxiliaryId: string): Prescription[] {
    return this.entries.filter(p => p.auxiliaryId === auxiliaryId);
  }

  linkToOrder(prescriptionId: string, orderId: string) {
    const p = this.entries.find(e => e.id === prescriptionId);
    if (p) {
      p.orderId = orderId;
      this.save();
    }
  }

  getRecent(limit = 50): Prescription[] {
    return this.entries.slice(0, limit);
  }
}

export const prescriptionService = new PrescriptionService();
