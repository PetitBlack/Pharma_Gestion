export interface PrescriptionMedicine {
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage?: string;
}

export interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  doctorRegistration?: string; // RPPS / numéro ordre
  prescriptionNumber?: string; // numéro sur l'ordonnance papier
  prescriptionDate: string;    // date de l'ordonnance
  deliveredAt: string;         // date de délivrance
  medicines: PrescriptionMedicine[];
  auxiliaryId: string;
  auxiliaryName: string;
  orderId?: string;            // lié à la commande une fois envoyée
  notes?: string;
}
