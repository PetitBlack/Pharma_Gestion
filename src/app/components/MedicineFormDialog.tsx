import { useState, useEffect } from 'react';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Calculator, TrendingUp, Info } from 'lucide-react';

interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode: 'add' | 'edit';
}

export function MedicineFormDialog({ isOpen, onClose, onSubmit, initialData, mode }: MedicineFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    batchNumber: '',
    expirationDate: '',
    quantity: 0,
    // Nouveaux champs de prix
    purchasePriceWholesale: 0, // Prix d'achat en gros
    purchasePriceDetail: 0,     // Prix d'achat au détail
    profitMargin: 1.5,          // Marge bénéficiaire (coefficient)
    sellingPrice: 0,            // Prix de vente (calculé automatiquement)
    taxRate: 0,                 // Taux de taxe en pourcentage
    finalPrice: 0,              // Prix final avec taxe
    // Autres champs
    manufacturer: '',
    location: '',
    description: '',
  });

  const [useWholesale, setUseWholesale] = useState(true); // Utiliser prix gros ou détail

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        batchNumber: initialData.batchNumber || '',
        expirationDate: initialData.expirationDate || '',
        quantity: initialData.quantity || 0,
        purchasePriceWholesale: initialData.purchasePriceWholesale || 0,
        purchasePriceDetail: initialData.purchasePriceDetail || 0,
        profitMargin: initialData.profitMargin || 1.5,
        sellingPrice: initialData.sellingPrice || 0,
        taxRate: initialData.taxRate || 0,
        finalPrice: initialData.finalPrice || initialData.price || 0,
        manufacturer: initialData.manufacturer || '',
        location: initialData.location || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  // Calculer automatiquement le prix de vente
  useEffect(() => {
    const basePrice = useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail;
    const calculatedSellingPrice = basePrice * formData.profitMargin;
    const calculatedFinalPrice = calculatedSellingPrice * (1 + formData.taxRate / 100);

    setFormData(prev => ({
      ...prev,
      sellingPrice: parseFloat(calculatedSellingPrice.toFixed(2)),
      finalPrice: parseFloat(calculatedFinalPrice.toFixed(2))
    }));
  }, [formData.purchasePriceWholesale, formData.purchasePriceDetail, formData.profitMargin, formData.taxRate, useWholesale]);

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData,
      price: formData.finalPrice, // Pour compatibilité avec l'ancien système
    };
    onSubmit(dataToSubmit);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      batchNumber: '',
      expirationDate: '',
      quantity: 0,
      purchasePriceWholesale: 0,
      purchasePriceDetail: 0,
      profitMargin: 1.5,
      sellingPrice: 0,
      taxRate: 0,
      finalPrice: 0,
      manufacturer: '',
      location: '',
      description: '',
    });
    setUseWholesale(true);
  };

  const profitAmount = formData.sellingPrice - (useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail);
  const profitPercentage = (useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail) > 0 
    ? ((profitAmount / (useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail)) * 100) 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'add' ? 'Ajouter un nouveau médicament' : 'Modifier le médicament'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations de base */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-teal-600" />
              Informations de base
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du médicament *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Paracétamol 500mg"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Antalgique"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="manufacturer">Fabricant</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Ex: Sanofi"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  placeholder="Ex: Rayon A - Étagère 2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Courte description du médicament"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Lot et stock */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock et traçabilité</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="batchNumber">N° de lot</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="Ex: LOT2024-001"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="expirationDate">Date d'expiration</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantité en stock</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Gestion des prix et marges */}
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" />
              Gestion des prix et marges
            </h3>

            {/* Toggle Prix gros / détail */}
            <div className="mb-6">
              <Label className="mb-2 block">Base de calcul du prix de vente</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUseWholesale(true)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    useWholesale 
                      ? 'border-teal-600 bg-teal-600 text-white font-medium' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                  }`}
                >
                  Prix d'achat en gros
                </button>
                <button
                  type="button"
                  onClick={() => setUseWholesale(false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    !useWholesale 
                      ? 'border-teal-600 bg-teal-600 text-white font-medium' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                  }`}
                >
                  Prix d'achat au détail
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Prix d'achat */}
              <div className={useWholesale ? '' : 'opacity-50'}>
                <Label htmlFor="purchasePriceWholesale">Prix d'achat en gros (FCFA)</Label>
                <Input
                  id="purchasePriceWholesale"
                  type="number"
                  step="0.01"
                  value={formData.purchasePriceWholesale}
                  onChange={(e) => setFormData({ ...formData, purchasePriceWholesale: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                  disabled={!useWholesale}
                />
              </div>

              <div className={!useWholesale ? '' : 'opacity-50'}>
                <Label htmlFor="purchasePriceDetail">Prix d'achat au détail (FCFA)</Label>
                <Input
                  id="purchasePriceDetail"
                  type="number"
                  step="0.01"
                  value={formData.purchasePriceDetail}
                  onChange={(e) => setFormData({ ...formData, purchasePriceDetail: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                  disabled={useWholesale}
                />
              </div>

              {/* Marge bénéficiaire */}
              <div>
                <Label htmlFor="profitMargin" className="flex items-center justify-between">
                  <span>Coefficient de marge</span>
                  <span className="text-xs text-teal-600 font-medium">x{formData.profitMargin}</span>
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="profitMargin"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.profitMargin}
                    onChange={(e) => setFormData({ ...formData, profitMargin: parseFloat(e.target.value) || 1 })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, profitMargin: 1.5 })}
                    className="whitespace-nowrap"
                  >
                    Défaut (1.5)
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Suggestion: 1.3 à 2.0 selon le médicament
                </p>
              </div>

              {/* Taux de taxe */}
              <div>
                <Label htmlFor="taxRate" className="flex items-center justify-between">
                  <span>Taux de taxe (%)</span>
                  <span className="text-xs text-teal-600 font-medium">{formData.taxRate}%</span>
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, taxRate: 0 })}
                    className="whitespace-nowrap"
                  >
                    0% (Exonéré)
                  </Button>
                </div>
              </div>
            </div>

            {/* Récapitulatif des calculs */}
            <div className="mt-6 bg-white rounded-lg p-4 border border-teal-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Récapitulatif des prix
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Prix d'achat ({useWholesale ? 'gros' : 'détail'}):
                  </span>
                  <span className="font-medium text-gray-900">
                    {(useWholesale ? formData.purchasePriceWholesale : formData.purchasePriceDetail).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Marge (x{formData.profitMargin}):
                  </span>
                  <span className="font-medium text-teal-700">
                    +{profitAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Prix de vente HT:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formData.sellingPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {formData.taxRate > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxe ({formData.taxRate}%):</span>
                      <span className="font-medium text-gray-700">
                        +{((formData.finalPrice - formData.sellingPrice)).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-700">Prix de vente TTC:</span>
                      <span className="font-bold text-xl text-teal-600">
                        {formData.finalPrice.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 bg-teal-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-teal-900">Bénéfice unitaire:</span>
                    <span className="font-bold text-teal-700">
                      {profitAmount.toLocaleString('fr-FR')} FCFA ({profitPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-700">
            {mode === 'add' ? 'Ajouter le médicament' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
