import { BonLivraison, BLComparison } from '@/models/bonLivraison';
import { bonLivraisonService } from '@/services/bonLivraisonservice';
import { useState, useEffect } from 'react';
export function useBonLivraison() {
  const [bls, setBls] = useState<BonLivraison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBLs();
  }, []);

  const loadBLs = () => {
    try {
      const allBLs = bonLivraisonService.getAll();
      setBls(allBLs);
    } catch (error) {
      console.error('Erreur lors du chargement des BLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getById = (id: string): BonLivraison | null => {
    return bonLivraisonService.getById(id);
  };

  const getBySupplier = (supplierId: string): BonLivraison[] => {
    return bonLivraisonService.getBySupplier(supplierId);
  };

  const getByStatus = (status: BonLivraison['status']): BonLivraison[] => {
    return bonLivraisonService.getByStatus(status);
  };

  const getWithDiscrepancies = (): BonLivraison[] => {
    return bonLivraisonService.getWithDiscrepancies();
  };

  const search = (query: string): BonLivraison[] => {
    return bonLivraisonService.search(query);
  };

  const create = (bl: Omit<BonLivraison, 'id' | 'createdAt' | 'hasDiscrepancies'>): BonLivraison => {
    const newBL = bonLivraisonService.create(bl);
    loadBLs();
    return newBL;
  };

  const update = (id: string, updates: Partial<BonLivraison>): BonLivraison | null => {
    const updated = bonLivraisonService.update(id, updates);
    if (updated) loadBLs();
    return updated;
  };

  const deleteBL = (id: string): boolean => {
    const success = bonLivraisonService.delete(id);
    if (success) loadBLs();
    return success;
  };

  const verify = (id: string, verifiedBy: string): BonLivraison | null => {
    const verified = bonLivraisonService.verify(id, verifiedBy);
    if (verified) loadBLs();
    return verified;
  };

  const validate = (id: string, validatedBy: string): BonLivraison | null => {
    const validated = bonLivraisonService.validate(id, validatedBy);
    if (validated) loadBLs();
    return validated;
  };

  const markAsDispute = (id: string, notes: string): BonLivraison | null => {
    const disputed = bonLivraisonService.markAsDispute(id, notes);
    if (disputed) loadBLs();
    return disputed;
  };

  const compareWithOrder = (blId: string, orderId: string): BLComparison | null => {
    return bonLivraisonService.compareWithOrder(blId, orderId);
  };

  const generateBLNumber = (): string => {
    return bonLivraisonService.generateBLNumber();
  };

  const getStats = () => {
    return bonLivraisonService.getStats();
  };

  return {
    bls,
    loading,
    getById,
    getBySupplier,
    getByStatus,
    getWithDiscrepancies,
    search,
    create,
    update,
    deleteBL,
    verify,
    validate,
    markAsDispute,
    compareWithOrder,
    generateBLNumber,
    getStats,
    refresh: loadBLs
  };
}