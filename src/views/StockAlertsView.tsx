import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { medicineService } from '@/services/medicineService';
import { settingsService } from '@/services/settingsService';
import type { Medicine } from '@/models/Medicine';
import { User } from '@/models/User';

interface StockAlertsViewProps {
  currentUser: User;
}

export function StockAlertsView({ currentUser }: { currentUser: any }) {
  const [lowStock, setLowStock] = useState<Medicine[]>([]);
  const [expiring, setExpiring] = useState<Medicine[]>([]);

  useEffect(() => {
    const settings = settingsService.get();
    setLowStock(medicineService.getLowStock(settings.lowStockThreshold));
    setExpiring(medicineService.getExpiring(settings.expiryAlertDays));
  }, []);

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Low Stock Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Medicines</h3>
              <p className="text-sm text-gray-600">{lowStock.length} items need restocking</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {lowStock.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No low stock items</p>
            </div>
          ) : (
            lowStock.map((medicine) => (
              <div key={medicine.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                      <p className="text-sm text-gray-600">{medicine.category} - {medicine.batchNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-2xl font-bold text-orange-600">{medicine.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-lg font-semibold text-gray-900">${medicine.price.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expiring Soon Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
              <p className="text-sm text-gray-600">{expiring.length} items expiring within 90 days</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {expiring.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No expiring items</p>
            </div>
          ) : (
            expiring.map((medicine) => {
              const daysUntilExpiry = Math.ceil(
                (new Date(medicine.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={medicine.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{medicine.name}</h4>
                        <p className="text-sm text-gray-600">{medicine.category} - {medicine.batchNumber}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Expiration Date</p>
                      <p className="text-lg font-semibold text-gray-900">{medicine.expirationDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Days Left</p>
                      <p className={`text-2xl font-bold ${
                        daysUntilExpiry < 30 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {daysUntilExpiry}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className="text-lg font-semibold text-gray-900">{medicine.quantity}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
