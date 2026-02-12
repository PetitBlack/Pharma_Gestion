import { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Trash2, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useSales } from '@/controllers/saleController';
import { medicineService } from '@/services/medicineService';
import type { Medicine } from '@/models/Medicine';
import type { SaleItem, PaymentMethod } from '@/models/Sale';
import type { User } from '@/models/User';
import { toast } from 'sonner';

interface SalesViewProps {
  currentUser: User | null;
}

export function SalesView({ currentUser }: SalesViewProps) {
  const { createSale } = useSales();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setMedicines(medicineService.getAll());
  }, []);

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    med.quantity > 0
  );

  const addToCart = () => {
    if (!selectedMedicine) return;
    
    if (quantity > selectedMedicine.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    const existingItem = cart.find(item => item.medicineId === selectedMedicine.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > selectedMedicine.quantity) {
        toast.error('Not enough stock available');
        return;
      }
      
      setCart(cart.map(item =>
        item.medicineId === selectedMedicine.id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        medicineId: selectedMedicine.id,
        medicineName: selectedMedicine.name,
        quantity,
        price: selectedMedicine.price,
        total: quantity * selectedMedicine.price
      }]);
    }

    setSelectedMedicine(null);
    setQuantity(1);
    setSearchQuery('');
    toast.success('Added to cart');
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    const sale = createSale(cart, paymentMethod, currentUser.id, currentUser.fullName);
    
    if (sale) {
      toast.success('Sale completed successfully!');
      setCart([]);
      setMedicines(medicineService.getAll());
    } else {
      toast.error('Sale failed. Please check stock availability.');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Medicine Search & Selection */}
        <div className="col-span-2 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <Label>Search Medicine</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Type medicine name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                {filteredMedicines.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No medicines found</p>
                ) : (
                  filteredMedicines.slice(0, 10).map((medicine) => (
                    <button
                      key={medicine.id}
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-500">{medicine.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-teal-600">${medicine.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">Stock: {medicine.quantity}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Medicine */}
          {selectedMedicine && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedMedicine.name}</h3>
                  <p className="text-sm text-gray-600">{selectedMedicine.category}</p>
                  <p className="text-lg font-bold text-teal-600 mt-2">${selectedMedicine.price.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-500">Available: {selectedMedicine.quantity}</p>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedMedicine.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>
                <Button onClick={addToCart} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Cart</h3>
              <span className="ml-auto text-sm text-gray-500">({cart.length} items)</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.medicineId} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.medicineName}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.medicineId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <p className="text-lg font-semibold text-gray-900">Total</p>
                <p className="text-2xl font-bold text-teal-600">${calculateTotal().toFixed(2)}</p>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="Mobile Money">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
