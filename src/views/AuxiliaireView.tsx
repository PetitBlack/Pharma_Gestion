import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, ShoppingCart, Trash2, Send, Clock, CheckCircle,
  XCircle, MapPin, Pause, Play, User as UserIcon, X, Minus,
  Percent, KeyRound, FileText, Undo2, Lock, KeySquare, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useOrders } from '@/controllers/orderController';
import { medicineService } from '@/services/medicineService';
import { prescriptionService } from '@/services/prescriptionService';
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

const SHORTCUTS = [
  { key: 'F1', label: 'Mettre le focus sur la recherche' },
  { key: '↑ / ↓', label: 'Naviguer dans les résultats' },
  { key: 'Entrée', label: 'Sélectionner / Ajouter au panier' },
  { key: 'Échap', label: 'Annuler la sélection' },
  { key: 'F3', label: 'Mettre la commande en attente' },
  { key: 'F4', label: 'Envoyer à la caisse' },
  { key: '+ / -', label: 'Augmenter / diminuer la quantité' },
  { key: '?', label: 'Afficher / masquer les raccourcis' },
];

export function AuxiliaireView({ currentUser }: AuxiliaireViewProps) {
  const { createOrder, recallOrder, getOrdersByAuxiliary, orders } = useOrders();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Client & commandes en attente
  const [clientName, setClientName] = useState('');
  const [showClientInput, setShowClientInput] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [showPendingOrders, setShowPendingOrders] = useState(false);

  // Raccourcis
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ordonnancier
  const [prescriptionModal, setPrescriptionModal] = useState<{
    medicine: Medicine;
    quantity: number;
  } | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: '',
    doctorName: '',
    doctorRegistration: '',
    prescriptionNumber: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    dosage: '',
    notes: '',
  });

  useEffect(() => {
    setMedicines(medicineService.getAll());
    const saved = localStorage.getItem(`pending_orders_${currentUser?.id}`);
    if (saved) {
      try { setPendingOrders(JSON.parse(saved)); } catch {}
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) setMyOrders(getOrdersByAuxiliary(currentUser.id));
  }, [orders, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`pending_orders_${currentUser.id}`, JSON.stringify(pendingOrders));
    }
  }, [pendingOrders, currentUser]);

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    med.quantity > 0
  );

  // --- Panier ---

  const calculateTotal = useCallback(() =>
    cart.reduce((sum, item) => sum + item.total, 0), [cart]);

  const calculateSubtotal = useCallback(() =>
    cart.reduce((sum, item) => sum + item.quantity * item.price, 0), [cart]);

  const calculateDiscountTotal = useCallback(() =>
    calculateSubtotal() - calculateTotal(), [calculateSubtotal, calculateTotal]);

  const updateCartQty = (medicineId: string, newQty: number) => {
    if (newQty < 1) return;
    const med = medicines.find(m => m.id === medicineId);
    if (med && newQty > med.quantity) {
      toast.error('Stock insuffisant');
      return;
    }
    setCart(prev => prev.map(item =>
      item.medicineId === medicineId
        ? { ...item, quantity: newQty, total: +(newQty * item.price * (1 - (item.discount || 0) / 100)).toFixed(2) }
        : item
    ));
  };

  const updateCartDiscount = (medicineId: string, discount: number) => {
    const d = Math.max(0, Math.min(100, isNaN(discount) ? 0 : discount));
    setCart(prev => prev.map(item =>
      item.medicineId === medicineId
        ? { ...item, discount: d, total: +(item.quantity * item.price * (1 - d / 100)).toFixed(2) }
        : item
    ));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  const addItemToCart = (medicine: Medicine, qty: number, prescriptionId?: string) => {
    if (qty > medicine.quantity) {
      toast.error('Stock insuffisant');
      return;
    }
    const existing = cart.find(i => i.medicineId === medicine.id);
    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > medicine.quantity) { toast.error('Stock insuffisant'); return; }
      setCart(prev => prev.map(item =>
        item.medicineId === medicine.id
          ? { ...item, quantity: newQty, total: +(newQty * item.price * (1 - (item.discount || 0) / 100)).toFixed(2) }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        medicineId: medicine.id,
        medicineName: medicine.name,
        quantity: qty,
        price: medicine.price,
        total: +(qty * medicine.price).toFixed(2),
        discount: 0,
        prescriptionId,
      }]);
    }
    setSelectedMedicine(null);
    setQuantity(1);
    setSearchQuery('');
    setHighlightedIndex(-1);
    toast.success(`${medicine.name} ajouté`);
  };

  const handleSelectMedicine = (medicine: Medicine) => {
    if (medicine.requiresPrescription) {
      setPrescriptionModal({ medicine, quantity: 1 });
      setPrescriptionForm({
        patientName: clientName,
        doctorName: '',
        doctorRegistration: '',
        prescriptionNumber: '',
        prescriptionDate: new Date().toISOString().split('T')[0],
        dosage: '',
        notes: '',
      });
    } else {
      setSelectedMedicine(medicine);
    }
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleAddToCart = () => {
    if (!selectedMedicine) return;
    addItemToCart(selectedMedicine, quantity);
  };

  // --- Ordonnancier ---

  const handleConfirmPrescription = () => {
    if (!prescriptionModal) return;
    if (!prescriptionForm.patientName || !prescriptionForm.doctorName) {
      toast.error('Nom du patient et médecin requis');
      return;
    }
    const prescription = prescriptionService.add({
      patientName: prescriptionForm.patientName,
      doctorName: prescriptionForm.doctorName,
      doctorRegistration: prescriptionForm.doctorRegistration || undefined,
      prescriptionNumber: prescriptionForm.prescriptionNumber || undefined,
      prescriptionDate: prescriptionForm.prescriptionDate,
      deliveredAt: new Date().toISOString(),
      medicines: [{
        medicineId: prescriptionModal.medicine.id,
        medicineName: prescriptionModal.medicine.name,
        quantity: prescriptionModal.quantity,
        dosage: prescriptionForm.dosage || undefined,
      }],
      notes: prescriptionForm.notes || undefined,
      auxiliaryId: currentUser?.id || '',
      auxiliaryName: currentUser?.fullName || '',
    });
    addItemToCart(prescriptionModal.medicine, prescriptionModal.quantity, prescription.id);
    setPrescriptionModal(null);
    toast.success('Ordonnance enregistrée');
  };

  // --- Commandes en attente locales ---

  const handlePutOnHold = useCallback(() => {
    if (cart.length === 0) { toast.error('Le panier est vide'); return; }
    const client = clientName.trim() || 'Client sans nom';
    setPendingOrders(prev => [...prev, {
      id: `pending_${Date.now()}`,
      clientName: client,
      items: [...cart],
      createdAt: new Date(),
      total: calculateTotal(),
    }]);
    setCart([]);
    setClientName('');
    setShowClientInput(false);
    toast.success(`Commande mise en attente pour ${client}`);
  }, [cart, clientName, calculateTotal]);

  const handleResumePendingOrder = (order: PendingOrder) => {
    if (cart.length > 0) { toast.error('Veuillez vider ou mettre en attente la commande actuelle'); return; }
    setCart(order.items);
    setClientName(order.clientName);
    setShowClientInput(true);
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setShowPendingOrders(false);
    toast.success(`Commande de ${order.clientName} reprise`);
  };

  const handleDeletePendingOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // --- Rappel de commande envoyée à la caisse ---

  const handleRecallOrder = (orderId: string) => {
    if (cart.length > 0) {
      toast.error('Veuillez vider ou mettre en attente la commande actuelle avant de rappeler');
      return;
    }
    const items = recallOrder(orderId, currentUser?.id, currentUser?.fullName);
    if (items) {
      setCart(items);
      toast.success('Commande récupérée depuis la caisse');
    } else {
      toast.error('Impossible de récupérer cette commande (déjà encaissée ?)');
    }
  };

  // --- Envoi à la caisse ---

  const handleSendToCheckout = useCallback(() => {
    if (cart.length === 0) { toast.error('Le panier est vide'); return; }
    if (!currentUser) { toast.error('Utilisateur non authentifié'); return; }
    try {
      const order = createOrder(cart, currentUser.id, currentUser.fullName, currentUser.workstation || 'Poste non défini');
      // Lier les ordonnances à la commande
      cart.forEach(item => {
        if (item.prescriptionId) prescriptionService.linkToOrder(item.prescriptionId, order.id);
      });
      toast.success('Commande envoyée à la caisse');
      setCart([]);
      setClientName('');
      setShowClientInput(false);
    } catch {
      toast.error('Erreur lors de l\'envoi');
    }
  }, [cart, currentUser, createOrder]);

  // --- Raccourcis clavier ---

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedMedicine(null);
        setSearchQuery('');
        setHighlightedIndex(-1);
        setPrescriptionModal(null);
        setShowShortcuts(false);
        return;
      }
      if (e.key === 'F3') { e.preventDefault(); handlePutOnHold(); return; }
      if (e.key === 'F4') { e.preventDefault(); handleSendToCheckout(); return; }
      if (e.key === '?' && !isTyping) { setShowShortcuts(v => !v); return; }

      if (searchQuery) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex(i => Math.min(i + 1, Math.min(filteredMedicines.length - 1, 9)));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex(i => Math.max(i - 1, 0));
        }
        if (e.key === 'Enter' && highlightedIndex >= 0) {
          const med = filteredMedicines[highlightedIndex];
          if (med) handleSelectMedicine(med);
          return;
        }
      }

      if (e.key === 'Enter' && selectedMedicine && !isTyping) {
        handleAddToCart();
        return;
      }

      if (!isTyping && selectedMedicine) {
        if (e.key === '+' || e.key === '=') {
          setQuantity(q => Math.min(q + 1, selectedMedicine.quantity));
        }
        if (e.key === '-') {
          setQuantity(q => Math.max(q - 1, 1));
        }
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [searchQuery, highlightedIndex, selectedMedicine, filteredMedicines, handlePutOnHold, handleSendToCheckout]);

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
      case 'En attente': return <Clock className="w-3.5 h-3.5" />;
      case 'Payée': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'Annulée': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const discountTotal = subtotal - total;

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">

      {/* ── En-tête ── */}
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
            <p className="text-sm text-gray-500">{currentUser?.fullName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Commandes</p>
              <p className="text-xl font-bold text-teal-600">{myOrders.length}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPendingOrders(true)}
              className={`relative ${pendingOrders.length > 0 ? 'border-orange-300 text-orange-600' : ''}`}
            >
              <Pause className="w-4 h-4 mr-1" />
              En pause
              {pendingOrders.length > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {pendingOrders.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcuts(v => !v)}
              className="text-gray-400 hover:text-gray-600"
              title="Raccourcis clavier (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Raccourcis clavier overlay ── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                Raccourcis clavier
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-semibold text-gray-700 whitespace-nowrap">
                    {s.key}
                  </kbd>
                  <span className="text-sm text-gray-600">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal commandes en pause ── */}
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
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Commandes en pause</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowPendingOrders(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {pendingOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucune commande en pause</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <UserIcon className="w-4 h-4 text-teal-600" />
                              <p className="font-semibold text-gray-900">{order.clientName}</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <p className="font-bold text-teal-600">{order.total.toFixed(2)} FCFA</p>
                        </div>
                        <div className="mb-3 space-y-1">
                          {order.items.map(item => (
                            <div key={item.medicineId} className="flex justify-between text-sm">
                              <span className="text-gray-700">{item.medicineName}</span>
                              <span className="text-gray-500">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleResumePendingOrder(order)} className="flex-1 bg-teal-600 hover:bg-teal-700" size="sm">
                            <Play className="w-4 h-4 mr-2" />Reprendre
                          </Button>
                          <Button onClick={() => handleDeletePendingOrder(order.id)} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Ordonnancier ── */}
      <AnimatePresence>
        {prescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ordonnancier électronique</h2>
                  <p className="text-sm text-amber-700 font-medium">{prescriptionModal.medicine.name} — Produit sous ordonnance</p>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="pxPatient">Nom du patient *</Label>
                    <Input
                      id="pxPatient"
                      value={prescriptionForm.patientName}
                      onChange={e => setPrescriptionForm(f => ({ ...f, patientName: e.target.value }))}
                      placeholder="Prénom Nom du patient"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pxDoctor">Médecin prescripteur *</Label>
                    <Input
                      id="pxDoctor"
                      value={prescriptionForm.doctorName}
                      onChange={e => setPrescriptionForm(f => ({ ...f, doctorName: e.target.value }))}
                      placeholder="Dr. Nom Prénom"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pxReg">N° RPPS / Ordre</Label>
                    <Input
                      id="pxReg"
                      value={prescriptionForm.doctorRegistration}
                      onChange={e => setPrescriptionForm(f => ({ ...f, doctorRegistration: e.target.value }))}
                      placeholder="RPPS123456"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pxNum">N° ordonnance</Label>
                    <Input
                      id="pxNum"
                      value={prescriptionForm.prescriptionNumber}
                      onChange={e => setPrescriptionForm(f => ({ ...f, prescriptionNumber: e.target.value }))}
                      placeholder="Ex: ORD-2026-001"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pxDate">Date de l'ordonnance</Label>
                    <Input
                      id="pxDate"
                      type="date"
                      value={prescriptionForm.prescriptionDate}
                      onChange={e => setPrescriptionForm(f => ({ ...f, prescriptionDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pxQty">Quantité délivrée</Label>
                    <Input
                      id="pxQty"
                      type="number"
                      min={1}
                      max={prescriptionModal.medicine.quantity}
                      value={prescriptionModal.quantity}
                      onChange={e => setPrescriptionModal(m => m ? { ...m, quantity: parseInt(e.target.value) || 1 } : m)}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="pxDosage">Posologie / instructions</Label>
                    <Input
                      id="pxDosage"
                      value={prescriptionForm.dosage}
                      onChange={e => setPrescriptionForm(f => ({ ...f, dosage: e.target.value }))}
                      placeholder="Ex: 1 cp matin et soir pendant 7 jours"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="pxNotes">Observations</Label>
                    <Input
                      id="pxNotes"
                      value={prescriptionForm.notes}
                      onChange={e => setPrescriptionForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Observations particulières..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setPrescriptionModal(null)}>Annuler</Button>
                <Button onClick={handleConfirmPrescription} className="bg-amber-600 hover:bg-amber-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Enregistrer et ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* ─ Gauche: Recherche + Sélection + Commandes ─ */}
        <div className="col-span-2 space-y-4">

          {/* Recherche */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un médicament…  (F1)"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setHighlightedIndex(-1); }}
                className="pl-10"
              />
            </div>

            <AnimatePresence>
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 max-h-80 overflow-y-auto space-y-1"
                >
                  {filteredMedicines.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun médicament trouvé</p>
                  ) : (
                    filteredMedicines.slice(0, 10).map((medicine, index) => (
                      <button
                        key={medicine.id}
                        onClick={() => handleSelectMedicine(medicine)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                          index === highlightedIndex
                            ? 'bg-teal-50 border border-teal-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{medicine.name}</p>
                            {medicine.requiresPrescription && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium shrink-0">
                                <Lock className="w-2.5 h-2.5" />
                                Ordonnance
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-gray-500">{medicine.category}</p>
                            {medicine.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-teal-500" />
                                <p className="text-xs text-teal-600">{medicine.location}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="font-semibold text-teal-600 text-sm">{medicine.price.toFixed(2)} FCFA</p>
                          <p className="text-xs text-gray-500">Stock: {medicine.quantity}</p>
                        </div>
                      </button>
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
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{selectedMedicine.name}</h3>
                    <p className="text-sm text-gray-500">{selectedMedicine.category}</p>
                    {selectedMedicine.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-500" />
                        <p className="text-xs text-teal-600">{selectedMedicine.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-teal-600">{selectedMedicine.price.toFixed(2)} FCFA</p>
                    <p className="text-xs text-gray-500">Dispo: {selectedMedicine.quantity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={selectedMedicine.quantity}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center"
                    />
                    <Button variant="outline" size="sm" onClick={() => setQuantity(q => Math.min(selectedMedicine.quantity, q + 1))} disabled={quantity >= selectedMedicine.quantity}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 flex-1">
                    = <span className="font-semibold text-gray-900">{(quantity * selectedMedicine.price).toFixed(2)} FCFA</span>
                  </p>
                  <Button onClick={handleAddToCart} className="bg-teal-600 hover:bg-teal-700" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter  <kbd className="ml-1 text-teal-200 text-xs">↵</kbd>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMedicine(null)} className="text-gray-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mes commandes récentes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Mes commandes</h3>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {myOrders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">Aucune commande</p>
              ) : (
                myOrders.slice(0, 15).map(order => (
                  <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.items.length} article(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-gray-900">{order.total.toFixed(2)} FCFA</p>
                      {order.status === 'En attente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRecallOrder(order.id)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                          title="Récupérer cette commande"
                        >
                          <Undo2 className="w-3.5 h-3.5 mr-1" />
                          Rappeler
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* ─ Droite: Panier ─ */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky top-4"
          >
            {/* Header panier */}
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-semibold text-gray-900">Panier</h3>
              <span className="ml-auto text-xs text-gray-500">{cart.length} article(s)</span>
            </div>

            {/* Client */}
            <div className="mb-3 pb-3 border-b border-gray-100">
              {!showClientInput ? (
                <Button variant="outline" size="sm" onClick={() => setShowClientInput(true)} className="w-full text-xs">
                  <UserIcon className="w-3.5 h-3.5 mr-1" />
                  Ajouter un client
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nom du client..."
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => { setShowClientInput(false); setClientName(''); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Lignes panier */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Panier vide</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map(item => {
                    const originalLine = +(item.quantity * item.price).toFixed(2);
                    const hasDiscount = (item.discount || 0) > 0;
                    return (
                      <motion.div
                        key={item.medicineId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-lg p-2.5 space-y-2"
                      >
                        {/* Nom + supprimer */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 leading-snug truncate">
                              {item.medicineName}
                            </p>
                            {item.prescriptionId && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <Lock className="w-2.5 h-2.5" />Ordonnance
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.medicineId)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0 shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Quantité + remise */}
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                            onClick={() => updateCartQty(item.medicineId, item.quantity - 1)}
                            disabled={item.quantity <= 1}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number" min={1}
                            value={item.quantity}
                            onChange={e => updateCartQty(item.medicineId, parseInt(e.target.value) || 1)}
                            className="h-6 w-10 text-center text-xs px-1"
                          />
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                            onClick={() => updateCartQty(item.medicineId, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>

                          <div className="flex items-center gap-0.5 ml-auto">
                            <Percent className="w-3 h-3 text-gray-400" />
                            <Input
                              type="number" min={0} max={100}
                              value={item.discount || ''}
                              onChange={e => updateCartDiscount(item.medicineId, parseFloat(e.target.value))}
                              placeholder="0"
                              className="h-6 w-12 text-center text-xs px-1"
                              title="Remise %"
                            />
                          </div>
                        </div>

                        {/* Prix */}
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-400">
                            {item.quantity} × {item.price.toFixed(2)}
                          </p>
                          <div className="text-right">
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through">{originalLine.toFixed(2)}</p>
                            )}
                            <p className={`text-sm font-semibold ${hasDiscount ? 'text-green-600' : 'text-gray-900'}`}>
                              {item.total.toFixed(2)} FCFA
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Total */}
            {cart.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                {discountTotal > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2)} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remises</span>
                      <span>-{discountTotal.toFixed(2)} FCFA</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-bold text-teal-600"
                  >
                    {total.toFixed(2)} FCFA
                  </motion.span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 space-y-2">
              <Button
                onClick={handlePutOnHold}
                disabled={cart.length === 0}
                variant="outline"
                size="sm"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                En pause
                <kbd className="ml-auto text-orange-300 text-xs">F3</kbd>
              </Button>
              <Button
                onClick={handleSendToCheckout}
                disabled={cart.length === 0}
                className="w-full bg-teal-600 hover:bg-teal-700"
                size="sm"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Envoyer à la caisse
                <kbd className="ml-auto text-teal-200 text-xs">F4</kbd>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
