import type { MedicineHistoryEvent, HistoryEventType } from '@/models/MedicineHistory';

// Données mock pour démonstration
const generateMockHistory = (): MedicineHistoryEvent[] => {
  const now = new Date();
  const d = (daysAgo: number, hour = 9) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - daysAgo);
    dt.setHours(hour, 0, 0, 0);
    return dt.toISOString();
  };

  return [
    // --- Paracétamol 500mg (id: '1') ---
    { id: 'H001', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'entry',       date: d(365), quantityAdded: 200, quantityAfter: 200, wholesalePriceAfter: 1.20, sellingPriceAfter: 2.50, userName: 'admin', userId: 'U001' },
    { id: 'H002', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'restock',     date: d(280), quantityAdded: 150, quantityAfter: 320, userName: 'admin', userId: 'U001' },
    { id: 'H003', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'price_change',date: d(210), wholesalePriceBefore: 1.20, wholesalePriceAfter: 1.40, sellingPriceBefore: 2.50, sellingPriceAfter: 2.80, userName: 'admin', userId: 'U001' },
    { id: 'H004', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(180), quantitySold: 12, sellingPrice: 2.80, saleTotal: 33.60, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H005', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(150), quantitySold: 8,  sellingPrice: 2.80, saleTotal: 22.40, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H006', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'restock',     date: d(120), quantityAdded: 200, quantityAfter: 500, userName: 'admin', userId: 'U001' },
    { id: 'H007', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'price_change',date: d(90),  wholesalePriceBefore: 1.40, wholesalePriceAfter: 1.50, sellingPriceBefore: 2.80, sellingPriceAfter: 2.50, userName: 'admin', userId: 'U001' },
    { id: 'H008', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(60),  quantitySold: 20, sellingPrice: 2.50, saleTotal: 50.00, userName: 'Pierre Martin', userId: 'U004' },
    { id: 'H009', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(45),  quantitySold: 15, sellingPrice: 2.50, saleTotal: 37.50, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H010', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(30),  quantitySold: 18, sellingPrice: 2.50, saleTotal: 45.00, userName: 'Pierre Martin', userId: 'U004' },
    { id: 'H011', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(15),  quantitySold: 10, sellingPrice: 2.50, saleTotal: 25.00, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H012', medicineId: '1', medicineName: 'Paracetamol 500mg', type: 'sale',        date: d(3),   quantitySold: 5,  sellingPrice: 2.50, saleTotal: 12.50, userName: 'admin', userId: 'U001' },

    // --- Amoxicilline 250mg (id: '2') ---
    { id: 'H013', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'entry',       date: d(300), quantityAdded: 80, quantityAfter: 80, wholesalePriceAfter: 5.00, sellingPriceAfter: 8.00, userName: 'admin', userId: 'U001' },
    { id: 'H014', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'price_change',date: d(200), wholesalePriceBefore: 5.00, wholesalePriceAfter: 5.50, sellingPriceBefore: 8.00, sellingPriceAfter: 9.00, userName: 'admin', userId: 'U001' },
    { id: 'H015', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'sale',        date: d(180), quantitySold: 10, sellingPrice: 9.00, saleTotal: 90.00, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H016', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'sale',        date: d(120), quantitySold: 8,  sellingPrice: 9.00, saleTotal: 72.00, userName: 'Pierre Martin', userId: 'U004' },
    { id: 'H017', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'sale',        date: d(60),  quantitySold: 12, sellingPrice: 9.00, saleTotal: 108.00, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H018', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'price_change',date: d(30),  wholesalePriceBefore: 5.50, wholesalePriceAfter: 6.00, sellingPriceBefore: 9.00, sellingPriceAfter: 8.00, userName: 'admin', userId: 'U001' },
    { id: 'H019', medicineId: '2', medicineName: 'Amoxicilline 250mg', type: 'sale',        date: d(10),  quantitySold: 6,  sellingPrice: 8.00, saleTotal: 48.00, userName: 'admin', userId: 'U001' },

    // --- Ibuprofène 400mg (id: '3') ---
    { id: 'H020', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'entry',        date: d(400), quantityAdded: 150, quantityAfter: 150, wholesalePriceAfter: 2.00, sellingPriceAfter: 3.50, userName: 'admin', userId: 'U001' },
    { id: 'H021', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'sale',         date: d(350), quantitySold: 30, sellingPrice: 3.50, saleTotal: 105.00, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H022', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'restock',      date: d(300), quantityAdded: 100, quantityAfter: 220, userName: 'admin', userId: 'U001' },
    { id: 'H023', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'sale',         date: d(250), quantitySold: 25, sellingPrice: 3.50, saleTotal: 87.50, userName: 'Pierre Martin', userId: 'U004' },
    { id: 'H024', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'sale',         date: d(180), quantitySold: 20, sellingPrice: 3.50, saleTotal: 70.00, userName: 'Jane Smith', userId: 'U002' },
    { id: 'H025', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'sale',         date: d(90),  quantitySold: 22, sellingPrice: 3.50, saleTotal: 77.00, userName: 'Pierre Martin', userId: 'U004' },
    { id: 'H026', medicineId: '3', medicineName: 'Ibuprofène 400mg', type: 'sale',         date: d(30),  quantitySold: 18, sellingPrice: 3.50, saleTotal: 63.00, userName: 'admin', userId: 'U001' },
  ];
};

class MedicineHistoryService {
  private events: MedicineHistoryEvent[] = generateMockHistory();

  getByMedicineId(medicineId: string): MedicineHistoryEvent[] {
    return this.events
      .filter(e => e.medicineId === medicineId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addEvent(event: Omit<MedicineHistoryEvent, 'id'>): MedicineHistoryEvent {
    const newEvent: MedicineHistoryEvent = {
      ...event,
      id: `H${Date.now()}`,
    };
    this.events.push(newEvent);
    return newEvent;
  }

  recordEntry(params: {
    medicineId: string;
    medicineName: string;
    quantityAdded: number;
    quantityAfter: number;
    wholesalePriceAfter?: number;
    sellingPriceAfter?: number;
    userId?: string;
    userName?: string;
  }): void {
    this.addEvent({ ...params, type: 'entry', date: new Date().toISOString() });
  }

  recordRestock(params: {
    medicineId: string;
    medicineName: string;
    quantityAdded: number;
    quantityAfter: number;
    userId?: string;
    userName?: string;
  }): void {
    this.addEvent({ ...params, type: 'restock', date: new Date().toISOString() });
  }

  recordPriceChange(params: {
    medicineId: string;
    medicineName: string;
    wholesalePriceBefore?: number;
    wholesalePriceAfter?: number;
    sellingPriceBefore?: number;
    sellingPriceAfter?: number;
    userId?: string;
    userName?: string;
  }): void {
    this.addEvent({ ...params, type: 'price_change', date: new Date().toISOString() });
  }

  recordSale(params: {
    medicineId: string;
    medicineName: string;
    quantitySold: number;
    sellingPrice: number;
    saleTotal: number;
    userId?: string;
    userName?: string;
  }): void {
    this.addEvent({ ...params, type: 'sale', date: new Date().toISOString() });
  }

  // Agrégat des ventes par mois pour les graphiques
  getMonthlySales(medicineId: string): { month: string; quantite: number; chiffre: number }[] {
    const sales = this.events.filter(e => e.medicineId === medicineId && e.type === 'sale');
    const map = new Map<string, { quantite: number; chiffre: number }>();

    sales.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key) ?? { quantite: 0, chiffre: 0 };
      map.set(key, {
        quantite: existing.quantite + (e.quantitySold ?? 0),
        chiffre: existing.chiffre + (e.saleTotal ?? 0),
      });
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ...data,
      }));
  }

  // Historique des prix pour graphique
  getPriceHistory(medicineId: string): { date: string; gros: number | null; vente: number | null }[] {
    const events = this.events
      .filter(e => e.medicineId === medicineId && (e.type === 'entry' || e.type === 'price_change'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events.map(e => ({
      date: new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }),
      gros: e.wholesalePriceAfter ?? null,
      vente: e.sellingPriceAfter ?? null,
    }));
  }
}

export const medicineHistoryService = new MedicineHistoryService();
