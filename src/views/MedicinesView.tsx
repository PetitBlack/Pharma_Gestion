import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, MapPin, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { useMedicines } from '@/controllers/medicineController';
import type { Medicine } from '@/models/Medicine';
import { User } from '@/models/User';
import { toast } from 'sonner';
import { MedicineFormDialog } from '@/app/components/MedicineFormDialog';

interface MedicinesViewProps {
  currentUser: User;
}

export function MedicinesView({ currentUser }: MedicinesViewProps) {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useMedicines();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedMedicine(null);
    setFormMode('add');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (formMode === 'add') {
      addMedicine({
        ...data,
        status: data.quantity < 20 ? 'Low' : 'OK'
      });
      toast.success('Médicament ajouté avec succès');
    } else if (selectedMedicine) {
      updateMedicine(selectedMedicine.id, data);
      toast.success('Médicament modifié avec succès');
    }
    setIsFormOpen(false);
  };

  const confirmDelete = (medicine: Medicine) => {
    setMedicineToDelete(medicine);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!medicineToDelete) return;
    deleteMedicine(medicineToDelete.id);
    toast.success('Médicament supprimé avec succès');
    setDeleteConfirmOpen(false);
    setMedicineToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-100 text-green-700';
      case 'Low': return 'bg-orange-100 text-orange-700';
      case 'Expiring': return 'bg-yellow-100 text-yellow-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Calcul des statistiques
  const stats = {
    total: medicines.length,
    lowStock: medicines.filter(m => m.status === 'Low').length,
    expiring: medicines.filter(m => m.status === 'Expiring').length,
    totalValue: medicines.reduce((sum, m) => sum + (m.price * m.quantity), 0)
  };

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header avec stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Médicaments</h1>
            <p className="text-sm text-gray-600 mt-1">{medicines.length} médicament(s) en stock</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-teal-500 to-teal-600">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un médicament
          </Button>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-teal-700">Total Produits</p>
                <p className="text-2xl font-bold text-teal-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-orange-700">Stock Bas</p>
                <p className="text-2xl font-bold text-orange-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-yellow-700">Bientôt expirés</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.expiring}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700">Valeur Stock</p>
                <p className="text-lg font-bold text-blue-900">
                  {stats.totalValue.toLocaleString('fr-FR')} F
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barre de recherche */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, catégorie ou numéro de lot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Medicines Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nom du médicament</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">N° Lot</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantité</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prix Unit.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Valeur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Emplacement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500">Aucun médicament trouvé</p>
                        {searchQuery && (
                          <p className="text-sm text-gray-400">
                            Essayez de modifier votre recherche
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((medicine, index) => (
                    <motion.tr 
                      key={medicine.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{medicine.name}</p>
                            <p className="text-xs text-gray-500">{medicine.manufacturer || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medicine.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medicine.batchNumber || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {medicine.expirationDate || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          medicine.quantity < 20 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {medicine.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {medicine.price.toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-teal-700">
                        {(medicine.price * medicine.quantity).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-6 py-4">
                        {medicine.location ? (
                          <div className="flex items-center gap-1 text-sm text-teal-700">
                            <MapPin className="w-3 h-3" />
                            <span>{medicine.location}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(medicine.status)}`}>
                          {medicine.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(medicine)}
                            className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(medicine)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Nouveau formulaire unifié */}
      <MedicineFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedMedicine}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-2">
              Êtes-vous sûr de vouloir supprimer ce médicament ?
            </p>
            {medicineToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{medicineToDelete.name}</p>
                    <p className="text-sm text-gray-600">{medicineToDelete.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <span className="text-gray-600">Quantité:</span>
                    <span className="font-medium text-gray-900 ml-1">{medicineToDelete.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prix:</span>
                    <span className="font-medium text-gray-900 ml-1">
                      {medicineToDelete.price.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Cette action est irréversible !
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setMedicineToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}