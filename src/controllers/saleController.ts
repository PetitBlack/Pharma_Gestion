import { useState, useEffect } from 'react';
import type { Sale, SaleItem } from '@/models/Sale';
import { saleService } from '@/services/saleService';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = () => {
    setLoading(true);
    const data = saleService.getAll();
    setSales(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, []);

  const createSale = (
    items: SaleItem[],
    paymentMethod: 'Cash' | 'Mobile Money',
    userId: string,
    userName: string
  ): Sale | null => {
    const sale = saleService.createSale(items, paymentMethod, userId, userName);
    if (sale) {
      loadSales();
    }
    return sale;
  };

  const getTodayTotal = (): number => {
    return saleService.getTodayTotal();
  };

  const getDailySales = (days: number = 7) => {
    return saleService.getDailySales(days);
  };

  return {
    sales,
    loading,
    createSale,
    getTodayTotal,
    getDailySales,
    refresh: loadSales
  };
}
