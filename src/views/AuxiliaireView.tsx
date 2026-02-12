import { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Trash2, Send, Clock, CheckCircle, XCircle, MapPin, Pause, Play, User as UserIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useOrders } from '@/controllers/orderController';
import { medicineService } from '@/services/medicineService';
import type { Medicine } from '@/models/Medicine';
import type { OrderItem } from '@/models/Order';
import type { User } from '@/models/User';
import { toast } from 'sonner';

interface AuxiliaireViewProps {
  currentUser: User | null;
}

interface PendingOrder {
  id: string;
  clientName: string;
  items: OrderItem[];
  createdAt: Date;
  total: number;
}

export function AuxiliaireView({ currentUser }: AuxiliaireViewProps) {
  const { createOrder, getOrdersByAuxiliary, orders } = useOrders();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  
  // Nouvelles states pour client et commandes en attente
  const [clientName, setClientName] = useState('');
  const [showClientInput, setShowClientInput] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);

  useEffect(() => {
    setMedicines(medicineService.getAll());
    // Charger les commandes en attente du localStorage
    const saved = localStorage.getItem(`pending_orders_${currentUser?.id}`);
    if (saved) {
      setPendingOrders(JSON.parse(saved));
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      setMyOrders(getOrdersByAuxiliary(currentUser.id));
    }
  }, [orders, currentUser]);

  // Sauvegarder les commandes en attente dans localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pending_orders_${currentUser.id}`, JSON.stringify(pendingOrders));
    }
  }, [pendingOrders, currentUser]);

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    med.quantity > 0
  );

  const addToCart = () => {
    if (!selectedMedicine) return;
    
    if (quantity > selectedMedicine.quantity) {
      toast.error('Stock insuffisant');
      return;
    }

    const existingItem = cart.find(item => item.medicineId === selectedMedicine.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > selectedMedicine.quantity) {
        toast.error('Stock insuffisant');
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
    toast.success('Ajouté au panier');
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  // Mettre en attente la commande actuelle
  const handlePutOnHold = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    const client = clientName.trim() || 'Client sans nom';
    
    const newPendingOrder: PendingOrder = {
      id: `pending_${Date.now()}`,
      clientName: client,
      items: [...cart],
      createdAt: new Date(),
      total: calculateTotal()
    };

    setPendingOrders([...pendingOrders, newPendingOrder]);
    setCart([]);
    setClientName('');
    setShowClientInput(false);
    toast.success(`Commande mise en attente pour ${client}`);
  };

  // Reprendre une commande en attente
  const handleResumePendingOrder = (order: PendingOrder) => {
    if (cart.length > 0) {
      toast.error('Veuillez d\'abord vider ou mettre en attente la commande actuelle');
      return;
    }

    setCart(order.items);
    setClientName(order.clientName);
    setShowClientInput(true);
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    setShowPendingOrders(false);
    toast.success(`Commande de ${order.clientName} reprise`);
  };

  // Supprimer une commande en attente
  const handleDeletePendingOrder = (orderId: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
    toast.success('Commande supprimée');
  };

  const handleSendToCheckout = () => {
    if (cart.length === 0) {
      toast.error('Le panier est vide');
      return;
    }

    if (!currentUser) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    const client = clientName.trim() || 'Client anonyme';

    try {
      createOrder(
        cart,
        currentUser.id,
        currentUser.fullName,
        currentUser.workstation || 'Poste non défini'
      );
      
      toast.success(`Commande de ${client} envoyée à la caisse !`);
      setCart([]);
      setClientName('');
      setShowClientInput(false);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la commande');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-orange-100 text-orange-700';
      case 'Payée': return 'bg-green-100 text-green-700';
      case 'Annulée': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'En attente': return <Clock className="w-4 h-4" />;
      case 'Payée': return <CheckCircle className="w-4 h-4" />;
      case 'Annulée': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête avec info poste */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentUser?.workstation || 'Poste Auxiliaire'}
            </h3>
            <p className="text-sm text-gray-600">Utilisateur: {currentUser?.fullName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Commandes aujourd'hui</p>
              <p className="text-2xl font-bold text-teal-600">{myOrders.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">En attente</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPendingOrders(!showPendingOrders)}
                className="text-2xl font-bold text-orange-600 hover:text-orange-700"
              >
                {pendingOrders.length}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Commandes en attente */}
      <AnimatePresence>
        {showPendingOrders && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPendingOrders(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Commandes en attente</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPendingOrders(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {pendingOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucune commande en attente</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <UserIcon className="w-4 h-4 text-teal-600" />
                              <p className="font-semibold text-gray-900">{order.clientName}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-teal-600">{order.total.toFixed(2)} FCFA</p>
                        </div>
                        
                        <div className="mb-3 space-y-1">
                          {order.items.map((item) => (
                            <div key={item.medicineId} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.medicineName}</span>
                              <span className="text-gray-500">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleResumePendingOrder(order)}
                            className="flex-1 bg-teal-600 hover:bg-teal-700"
                            size="sm"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Reprendre
                          </Button>
                          <Button
                            onClick={() => handleDeletePendingOrder(order.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-6">
        {/* Gauche: Sélection des produits */}
        <div className="col-span-2 space-y-6">
          {/* Recherche */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <Label>Rechercher un médicament</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Tapez le nom du médicament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Résultats de recherche */}
            <AnimatePresence>
              {searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 max-h-96 overflow-y-auto space-y-2"
                >
                  {filteredMedicines.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun médicament trouvé</p>
                  ) : (
                    filteredMedicines.slice(0, 10).map((medicine, index) => (
                      <motion.button
                        key={medicine.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMedicine(medicine);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{medicine.name}</p>
                          <p className="text-sm text-gray-500">{medicine.category}</p>
                          {medicine.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-teal-600" />
                              <p className="text-xs text-teal-600 font-medium">{medicine.location}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-teal-600">{medicine.price.toFixed(2)} FCFA</p>
                          <p className="text-xs text-gray-500">Stock: {medicine.quantity}</p>
                        </div>
                      </motion.button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Médicament sélectionné */}
          <AnimatePresence>
            {selectedMedicine && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMedicine.name}</h3>
                    <p className="text-sm text-gray-600">{selectedMedicine.category}</p>
                    {selectedMedicine.location && (
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <p className="text-sm text-teal-600 font-medium">{selectedMedicine.location}</p>
                      </div>
                    )}
                    <p className="text-lg font-bold text-teal-600 mt-2">{selectedMedicine.price.toFixed(2)} FCFA</p>
                  </div>
                  <p className="text-sm text-gray-500">Disponible: {selectedMedicine.quantity}</p>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="quantity">Quantité</Label>
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
                    Ajouter
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mes commandes récentes */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Mes commandes</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {myOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Aucune commande</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {myOrders.slice(0, 10).map((order, index) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.items.length} article(s)</p>
                      <p className="text-lg font-bold text-gray-900">{order.total.toFixed(2)} FCFA</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Droite: Panier */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Panier</h3>
              <span className="ml-auto text-sm text-gray-500">({cart.length} articles)</span>
            </div>

            {/* Section Client */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              {!showClientInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientInput(true)}
                  className="w-full"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Ajouter un client
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nom du client</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clientName"
                      type="text"
                      placeholder="Nom du client..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowClientInput(false);
                        setClientName('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {clientName && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-teal-600"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="font-medium">{clientName}</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Panier vide</p>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.medicineId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{item.medicineName}</p>
                        <p className="text-xs text-gray-600">
                          {item.quantity} × {item.price.toFixed(2)} FCFA
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{item.total.toFixed(2)} FCFA</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.medicineId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <p className="text-lg font-semibold text-gray-900">Total</p>
                <motion.p 
                  key={calculateTotal()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-teal-600"
                >
                  {calculateTotal().toFixed(2)} FCFA
                </motion.p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handlePutOnHold}
                  disabled={cart.length === 0}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Mettre en attente
                </Button>

                <Button
                  onClick={handleSendToCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer à la caisse
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}