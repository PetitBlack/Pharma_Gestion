import type { Medicine } from '@/models/Medicine';
import type { Sale } from '@/models/Sale';
import type { User } from '@/models/User';
import type { PharmacySettings } from '@/models/Settings';

// Mock Medicines Data
export const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    category: 'Analgésiques',
    batchNumber: 'PARA2024001',
    expirationDate: '2025-12-31',
    quantity: 500,
    price: 2.50,
    status: 'OK',
    manufacturer: 'PharmaCorp',
    description: 'Soulagement de la douleur et de la fièvre',
    location: 'Rayon A - Étagère 1'
  },
  {
    id: '2',
    name: 'Amoxicilline 250mg',
    category: 'Antibiotiques',
    batchNumber: 'AMOX2024002',
    expirationDate: '2026-03-15',
    quantity: 15,
    price: 8.00,
    status: 'Low',
    manufacturer: 'MediCare Inc.',
    description: 'Antibiotique à large spectre',
    location: 'Rayon B - Étagère 3'
  },
  {
    id: '3',
    name: 'Ibuprofène 400mg',
    category: 'Analgésiques',
    batchNumber: 'IBU2024003',
    expirationDate: '2026-02-20',
    quantity: 200,
    price: 3.50,
    status: 'OK',
    manufacturer: 'HealthPlus',
    description: 'Anti-inflammatoire analgésique',
    location: 'Rayon A - Étagère 2'
  },
  {
    id: '4',
    name: 'Metformine 500mg',
    category: 'Diabète',
    batchNumber: 'MET2024004',
    expirationDate: '2026-02-28',
    quantity: 8,
    price: 5.00,
    status: 'Expiring',
    manufacturer: 'DiabeCare',
    description: 'Contrôle de la glycémie',
    location: 'Rayon C - Étagère 1'
  },
  {
    id: '5',
    name: 'Cétirizine 10mg',
    category: 'Antihistaminique',
    batchNumber: 'CET2024005',
    expirationDate: '2026-06-30',
    quantity: 120,
    price: 4.00,
    status: 'OK',
    manufacturer: 'AllergyFree',
    description: 'Soulagement des allergies',
    location: 'Rayon D - Étagère 2'
  },
  {
    id: '6',
    name: 'Oméprazole 20mg',
    category: 'Gastro-intestinal',
    batchNumber: 'OME2024006',
    expirationDate: '2026-01-31',
    quantity: 10,
    price: 6.50,
    status: 'Low',
    manufacturer: 'GastroCare',
    description: 'Traitement du reflux acide',
    location: 'Rayon E - Étagère 1'
  },
  {
    id: '7',
    name: 'Vitamine C 1000mg',
    category: 'Vitamines',
    batchNumber: 'VITC2024007',
    expirationDate: '2027-08-15',
    quantity: 300,
    price: 3.00,
    status: 'OK',
    manufacturer: 'VitaLife',
    description: 'Support immunitaire',
    location: 'Rayon F - Étagère 3'
  },
  {
    id: '8',
    name: 'Aspirine 75mg',
    category: 'Cardiovasculaire',
    batchNumber: 'ASP2024008',
    expirationDate: '2026-02-15',
    quantity: 7,
    price: 2.00,
    status: 'Expiring',
    manufacturer: 'CardioMed',
    description: 'Anticoagulant',
    location: 'Rayon B - Étagère 1'
  }
];

// Mock Sales Data
export const mockSales: Sale[] = [
  {
    id: 'S001',
    items: [
      { medicineId: '1', medicineName: 'Paracetamol 500mg', quantity: 2, price: 2.50, total: 5.00 }
    ],
    total: 5.00,
    paymentMethod: 'Espèces',
    date: '2026-01-21T09:30:00',
    userId: 'U001',
    userName: 'John Doe'
  },
  {
    id: 'S002',
    items: [
      { medicineId: '3', medicineName: 'Ibuprofène 400mg', quantity: 1, price: 3.50, total: 3.50 },
      { medicineId: '5', medicineName: 'Cétirizine 10mg', quantity: 1, price: 4.00, total: 4.00 }
    ],
    total: 7.50,
    paymentMethod: 'Mobile Money',
    date: '2026-01-21T10:15:00',
    userId: 'U001',
    userName: 'John Doe'
  },
  {
    id: 'S003',
    items: [
      { medicineId: '7', medicineName: 'Vitamine C 1000mg', quantity: 3, price: 3.00, total: 9.00 }
    ],
    total: 9.00,
    paymentMethod: 'Espèces',
    date: '2026-01-21T11:45:00',
    userId: 'U002',
    userName: 'Jane Smith'
  }
];

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 'U001',
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    fullName: 'John Doe',
    email: 'admin@pharmacy.com',
    createdAt: '2024-01-01T00:00:00'
  },
  {
    id: 'U002',
    username: 'employee',
    password: 'emp123',
    role: 'Employee',
    fullName: 'Jane Smith',
    email: 'jane@pharmacy.com',
    createdAt: '2024-03-15T00:00:00'
  },
  {
    id: 'U003',
    username: 'caisse',
    password: 'caisse123',
    role: 'Caisse',
    fullName: 'Marie Dupont',
    email: 'caisse@pharmacy.com',
    createdAt: '2024-05-10T00:00:00'
  },
  {
    id: 'U004',
    username: 'aux1',
    password: 'aux123',
    role: 'Auxiliaire',
    fullName: 'Pierre Martin',
    email: 'aux1@pharmacy.com',
    createdAt: '2024-06-01T00:00:00',
    workstation: 'Poste 1'
  },
  {
    id: 'U005',
    username: 'aux2',
    password: 'aux123',
    role: 'Auxiliaire',
    fullName: 'Sophie Bernard',
    email: 'aux2@pharmacy.com',
    createdAt: '2024-06-01T00:00:00',
    workstation: 'Poste 2'
  }
];

// Mock Settings Data
export const mockSettings: PharmacySettings = {
  pharmacyName: 'HealthCare Pharmacy',
  address: '123 Medical Plaza, City Center',
  phone: '+1 234 567 8900',
  email: 'info@healthcarepharmacy.com',
  license: 'PHM-2024-12345',
  lowStockThreshold: 20,
  expiryAlertDays: 90,
  backupEnabled: true,
  backupFrequency: 'Daily'
};