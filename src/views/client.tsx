import { useState } from 'react';
import {
  Search, Plus, Edit, Trash2, Eye, X, Phone, Mail, MapPin,
  Calendar, User as UserIcon, Shield, ShieldOff, TrendingUp,
  ShoppingBag, DollarSign, Clock, AlertCircle, Activity, FileText,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useClients } from '@/controllers/clientController';
import type { Client } from '@/models/clients';
import type { User } from '@/models/User';
import { toast } from 'sonner';

interface ClientsViewProps {
  currentUser: User | null;
}

type ViewMode = 'list' | 'add' | 'edit' | 'details';

export function ClientsView({ currentUser }: ClientsViewProps) {
  const { 
    clients, 
    createClient,
    updateClient,
    deleteClient,
    getClientStats,
    getPurchasesByClientId
  } = useClients();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'insured' | 'uninsured'>('all');

  // Formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    dateOfBirth: '',
    gender: '' as Client['gender'] | '',
    isInsured: false,
    insurance: {
      company: '',
      policyNumber: '',
      coveragePercentage: 80,
      expiryDate: '',
      cardNumber: ''
    },
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    notes: '',
    creditBalance: '' as string | number,
    creditAlertThreshold: '' as string | number,
    status: 'Actif' as Client['status'],
    hasPrescriber: false,
    prescriber: {
      name: '',
      specialty: '',
      phone: '',
      email: '',
      registrationNumber: '',
      clinicName: '',
      address: ''
    }
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchQuery === '' || 
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.insurance?.policyNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'insured' && client.isInsured) ||
      (filterType === 'uninsured' && !client.isInsured);
    
    return matchesSearch && matchesFilter;
  });

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter(a => a !== allergy)
    });
  };

  const handleAddDisease = () => {
    if (diseaseInput.trim() && !formData.chronicDiseases.includes(diseaseInput.trim())) {
      setFormData({
        ...formData,
        chronicDiseases: [...formData.chronicDiseases, diseaseInput.trim()]
      });
      setDiseaseInput('');
    }
  };

  const handleRemoveDisease = (disease: string) => {
    setFormData({
      ...formData,
      chronicDiseases: formData.chronicDiseases.filter(d => d !== disease)
    });
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      dateOfBirth: '',
      gender: '',
      isInsured: false,
      insurance: {
        company: '',
        policyNumber: '',
        coveragePercentage: 80,
        expiryDate: '',
        cardNumber: ''
      },
      allergies: [],
      chronicDiseases: [],
      notes: '',
      creditBalance: '',
      creditAlertThreshold: '',
      status: 'Actif',
      hasPrescriber: false,
      prescriber: {
        name: '',
        specialty: '',
        phone: '',
        email: '',
        registrationNumber: '',
        clinicName: '',
        address: ''
      }
    });
    setAllergyInput('');
    setDiseaseInput('');
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    if (formData.isInsured && (!formData.insurance.company || !formData.insurance.policyNumber)) {
      toast.error('Veuillez remplir les informations d\'assurance');
      return;
    }

    const clientData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email || undefined,
      phone: formData.phone,
      address: formData.address || undefined,
      city: formData.city || undefined,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      gender: formData.gender || undefined,
      isInsured: formData.isInsured,
      insurance: formData.isInsured ? {
        company: formData.insurance.company,
        policyNumber: formData.insurance.policyNumber,
        coveragePercentage: formData.insurance.coveragePercentage,
        expiryDate: formData.insurance.expiryDate ? new Date(formData.insurance.expiryDate) : undefined,
        cardNumber: formData.insurance.cardNumber || undefined
      } : undefined,
      allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
      chronicDiseases: formData.chronicDiseases.length > 0 ? formData.chronicDiseases : undefined,
      notes: formData.notes || undefined,
      creditBalance: formData.creditBalance !== '' ? Number(formData.creditBalance) : undefined,
      creditAlertThreshold: formData.creditAlertThreshold !== '' ? Number(formData.creditAlertThreshold) : undefined,
      status: formData.status,
      createdBy: currentUser?.fullName,
      prescriber: formData.hasPrescriber && formData.prescriber.name ? {
        name: formData.prescriber.name,
        specialty: formData.prescriber.specialty || undefined,
        phone: formData.prescriber.phone || undefined,
        email: formData.prescriber.email || undefined,
        registrationNumber: formData.prescriber.registrationNumber || undefined,
        clinicName: formData.prescriber.clinicName || undefined,
        address: formData.prescriber.address || undefined,
      } : undefined
    };

    if (viewMode === 'add') {
      createClient(clientData);
      toast.success('Client ajouté avec succès');
    } else if (viewMode === 'edit' && selectedClient) {
      updateClient(selectedClient.id, clientData);
      toast.success('Client modifié avec succès');
    }

    resetForm();
    setViewMode('list');
    setSelectedClient(null);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone,
      address: client.address || '',
      city: client.city || '',
      dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
      gender: client.gender || '',
      isInsured: client.isInsured,
      insurance: client.insurance ? {
        company: client.insurance.company,
        policyNumber: client.insurance.policyNumber,
        coveragePercentage: client.insurance.coveragePercentage,
        expiryDate: client.insurance.expiryDate ? new Date(client.insurance.expiryDate).toISOString().split('T')[0] : '',
        cardNumber: client.insurance.cardNumber || ''
      } : {
        company: '',
        policyNumber: '',
        coveragePercentage: 80,
        expiryDate: '',
        cardNumber: ''
      },
      allergies: client.allergies || [],
      chronicDiseases: client.chronicDiseases || [],
      notes: client.notes || '',
      creditBalance: client.creditBalance ?? '',
      creditAlertThreshold: client.creditAlertThreshold ?? '',
      status: client.status,
      hasPrescriber: !!client.prescriber,
      prescriber: client.prescriber ? {
        name: client.prescriber.name,
        specialty: client.prescriber.specialty || '',
        phone: client.prescriber.phone || '',
        email: client.prescriber.email || '',
        registrationNumber: client.prescriber.registrationNumber || '',
        clinicName: client.prescriber.clinicName || '',
        address: client.prescriber.address || ''
      } : {
        name: '',
        specialty: '',
        phone: '',
        email: '',
        registrationNumber: '',
        clinicName: '',
        address: ''
      }
    });
    setViewMode('edit');
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      deleteClient(id);
      toast.success('Client supprimé');
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setViewMode('details');
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
              <p className="text-sm text-gray-600 mt-1">
                {clients.length} client(s) enregistré(s)
              </p>
            </div>
            <Button
              onClick={() => setViewMode('add')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Client
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
                placeholder="Rechercher par nom, téléphone, email, police d'assurance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={filterType === 'insured' ? 'default' : 'outline'}
                onClick={() => setFilterType('insured')}
                size="sm"
                className={filterType === 'insured' ? 'bg-green-600' : ''}
              >
                <Shield className="w-4 h-4 mr-2" />
                Assurés
              </Button>
              <Button
                variant={filterType === 'uninsured' ? 'default' : 'outline'}
                onClick={() => setFilterType('uninsured')}
                size="sm"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Non assurés
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Liste des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun client trouvé</p>
            </div>
          ) : (
            filteredClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{client.fullName}</h3>
                    {client.isInsured ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {client.insurance?.company}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <ShieldOff className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Non assuré</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{client.city}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Achats</p>
                    <p className="text-lg font-bold text-gray-900">{client.totalPurchases}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total dépensé</p>
                    <p className="text-lg font-bold text-teal-600">{client.totalSpent.toFixed(0)} F</p>
                  </div>
                </div>

                {(client.allergies && client.allergies.length > 0) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      <span className="font-medium">Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {client.allergies.slice(0, 2).map((allergy) => (
                        <span
                          key={allergy}
                          className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
                        >
                          {allergy}
                        </span>
                      ))}
                      {client.allergies.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{client.allergies.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(client)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
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
              {viewMode === 'add' ? 'Nouveau Client' : 'Modifier Client'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode('list');
                resetForm();
                setSelectedClient(null);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-teal-600" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Aminata"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: Ouédraogo"
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.bf"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Genre</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Client['gender'] })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Autre">Autre</option>
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
                  <Label htmlFor="address">Adresse complète</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Secteur 15, Ouaga 2000"
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
              </div>
            </div>

            {/* Assurance */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                Assurance santé
              </h3>
              
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isInsured}
                    onChange={(e) => setFormData({ ...formData, isInsured: e.target.checked })}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Ce client est assuré
                  </span>
                </label>
              </div>

              <AnimatePresence>
                {formData.isInsured && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <Label htmlFor="insuranceCompany">Compagnie d'assurance *</Label>
                      <Input
                        id="insuranceCompany"
                        value={formData.insurance.company}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          insurance: { ...formData.insurance, company: e.target.value }
                        })}
                        placeholder="Ex: SONAR Assurances"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="policyNumber">Numéro de police *</Label>
                      <Input
                        id="policyNumber"
                        value={formData.insurance.policyNumber}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          insurance: { ...formData.insurance, policyNumber: e.target.value }
                        })}
                        placeholder="Ex: POL123456"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Numéro de carte</Label>
                      <Input
                        id="cardNumber"
                        value={formData.insurance.cardNumber}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          insurance: { ...formData.insurance, cardNumber: e.target.value }
                        })}
                        placeholder="Ex: CARD789012"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coveragePercentage">Taux de couverture (%)</Label>
                      <Input
                        id="coveragePercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.insurance.coveragePercentage}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          insurance: { ...formData.insurance, coveragePercentage: parseInt(e.target.value) || 0 }
                        })}
                        className="mt-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="expiryDate">Date d'expiration</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.insurance.expiryDate}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          insurance: { ...formData.insurance, expiryDate: e.target.value }
                        })}
                        className="mt-2"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Informations médicales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                Informations médicales
              </h3>
              
              {/* Allergies */}
              <div className="mb-4">
                <Label>Allergies</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                    placeholder="Ex: Pénicilline, Aspirine..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddAllergy} type="button" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-3 py-1 bg-red-50 text-red-700 rounded-full flex items-center gap-2 text-sm"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(allergy)}
                          className="hover:text-red-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Maladies chroniques */}
              <div className="mb-4">
                <Label>Maladies chroniques</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={diseaseInput}
                    onChange={(e) => setDiseaseInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDisease()}
                    placeholder="Ex: Diabète, Hypertension..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddDisease} type="button" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.chronicDiseases.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.chronicDiseases.map((disease) => (
                      <span
                        key={disease}
                        className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full flex items-center gap-2 text-sm"
                      >
                        {disease}
                        <button
                          type="button"
                          onClick={() => handleRemoveDisease(disease)}
                          className="hover:text-orange-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Médecin prescripteur */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                Médecin prescripteur
              </h3>

              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPrescriber}
                    onChange={(e) => setFormData({ ...formData, hasPrescriber: e.target.checked })}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Ce client a un médecin prescripteur
                  </span>
                </label>
              </div>

              <AnimatePresence>
                {formData.hasPrescriber && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <Label htmlFor="prescriberName">Nom du médecin *</Label>
                      <Input
                        id="prescriberName"
                        value={formData.prescriber.name}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, name: e.target.value } })}
                        placeholder="Dr. Jean Ouédraogo"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prescriberSpecialty">Spécialité</Label>
                      <Input
                        id="prescriberSpecialty"
                        value={formData.prescriber.specialty}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, specialty: e.target.value } })}
                        placeholder="Ex: Cardiologue, Généraliste..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prescriberPhone">Téléphone</Label>
                      <Input
                        id="prescriberPhone"
                        value={formData.prescriber.phone}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, phone: e.target.value } })}
                        placeholder="+226 70 00 00 00"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prescriberEmail">Email</Label>
                      <Input
                        id="prescriberEmail"
                        type="email"
                        value={formData.prescriber.email}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, email: e.target.value } })}
                        placeholder="dr.jean@clinique.bf"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prescriberReg">N° RPPS / Ordre</Label>
                      <Input
                        id="prescriberReg"
                        value={formData.prescriber.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, registrationNumber: e.target.value } })}
                        placeholder="Ex: RPPS123456789"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prescriberClinic">Cabinet / Clinique</Label>
                      <Input
                        id="prescriberClinic"
                        value={formData.prescriber.clinicName}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, clinicName: e.target.value } })}
                        placeholder="Ex: Clinique du Plateau"
                        className="mt-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="prescriberAddress">Adresse du cabinet</Label>
                      <Input
                        id="prescriberAddress"
                        value={formData.prescriber.address}
                        onChange={(e) => setFormData({ ...formData, prescriber: { ...formData.prescriber, address: e.target.value } })}
                        placeholder="Ex: Avenue de la Nation, Ouagadougou"
                        className="mt-2"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avoir (crédit en pharmacie) */}
            <div className="border border-dashed border-teal-200 rounded-lg p-4 bg-teal-50/40 space-y-3">
              <p className="text-sm font-semibold text-teal-700">Avoir en pharmacie (solde crédit)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditBalance" className="text-xs">Solde avoir (FCFA)</Label>
                  <Input
                    id="creditBalance"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.creditBalance}
                    onChange={e => setFormData({ ...formData, creditBalance: e.target.value })}
                    placeholder="0"
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="creditAlertThreshold" className="text-xs">Seuil d'alerte (FCFA)</Label>
                  <Input
                    id="creditAlertThreshold"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.creditAlertThreshold}
                    onChange={e => setFormData({ ...formData, creditAlertThreshold: e.target.value })}
                    placeholder="5000"
                    className="mt-1 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Alerte si solde passe en dessous</p>
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

            {/* Statut */}
            <div>
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Client['status'] })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                resetForm();
                setSelectedClient(null);
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

  // Vue Détails
  if (viewMode === 'details' && selectedClient) {
    const stats = getClientStats(selectedClient.id);
    const purchases = getPurchasesByClientId(selectedClient.id);

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
                  <h1 className="text-2xl font-bold text-gray-900">{selectedClient.fullName}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedClient.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>
                {selectedClient.isInsured ? (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-lg text-green-600 font-medium">
                      {selectedClient.insurance?.company} - {selectedClient.insurance?.coveragePercentage}% de couverture
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldOff className="w-5 h-5 text-gray-400" />
                    <span className="text-lg text-gray-500">Non assuré</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(selectedClient)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMode('list');
                    setSelectedClient(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Achats</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
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
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Économies (Assurance)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSaved.toFixed(0)} F</p>
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
                    <p className="text-sm text-gray-600">Dernière Visite</p>
                    <p className="text-sm font-bold text-gray-900">
                      {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informations du client */}
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
                    <p className="text-sm font-medium text-gray-900">{selectedClient.phone}</p>
                  </div>
                </div>
                {selectedClient.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedClient.email}</p>
                    </div>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedClient.address}<br />
                        {selectedClient.city}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.dateOfBirth && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date de naissance</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedClient.dateOfBirth).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedClient.isInsured && selectedClient.insurance && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Assurance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compagnie:</span>
                      <span className="font-medium">{selectedClient.insurance.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Police:</span>
                      <span className="font-medium">{selectedClient.insurance.policyNumber}</span>
                    </div>
                    {selectedClient.insurance.cardNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Carte:</span>
                        <span className="font-medium">{selectedClient.insurance.cardNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Couverture:</span>
                      <span className="font-medium text-green-600">{selectedClient.insurance.coveragePercentage}%</span>
                    </div>
                    {selectedClient.insurance.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expire le:</span>
                        <span className="font-medium">
                          {new Date(selectedClient.insurance.expiryDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedClient.allergies && selectedClient.allergies.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.chronicDiseases && selectedClient.chronicDiseases.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    Maladies chroniques
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.chronicDiseases.map((disease) => (
                      <span
                        key={disease}
                        className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedClient.notes}</p>
                </div>
              )}

              {selectedClient.prescriber && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    Médecin prescripteur
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-900">{selectedClient.prescriber.name}</p>
                    {selectedClient.prescriber.specialty && (
                      <p className="text-gray-500 italic">{selectedClient.prescriber.specialty}</p>
                    )}
                    {selectedClient.prescriber.clinicName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedClient.prescriber.clinicName}</span>
                      </div>
                    )}
                    {selectedClient.prescriber.address && (
                      <p className="text-gray-500 text-xs">{selectedClient.prescriber.address}</p>
                    )}
                    {selectedClient.prescriber.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedClient.prescriber.phone}</span>
                      </div>
                    )}
                    {selectedClient.prescriber.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedClient.prescriber.email}</span>
                      </div>
                    )}
                    {selectedClient.prescriber.registrationNumber && (
                      <p className="text-xs text-gray-400">N° {selectedClient.prescriber.registrationNumber}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Historique des achats */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Historique des Achats
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {purchases.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun achat enregistré</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {purchases.map((purchase) => (
                        <div key={purchase.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{purchase.orderNumber}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(purchase.purchaseDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{purchase.items.length} article(s)</p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Total</p>
                              <p className="font-bold text-gray-900">{purchase.total.toFixed(2)} FCFA</p>
                            </div>
                            {purchase.insuranceCoverage > 0 && (
                              <>
                                <div>
                                  <p className="text-gray-600">Assurance</p>
                                  <p className="font-bold text-green-600">{purchase.insuranceCoverage.toFixed(2)} FCFA</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Payé</p>
                                  <p className="font-bold text-teal-600">{purchase.amountPaid.toFixed(2)} FCFA</p>
                                </div>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Mode: {purchase.paymentMethod}</p>
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