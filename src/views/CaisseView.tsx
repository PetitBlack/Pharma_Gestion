import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Printer, CheckCircle, Clock, User, MapPin, Edit, ArrowLeft, Plus, Minus, Trash2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {Button} from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { useOrders } from '@/controllers/orderController';
import type { Order, OrderPaymentMethod, OrderItem } from '@/models/Order';
import type { User as UserType } from '@/models/User';
import { toast } from 'sonner';
import { settingsService } from '@/services/settingsService';

interface CaisseViewProps {
  currentUser: UserType | null;
}

export function CaisseView({ currentUser }: CaisseViewProps) {
  const { orders, processPayment, updateOrder, cancelOrder } = useOrders();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('Espèces');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  
  // Nouveaux états pour la modification et la monnaie
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    setPendingOrders(orders.filter(o => o.status === 'En attente'));
    setPaidOrders(orders.filter(o => o.status === 'Payée'));
  }, [orders]);

  // Calculer la monnaie automatiquement
  useEffect(() => {
    if (selectedOrder && amountGiven) {
      const given = parseFloat(amountGiven) || 0;
      const total = selectedOrder.total;
      setChange(given - total);
    } else {
      setChange(0);
    }
  }, [amountGiven, selectedOrder]);

  const handleOpenPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setPaymentMethod('Espèces');
    setAmountGiven('');
    setChange(0);
    setIsPaymentDialogOpen(true);
  };

  const handleOpenEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditedItems([...order.items]);
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updated = [...editedItems];
    updated[index].quantity = newQuantity;
    updated[index].total = newQuantity * updated[index].price;
    setEditedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length === 1) {
      toast.error('La commande doit contenir au moins un article');
      return;
    }
    
    const updated = editedItems.filter((_, i) => i !== index);
    setEditedItems(updated);
  };

  const calculateEditedTotal = () => {
    return editedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSaveEdit = () => {
    if (!selectedOrder || editedItems.length === 0) {
      toast.error('La commande doit contenir au moins un article');
      return;
    }

    try {
      const updatedOrder: Order = {
        ...selectedOrder,
        items: editedItems,
        total: calculateEditedTotal()
      };

      updateOrder(selectedOrder.id, updatedOrder);
      toast.success('Commande modifiée avec succès');
      setIsEditDialogOpen(false);
      setSelectedOrder(null);
      setEditedItems([]);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleReturnToAuxiliary = (order: Order) => {
    if (confirm(`Renvoyer la commande ${order.orderNumber} vers ${order.auxiliaryName} ?`)) {
      try {
        // Annuler la commande actuelle et créer une notification
        cancelOrder(order.id);
        toast.success(`Commande renvoyée vers ${order.auxiliaryName}`);
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors du renvoi');
      }
    }
  };

  const handleProcessPayment = () => {
    if (!selectedOrder || !currentUser) return;

    // Vérifier si le montant donné est suffisant pour les espèces
    if (paymentMethod === 'Espèces') {
      const given = parseFloat(amountGiven) || 0;
      if (given < selectedOrder.total) {
        toast.error('Le montant donné est insuffisant');
        return;
      }
    }

    try {
      const updatedOrder = processPayment(
        selectedOrder.id,
        paymentMethod,
        currentUser.id,
        currentUser.fullName
      );

      if (updatedOrder) {
        toast.success('Paiement enregistré avec succès !');
        setIsPaymentDialogOpen(false);
        setReceiptOrder(updatedOrder);
        setShowReceipt(true);
        setAmountGiven('');
        setChange(0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du paiement');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
    setShowReceipt(false);
    setReceiptOrder(null);
  };

  const getTodayRevenue = () => {
    return paidOrders
      .filter(o => {
        const orderDate = new Date(o.paidAt || o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0);
  };

  const getTodayOrdersCount = () => {
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const today = new Date();
      return orderDate.toDateString() === today.toDateString();
    }).length;
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes en attente</p>
              <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes aujourd'hui</p>
              <p className="text-3xl font-bold text-blue-600">{getTodayOrdersCount()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recettes aujourd'hui</p>
              <p className="text-3xl font-bold text-green-600">{getTodayRevenue().toFixed(2)} FCFA</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Commandes en attente */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Commandes en attente</h3>
          <p className="text-sm text-gray-600">Cliquez sur une commande pour encaisser ou modifier</p>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6">
          {pendingOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande en attente</p>
            </div>
          ) : (
            <AnimatePresence>
              {pendingOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-orange-200 bg-orange-50 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        {order.auxiliaryName}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.workstation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-orange-600">{order.total.toFixed(2)} FCFA</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white rounded-lg p-2">
                        <span className="text-gray-700">{item.medicineName}</span>
                        <span className="text-gray-900 font-medium">
                          {item.quantity} × {item.price.toFixed(2)} FCFA
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-orange-200">
                    <p className="text-xs text-gray-500 mb-3">
                      {new Date(order.createdAt).toLocaleString('fr-FR')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleOpenEditDialog(order)}
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleReturnToAuxiliary(order)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Renvoyer
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleOpenPaymentDialog(order)}
                      className="w-full mt-2 bg-orange-600 hover:bg-orange-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Encaisser
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Commandes payées récentes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Commandes payées récentes</h3>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {paidOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande payée</p>
            </div>
          ) : (
            paidOrders.slice(0, 20).map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.auxiliaryName} · {order.workstation}</p>
                      <p className="text-xs text-gray-500">
                        Payé: {order.paidAt ? new Date(order.paidAt).toLocaleString('fr-FR') : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{order.total.toFixed(2)} FCFA</p>
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                    <p className="text-xs text-gray-500">Par: {order.cashierName}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Dialog de modification de commande */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la commande - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Auxiliaire:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.auxiliaryName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Poste:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.workstation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {editedItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.medicineName}</p>
                        <p className="text-sm text-gray-600">{item.price.toFixed(2)} FCFA / unité</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={editedItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-lg font-bold text-teal-600">{item.total.toFixed(2)} FCFA</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Nouveau Total</span>
                  <span className="text-2xl font-bold text-teal-600">{calculateEditedTotal().toFixed(2)} FCFA</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditedItems([]);
              setSelectedOrder(null);
            }}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} className="bg-teal-600 hover:bg-teal-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encaissement - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Détails de la commande */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Auxiliaire:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.auxiliaryName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Poste:</p>
                    <p className="font-medium text-gray-900">{selectedOrder.workstation}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.medicineName}</span>
                      <span className="text-gray-900 font-medium">
                        {item.quantity} × {item.price.toFixed(2)} FCFA = {item.total.toFixed(2)} FCFA
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total à payer</span>
                    <span className="text-2xl font-bold text-teal-600">{selectedOrder.total.toFixed(2)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Sélection mode de paiement */}
              <div>
                <Label>Mode de paiement</Label>
                <Select value={paymentMethod} onValueChange={(value: OrderPaymentMethod) => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        Espèces
                      </div>
                    </SelectItem>
                    <SelectItem value="Mobile Money">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="Autre">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Autre
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Calcul de la monnaie (pour espèces uniquement) */}
              {paymentMethod === 'Espèces' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amountGiven">Montant donné par le client</Label>
                    <div className="relative mt-2">
                      <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="amountGiven"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountGiven}
                        onChange={(e) => setAmountGiven(e.target.value)}
                        placeholder="Entrez le montant..."
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  {amountGiven && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg p-4 ${
                        change >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {change >= 0 ? 'Monnaie à rendre' : 'Montant insuffisant'}
                        </span>
                        <span className={`text-2xl font-bold ${
                          change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(change).toFixed(2)} FCFA
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsPaymentDialogOpen(false);
              setAmountGiven('');
              setChange(0);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleProcessPayment} 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={paymentMethod === 'Espèces' && change < 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de ticket de caisse */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket de caisse</DialogTitle>
          </DialogHeader>

          {receiptOrder && (
            <div id="receipt" className="py-4 space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {settingsService.get().pharmacyName}
                </h2>
                <p className="text-sm text-gray-600">{settingsService.get().address}</p>
                <p className="text-sm text-gray-600">{settingsService.get().phone}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">N° Ticket:</span>
                  <span className="font-semibold">{receiptOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(receiptOrder.paidAt!).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heure:</span>
                  <span>{new Date(receiptOrder.paidAt!).toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-3 space-y-2">
                {receiptOrder.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-medium">
                      <span>{item.medicineName}</span>
                      <span>{item.total.toFixed(2)} FCFA</span>
                    </div>
                    <div className="text-xs text-gray-600 pl-2">
                      {item.quantity} × {item.price.toFixed(2)} FCFA
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-lg font-bold flex justify-between">
                <span>TOTAL</span>
                <span>{receiptOrder.total.toFixed(2)} FCFA</span>
              </div>

              <div className="text-sm space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span>Mode de paiement:</span>
                  <span className="font-medium">{receiptOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Caissier:</span>
                  <span>{receiptOrder.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auxiliaire:</span>
                  <span>{receiptOrder.auxiliaryName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Poste:</span>
                  <span>{receiptOrder.workstation}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>Merci de votre visite</p>
                <p>À bientôt !</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>Fermer</Button>
            <Button onClick={handlePrintReceipt} className="bg-teal-600 hover:bg-teal-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}