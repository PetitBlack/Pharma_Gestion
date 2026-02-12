import { useState, useEffect } from 'react';
import type { Medicine } from '@/models/Medicine';
import { medicineService } from '@/services/medicineService';

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMedicines = () => {
    setLoading(true);
    const data = medicineService.getAll();
    setMedicines(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const addMedicine = (medicine: Omit<Medicine, 'id'>): boolean => {
    try {
      medicineService.add(medicine);
      loadMedicines();
      return true;
    } catch {
      return false;
    }
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>): boolean => {
    try {
      medicineService.update(id, updates);
      loadMedicines();
      return true;
    } catch {
      return false;
    }
  };

  const deleteMedicine = (id: string): boolean => {
    try {
      medicineService.delete(id);
      loadMedicines();
      return true;
    } catch {
      return false;
    }
  };

  const searchMedicines = (query: string): Medicine[] => {
    return medicineService.search(query);
  };

  return {
    medicines,
    loading,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    searchMedicines,
    refresh: loadMedicines
  };
}
