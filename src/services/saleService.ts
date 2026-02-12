import type { Sale, SaleItem } from '@/models/Sale';
import { mockSales } from './mockData';
import { medicineService } from './medicineService';

class SaleService {
  private sales: Sale[] = [...mockSales];

  getAll(): Sale[] {
    return [...this.sales].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  getById(id: string): Sale | undefined {
    return this.sales.find(s => s.id === id);
  }

  createSale(
    items: SaleItem[],
    paymentMethod: 'Cash' | 'Mobile Money',
    userId: string,
    userName: string
  ): Sale | null {
    // Validate stock availability
    for (const item of items) {
      const medicine = medicineService.getById(item.medicineId);
      if (!medicine || medicine.quantity < item.quantity) {
        return null;
      }
    }

    // Create sale
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const newSale: Sale = {
      id: `S${Date.now()}`,
      items,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      userId,
      userName
    };

    // Update stock
    items.forEach(item => {
      medicineService.updateQuantity(item.medicineId, -item.quantity);
    });

    this.sales.push(newSale);
    return newSale;
  }

  getTodaySales(): Sale[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.sales.filter(s => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
  }

  getTodayTotal(): number {
    return this.getTodaySales().reduce((sum, sale) => sum + sale.total, 0);
  }

  getDailySales(days: number = 7): { date: string; total: number }[] {
    const result: { date: string; total: number }[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayTotal = this.sales
        .filter(s => {
          const saleDate = new Date(s.date);
          saleDate.setHours(0, 0, 0, 0);
          return saleDate.getTime() === date.getTime();
        })
        .reduce((sum, sale) => sum + sale.total, 0);
      
      result.push({ date: dateStr, total: dayTotal });
    }
    
    return result;
  }
}

export const saleService = new SaleService();
