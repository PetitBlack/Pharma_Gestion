import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Package, History, 
  TrendingUp, DollarSign, Clock, CheckCircle, 
  XCircle, Star, Phone, Mail, MapPin, Building2,
  FileText, Eye, X, Calendar, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supplierService } from '@/services/fournisseurs';
import type { Supplier, SupplierOrder } from '@/models/fournisseurs';
import type { User } from '@/models/User';
import { toast } from 'sonner';

interface SuppliersViewProps {
  currentUser: User | null;
}

type ViewMode = 'list' | 'add' | 'edit' | 'details';

export function SuppliersView({ currentUser }: SuppliersViewProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | Supplier['status']>('all');

  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Burkina Faso',
    taxId: '',
    paymentTerms: '30 jours',
    category: [] as string[],
    status: 'Actif' as Supplier['status'],
    rating: 5,
    notes: ''
  });

  const [categoryInput, setCategoryInput] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    setSuppliers(supplierService.getAll());
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.category.includes(categoryInput.trim())) {
      setFormData({
        ...formData,
        category: [...formData.category, categoryInput.trim()]
      });
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      category: formData.category.filter(c => c !== cat)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Burkina Faso',
      taxId: '',
      paymentTerms: '30 jours',
      category: [],
      status: 'Actif',
      rating: 5,
      notes: ''
    });
    setCategoryInput('');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.companyName || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (viewMode === 'add') {
      supplierService.create(formData);
      toast.success('Fournisseur ajouté avec succès');
    } else if (viewMode === 'edit' && selectedSupplier) {
      supplierService.update(selectedSupplier.id, formData);
      toast.success('Fournisseur modifié avec succès');
    }

    loadSuppliers();
    resetForm();
    setViewMode('list');
    setSelectedSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      companyName: supplier.companyName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms,
      category: supplier.category,
      status: supplier.status,
      rating: supplier.rating,
      notes: supplier.notes || ''
    });
    setViewMode('edit');
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      supplierService.delete(id);
      loadSuppliers();
      toast.success('Fournisseur supprimé');
    }
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setViewMode('details');
  };

  const getStatusColor = (status: Supplier['status']) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-700';
      case 'Inactif': return 'bg-gray-100 text-gray-700';
      case 'Suspendu': return 'bg-red-100 text-red-700';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Vue Liste
  if (viewMode === 'list') {
    return (
      <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
              <p className="text-sm text-gray-600 mt-1">
                {suppliers.length} fournisseur(s) enregistré(s)
              </p>
            </div>
            <Button
              onClick={() => setViewMode('add')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>
        </motion.div>

        {/* Filtres et recherche */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, entreprise, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={filterStatus === 'Actif' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('Actif')}
                size="sm"
                className={filterStatus === 'Actif' ? 'bg-green-600' : ''}
              >
                Actifs
              </Button>
              <Button
                variant={filterStatus === 'Inactif' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('Inactif')}
                size="sm"
              >
                Inactifs
              </Button>
              <Button
                variant={filterStatus === 'Suspendu' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('Suspendu')}
                size="sm"
                className={filterStatus === 'Suspendu' ? 'bg-red-600' : ''}
              >
                Suspendus
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Liste des fournisseurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun fournisseur trouvé</p>
            </div>
          ) : (
            filteredSuppliers.map((supplier, index) => (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.companyName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}>
                    {supplier.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.city}</span>
                  </div>
                </div>

                <div className="mb-4">
                  {renderStars(supplier.rating)}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {supplier.category.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                  {supplier.category.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{supplier.category.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(supplier)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Vue Ajout/Édition
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {viewMode === 'add' ? 'Nouveau Fournisseur' : 'Modifier Fournisseur'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode('list');
                resetForm();
                setSelectedSupplier(null);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Informations générales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du contact *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Koné Mamadou"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Ex: Pharma Distribution BF"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@entreprise.bf"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+226 70 12 34 56"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Numéro fiscal (IFU)</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="IFU001234567"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                  <select
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="À la livraison">À la livraison</option>
                    <option value="15 jours">15 jours</option>
                    <option value="30 jours">30 jours</option>
                    <option value="60 jours">60 jours</option>
                    <option value="90 jours">90 jours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Adresse
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Avenue Kwamé N'Krumah"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Ouagadougou"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Catégories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                Catégories de produits
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Ex: Antibiotiques, Vitamines..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddCategory} type="button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.category.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.category.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full flex items-center gap-2 text-sm"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="hover:text-teal-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statut et Notation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Supplier['status'] })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
              <div>
                <Label htmlFor="rating">Note (1-5)</Label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      <Star
                        className={`w-6 h-6 cursor-pointer ${
                          star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes additionnelles..."
                rows={4}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                resetForm();
                setSelectedSupplier(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {viewMode === 'add' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Vue Détails avec Historique
  if (viewMode === 'details' && selectedSupplier) {
    const stats = supplierService.getSupplierStats(selectedSupplier.id);
    const orders = supplierService.getOrdersBySupplierId(selectedSupplier.id);
    const payments = supplierService.getPaymentsBySupplierId(selectedSupplier.id);

    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedSupplier.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSupplier.status)}`}>
                    {selectedSupplier.status}
                  </span>
                </div>
                <p className="text-lg text-gray-600">{selectedSupplier.companyName}</p>
                <div className="mt-3">
                  {renderStars(selectedSupplier.rating)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(selectedSupplier)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    setSelectedSupplier(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Commandes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Dépensé</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSpent.toFixed(0)} F</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commandes Livrées</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En Attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations de contact */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedSupplier.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedSupplier.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedSupplier.address}<br />
                      {selectedSupplier.city}, {selectedSupplier.country}
                    </p>
                  </div>
                </div>
                {selectedSupplier.taxId && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">IFU</p>
                      <p className="text-sm font-medium text-gray-900">{selectedSupplier.taxId}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Conditions de paiement</p>
                    <p className="text-sm font-medium text-gray-900">{selectedSupplier.paymentTerms}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Catégories</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.category.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSupplier.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedSupplier.notes}</p>
                </div>
              )}
            </motion.div>

            {/* Historique des commandes et paiements */}
            <div className="lg:col-span-2 space-y-6">
              {/* Commandes */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-teal-600" />
                    Historique des Commandes
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucune commande</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'Livré' ? 'bg-green-100 text-green-700' :
                                order.status === 'Commandé' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Annulé' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.items.length} article(s)</p>
                          <p className="text-lg font-bold text-gray-900">{order.total.toFixed(2)} FCFA</p>
                          {order.deliveryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Livré le {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Paiements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    Historique des Paiements
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {payments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun paiement</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{payment.orderNumber}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{payment.paymentMethod}</p>
                          <p className="text-lg font-bold text-green-600">{payment.amount.toFixed(2)} FCFA</p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500 mt-1">Réf: {payment.reference}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}