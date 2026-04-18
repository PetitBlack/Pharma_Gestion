import { useState, useEffect, useMemo, useRef } from 'react';
import { CreditCard, Smartphone, Wallet, Printer, CheckCircle, Clock, User, MapPin, Edit, ArrowLeft, Plus, Minus, Trash2, Calculator, Search, Filter, X, Square, CheckSquare, AlertTriangle, Shield, ChevronDown } from 'lucide-react';
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
import { medicineService } from '@/services/medicineService';

interface CaisseViewProps {
  currentUser: UserType | null;
}

// Palette de couleurs pour différencier les auxiliaires
const AUX_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', card: 'bg-blue-50 border-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', card: 'bg-purple-50 border-purple-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', card: 'bg-teal-50 border-teal-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', card: 'bg-pink-50 border-pink-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', card: 'bg-indigo-50 border-indigo-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', card: 'bg-amber-50 border-amber-200' },
];

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

  // Modification
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  // Tiers payant (assurance)
  const [hasTiersPayant, setHasTiersPayant] = useState(false);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insuranceCoverage, setInsuranceCoverage] = useState<string>('');

  // Filtre par auxiliaire
  const [filterAuxiliary, setFilterAuxiliary] = useState<string | null>(null);

  // Checkboxes de vérification par commande : { orderId: boolean[] }
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean[]>>({});

  // Ajout de produit dans le dialogue de modification
  const [addProductSearch, setAddProductSearch] = useState('');
  const [addProductResults, setAddProductResults] = useState<ReturnType<typeof medicineService.search>>([]);
  const addSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPendingOrders(orders.filter(o => o.status === 'En attente'));
    setPaidOrders(orders.filter(o => o.status === 'Payée'));
  }, [orders]);

  // Monnaie
  useEffect(() => {
    if (selectedOrder && amountGiven) {
      const given = parseFloat(amountGiven) || 0;
      setChange(given - selectedOrder.total);
    } else {
      setChange(0);
    }
  }, [amountGiven, selectedOrder]);

  // Recherche produit à ajouter
  useEffect(() => {
    if (addProductSearch.trim().length >= 2) {
      setAddProductResults(medicineService.search(addProductSearch).slice(0, 8));
    } else {
      setAddProductResults([]);
    }
  }, [addProductSearch]);

  // Auxiliaires distincts parmi les commandes en attente
  const auxiliaries = useMemo(() => {
    const names = Array.from(new Set(pendingOrders.map(o => o.auxiliaryName).filter(Boolean)));
    return names.map((name, i) => ({ name, color: AUX_COLORS[i % AUX_COLORS.length] }));
  }, [pendingOrders]);

  const getAuxColor = (name: string) => {
    const aux = auxiliaries.find(a => a.name === name);
    return aux ? aux.color : AUX_COLORS[0];
  };

  // Commandes filtrées
  const filteredPendingOrders = useMemo(() => {
    if (!filterAuxiliary) return pendingOrders;
    return pendingOrders.filter(o => o.auxiliaryName === filterAuxiliary);
  }, [pendingOrders, filterAuxiliary]);

  // Gestion des checkboxes
  const toggleItemVerified = (orderId: string, itemIndex: number, itemCount: number) => {
    setVerifiedItems(prev => {
      const current = prev[orderId] ?? Array(itemCount).fill(false);
      const updated = [...current];
      updated[itemIndex] = !updated[itemIndex];
      return { ...prev, [orderId]: updated };
    });
  };

  const getVerifiedCount = (orderId: string, itemCount: number) => {
    const checks = verifiedItems[orderId] ?? Array(itemCount).fill(false);
    return checks.filter(Boolean).length;
  };

  const handleOpenPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setPaymentMethod('Espèces');
    setAmountGiven('');
    setChange(0);
    setHasTiersPayant(false);
    setInsuranceCompany('');
    setInsuranceCoverage('');
    setIsPaymentDialogOpen(true);
  };

  const handleOpenEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditedItems(order.items.map(i => ({ ...i })));
    setAddProductSearch('');
    setAddProductResults([]);
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updated = [...editedItems];
    updated[index] = {
      ...updated[index],
      quantity: newQuantity,
      total: newQuantity * updated[index].price * (1 - (updated[index].discount ?? 0) / 100)
    };
    setEditedItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length === 1) {
      toast.error('La commande doit contenir au moins un article');
      return;
    }
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleAddProduct = (med: ReturnType<typeof medicineService.getById>) => {
    if (!med) return;
    const exists = editedItems.findIndex(i => i.medicineId === med.id);
    if (exists !== -1) {
      // Incrémenter la quantité si déjà présent
      handleUpdateQuantity(exists, editedItems[exists].quantity + 1);
      toast.success(`Quantité de ${med.name} augmentée`);
    } else {
      const newItem: OrderItem = {
        medicineId: med.id,
        medicineName: med.name,
        quantity: 1,
        price: med.price,
        total: med.price,
      };
      setEditedItems(prev => [...prev, newItem]);
      toast.success(`${med.name} ajouté à la commande`);
    }
    setAddProductSearch('');
    setAddProductResults([]);
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
      updateOrder(selectedOrder.id, {
        ...selectedOrder,
        items: editedItems,
        total: calculateEditedTotal()
      });
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
        cancelOrder(order.id);
        toast.success(`Commande renvoyée vers ${order.auxiliaryName}`);
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors du renvoi');
      }
    }
  };

  const handleDeleteOrder = (order: Order) => {
    if (confirm(`Supprimer définitivement la commande ${order.orderNumber} ?\nCette action est irréversible.`)) {
      try {
        cancelOrder(order.id, currentUser?.id, currentUser?.fullName, 'Supprimée par la caisse');
        // Nettoyer les checkboxes associées
        setVerifiedItems(prev => {
          const next = { ...prev };
          delete next[order.id];
          return next;
        });
        toast.success(`Commande ${order.orderNumber} supprimée`);
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleProcessPayment = () => {
    if (!selectedOrder || !currentUser) return;
    if (paymentMethod === 'Espèces') {
      const given = parseFloat(amountGiven) || 0;
      if (given < selectedOrder.total) {
        toast.error('Le montant donné est insuffisant');
        return;
      }
    }
    try {
      const insuranceInfo = hasTiersPayant && insuranceCompany.trim()
        ? { company: insuranceCompany.trim(), coverage: parseFloat(insuranceCoverage) || 0 }
        : undefined;

      const updatedOrder = processPayment(
        selectedOrder.id,
        paymentMethod,
        currentUser.id,
        currentUser.fullName,
        insuranceInfo
      );
      if (updatedOrder) {
        toast.success('Paiement enregistré avec succès !');
        setIsPaymentDialogOpen(false);
        setReceiptOrder(updatedOrder);
        setShowReceipt(true);
        setAmountGiven('');
        setChange(0);
        // Nettoyer les checkboxes
        setVerifiedItems(prev => {
          const next = { ...prev };
          delete next[selectedOrder.id];
          return next;
        });
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
      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
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
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Commandes en attente</h3>
              <p className="text-sm text-gray-600">Cliquez sur une commande pour encaisser ou modifier</p>
            </div>
            {filterAuxiliary && (
              <Button
                variant="outline" size="sm"
                onClick={() => setFilterAuxiliary(null)}
                className="text-gray-600 gap-1"
              >
                <X className="w-3 h-3" />
                Effacer le filtre
              </Button>
            )}
          </div>

          {/* Filtre par auxiliaire */}
          {auxiliaries.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-500 mr-1">Filtrer :</span>
              {auxiliaries.map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => setFilterAuxiliary(filterAuxiliary === name ? null : name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    filterAuxiliary === name
                      ? `${color.bg} ${color.text} ${color.border} ring-2 ring-offset-1 ring-current`
                      : `${color.bg} ${color.text} ${color.border} opacity-70 hover:opacity-100`
                  }`}
                >
                  {name}
                  <span className="ml-1 font-bold">
                    ({pendingOrders.filter(o => o.auxiliaryName === name).length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 p-6">
          {filteredPendingOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {filterAuxiliary ? `Aucune commande de ${filterAuxiliary}` : 'Aucune commande en attente'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredPendingOrders.map((order, index) => {
                const auxColor = getAuxColor(order.auxiliaryName);
                const itemCount = order.items.length;
                const verifiedCount = getVerifiedCount(order.id, itemCount);
                const allVerified = verifiedCount === itemCount;
                const checks = verifiedItems[order.id] ?? Array(itemCount).fill(false);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${auxColor.card}`}
                  >
                    {/* En-tête commande */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{order.orderNumber}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${auxColor.bg} ${auxColor.text}`}>
                          <User className="w-3 h-3" />
                          {order.auxiliaryName}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {order.workstation}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-orange-600">{order.total.toFixed(2)} FCFA</p>
                      </div>
                    </div>

                    {/* Lignes de commande avec checkboxes */}
                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleItemVerified(order.id, idx, itemCount)}
                          className={`flex items-center justify-between text-sm rounded-lg p-2 cursor-pointer select-none transition-colors ${
                            checks[idx] ? 'bg-green-50 border border-green-200' : 'bg-white border border-transparent hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {checks[idx]
                              ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" />
                              : <Square className="w-4 h-4 text-gray-300 shrink-0" />
                            }
                            <span className={`${checks[idx] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {item.medicineName}
                            </span>
                          </div>
                          <span className={`font-medium ${checks[idx] ? 'text-gray-400' : 'text-gray-900'}`}>
                            {item.quantity} × {item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Barre de progression vérification */}
                    {itemCount > 1 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Vérification</span>
                          <span className={allVerified ? 'text-green-600 font-medium' : ''}>
                            {verifiedCount}/{itemCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${allVerified ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${(verifiedCount / itemCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200/70">
                      <p className="text-xs text-gray-500 mb-3">
                        {new Date(order.createdAt).toLocaleString('fr-FR')}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <Button
                          onClick={() => handleOpenEditDialog(order)}
                          variant="outline"
                          size="sm"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          onClick={() => handleReturnToAuxiliary(order)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
                        >
                          <ArrowLeft className="w-3 h-3 mr-1" />
                          Renvoyer
                        </Button>
                        <Button
                          onClick={() => handleDeleteOrder(order)}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-500 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Suppr.
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleOpenPaymentDialog(order)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        disabled={itemCount > 1 && !allVerified}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {itemCount > 1 && !allVerified
                          ? `Encaisser (${verifiedCount}/${itemCount} vérifiés)`
                          : 'Encaisser'
                        }
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Commandes payées récentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Modifier la commande — {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Infos commande */}
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

              {/* Articles existants */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Articles ({editedItems.length})</p>
                {editedItems.map((item, index) => (
                  <motion.div
                    key={`${item.medicineId}-${index}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.medicineName}</p>
                        <p className="text-sm text-gray-600">{item.price.toFixed(2)} FCFA / unité</p>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={editedItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number" min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline" size="sm"
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

              {/* Ajouter un produit */}
              <div className="border border-dashed border-teal-300 rounded-lg p-4 bg-teal-50/40">
                <p className="text-sm font-medium text-teal-700 mb-2 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Ajouter un produit
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    ref={addSearchRef}
                    type="text"
                    placeholder="Rechercher un médicament..."
                    value={addProductSearch}
                    onChange={(e) => setAddProductSearch(e.target.value)}
                    className="pl-9 bg-white"
                  />
                  {addProductSearch && (
                    <button
                      onClick={() => { setAddProductSearch(''); setAddProductResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {addProductResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 space-y-1 max-h-48 overflow-y-auto"
                    >
                      {addProductResults.map(med => (
                        <button
                          key={med.id}
                          onClick={() => handleAddProduct(med)}
                          className="w-full flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 transition-colors text-left"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{med.name}</span>
                            {med.dosage && <span className="text-gray-500 ml-1">{med.dosage}</span>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-gray-500">Stock: {med.quantity}</span>
                            <span className="font-semibold text-teal-700">{med.price.toFixed(2)} FCFA</span>
                            <Plus className="w-4 h-4 text-teal-500" />
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                  {addProductSearch.length >= 2 && addProductResults.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs text-gray-500 mt-2 text-center py-2"
                    >
                      Aucun produit trouvé pour "{addProductSearch}"
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Total */}
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Nouveau Total</span>
                  <span className="text-2xl font-bold text-teal-600">{calculateEditedTotal().toFixed(2)} FCFA</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditedItems([]);
              setSelectedOrder(null);
              setAddProductSearch('');
              setAddProductResults([]);
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
            <DialogTitle>Encaissement — {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
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

              <div>
                <Label>Mode de paiement</Label>
                <Select value={paymentMethod} onValueChange={(value: OrderPaymentMethod) => setPaymentMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Espèces">
                      <div className="flex items-center gap-2"><Wallet className="w-4 h-4" />Espèces</div>
                    </SelectItem>
                    <SelectItem value="Mobile Money">
                      <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" />Mobile Money</div>
                    </SelectItem>
                    <SelectItem value="Autre">
                      <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" />Autre</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tiers payant */}
              <div className="border border-dashed border-blue-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHasTiersPayant(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-blue-50 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium text-blue-700">
                    <Shield className="w-4 h-4" />
                    Tiers payant (assurance / mutuelle)
                  </span>
                  <ChevronDown className={`w-4 h-4 text-blue-500 transition-transform ${hasTiersPayant ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {hasTiersPayant && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 space-y-3 bg-blue-50/50"
                    >
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Compagnie d'assurance</Label>
                          <Input
                            placeholder="Ex: CNSS, CARFO, AME..."
                            value={insuranceCompany}
                            onChange={e => setInsuranceCompany(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Montant pris en charge (FCFA)
                          </Label>
                          <Input
                            type="number" min="0"
                            placeholder="0"
                            value={insuranceCoverage}
                            onChange={e => setInsuranceCoverage(e.target.value)}
                          />
                        </div>
                      </div>
                      {selectedOrder && insuranceCoverage && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-blue-100 rounded px-2 py-1.5 text-center">
                            <p className="text-gray-500">Part assurance</p>
                            <p className="font-bold text-blue-700">
                              {Math.min(parseFloat(insuranceCoverage) || 0, selectedOrder.total).toLocaleString('fr-FR')} F
                            </p>
                          </div>
                          <div className="bg-white rounded px-2 py-1.5 text-center border border-blue-100">
                            <p className="text-gray-500">Part client</p>
                            <p className="font-bold text-gray-800">
                              {Math.max(0, selectedOrder.total - (parseFloat(insuranceCoverage) || 0)).toLocaleString('fr-FR')} F
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {paymentMethod === 'Espèces' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amountGiven">Montant donné par le client</Label>
                    <div className="relative mt-2">
                      <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="amountGiven"
                        type="number" min="0" step="0.01"
                        value={amountGiven}
                        onChange={(e) => setAmountGiven(e.target.value)}
                        placeholder="Entrez le montant..."
                        className="pl-10 text-lg"
                      />
                    </div>
                  </div>

                  {amountGiven && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg p-4 ${change >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          {change >= 0 ? 'Monnaie à rendre' : 'Montant insuffisant'}
                        </span>
                        <span className={`text-2xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Dialog ticket de caisse */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket de caisse</DialogTitle>
          </DialogHeader>

          {receiptOrder && (
            <div id="receipt" className="py-4 space-y-4">
              <div className="text-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">{settingsService.get().pharmacyName}</h2>
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
                {receiptOrder.insuranceCompany && (
                  <>
                    <div className="flex justify-between text-blue-700 font-medium pt-1 border-t border-gray-200 mt-1">
                      <span>Assurance:</span>
                      <span>{receiptOrder.insuranceCompany}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Part assurance:</span>
                      <span>{(receiptOrder.insuranceCoverage ?? 0).toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Part client:</span>
                      <span>{Math.max(0, receiptOrder.total - (receiptOrder.insuranceCoverage ?? 0)).toLocaleString('fr-FR')} F</span>
                    </div>
                  </>
                )}
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
