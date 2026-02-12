# Pharmacy Management System - Architecture Documentation

## Overview
This is a **local desktop pharmacy management application** built with React, TypeScript, and Tailwind CSS. It follows a clean **MVC (Model-View-Controller)** architecture for maintainability and scalability.

## Folder Structure

```
src/
├── models/                 # Data Models
│   ├── Medicine.ts        # Medicine entity definition
│   ├── Sale.ts            # Sale and SaleItem definitions
│   ├── User.ts            # User entity and roles
│   └── Settings.ts        # Pharmacy settings definition
│
├── services/              # Data Access Layer (Mock Database)
│   ├── mockData.ts        # Initial mock data
│   ├── medicineService.ts # Medicine CRUD operations
│   ├── saleService.ts     # Sales management
│   ├── userService.ts     # User authentication & management
│   └── settingsService.ts # Settings persistence
│
├── controllers/           # Business Logic & State Management
│   ├── authController.ts      # Authentication logic
│   ├── medicineController.ts  # Medicine management logic
│   ├── saleController.ts      # Sales processing logic
│   └── dashboardController.ts # Dashboard statistics
│
├── views/                 # Main Screen Components
│   ├── LoginView.tsx      # Login screen
│   ├── DashboardView.tsx  # Dashboard with stats & charts
│   ├── MedicinesView.tsx  # Medicine management (CRUD)
│   ├── SalesView.tsx      # Point of sale interface
│   ├── StockAlertsView.tsx # Low stock & expiring alerts
│   ├── UsersView.tsx      # User management
│   └── SettingsView.tsx   # System settings
│
└── app/
    ├── components/        # Reusable UI Components
    │   ├── Sidebar.tsx   # Navigation sidebar
    │   ├── Header.tsx    # Top header with user info
    │   └── StatCard.tsx  # Dashboard statistics card
    └── App.tsx           # Main application entry point
```

## Architecture Layers

### 1. **Model Layer** (`/src/models`)
- Defines data structures and types
- Pure TypeScript interfaces
- No business logic

**Example:**
```typescript
// Medicine.ts
export interface Medicine {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: 'OK' | 'Low' | 'Expiring';
  // ...
}
```

### 2. **Service Layer** (`/src/services`)
- Data access and persistence (currently mock data in memory)
- CRUD operations
- Data transformation
- Business rules enforcement

**Example:**
```typescript
// medicineService.ts
class MedicineService {
  getAll(): Medicine[]
  add(medicine): Medicine
  update(id, updates): Medicine
  delete(id): boolean
  getLowStock(threshold): Medicine[]
  getExpiring(days): Medicine[]
}
```

### 3. **Controller Layer** (`/src/controllers`)
- React hooks for state management
- Business logic coordination
- Bridges Services and Views
- Side effects handling

**Example:**
```typescript
// medicineController.ts
export function useMedicines() {
  const [medicines, setMedicines] = useState([]);
  
  const addMedicine = (medicine) => {
    medicineService.add(medicine);
    loadMedicines();
  };
  
  return { medicines, addMedicine, ... };
}
```

### 4. **View Layer** (`/src/views` & `/src/app/components`)
- Pure UI components
- Minimal logic (only presentation)
- Receives data from controllers
- Emits events to controllers

## Key Features

### 1. **Dashboard**
- Real-time statistics cards
- 7-day sales chart (Recharts)
- Quick alerts panel
- Visual indicators

### 2. **Medicines Management**
- Full CRUD operations
- Search and filter
- Status indicators (OK, Low, Expiring)
- Batch tracking

### 3. **Sales (Point of Sale)**
- Fast medicine search
- Cart management
- Payment methods (Cash, Mobile Money)
- Real-time stock validation
- Automatic inventory updates

### 4. **Stock Alerts**
- Low stock notifications
- Expiring medicines tracking
- Color-coded severity
- Configurable thresholds

### 5. **User Management**
- Role-based access (Admin, Employee)
- User CRUD operations
- Permissions awareness

### 6. **Settings**
- Pharmacy information
- Stock alert thresholds
- Backup configuration

## Authentication Flow

1. User enters credentials on `LoginView`
2. `authController.login()` validates via `userService`
3. On success:
   - User stored in state
   - Session saved to localStorage
   - Main app rendered
4. On logout:
   - State cleared
   - localStorage cleared
   - Returns to login

## Data Flow Example: Creating a Sale

```
SalesView (UI)
    ↓
    [User clicks "Complete Sale"]
    ↓
saleController.createSale()
    ↓
saleService.createSale()
    ↓
    [Validates stock via medicineService]
    ↓
    [Updates medicine quantities]
    ↓
    [Creates sale record]
    ↓
Returns to Controller → Updates View
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Recharts** - Charts and graphs
- **Lucide React** - Icon library
- **Radix UI** - Accessible UI components
- **Sonner** - Toast notifications

## Design System

### Colors
- **Primary:** Teal (#14b8a6) - Medical/pharmacy brand
- **Success:** Green - Positive actions
- **Warning:** Orange - Low stock alerts
- **Danger:** Red - Critical alerts
- **Neutral:** Gray scale - Text and backgrounds

### Layout
- **Desktop-first:** Optimized for 1920x1080 and larger
- **Left sidebar:** Fixed navigation (64px width)
- **Top header:** User info and date
- **Main content:** Scrollable area with padding

### Typography
- **Font:** System font stack
- **Sizes:** Base 16px, follows Tailwind scale
- **Weights:** Normal (400), Medium (500), Semibold (600), Bold (700)

## Future Enhancements

### Database Integration
Replace mock services with:
- SQLite (local desktop)
- IndexedDB (browser-based)
- PostgreSQL (server-based)

### Additional Features
- Reporting and analytics
- Barcode scanning
- Receipt printing
- Multi-pharmacy support
- Prescription management
- Supplier management
- Purchase orders

### Electron Desktop App
- Package as native desktop application
- System tray integration
- Auto-updates
- Offline-first architecture

## Demo Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Employee Account:**
- Username: `employee`
- Password: `emp123`

## Development

The application uses:
- Vite for fast development and building
- Hot Module Replacement (HMR)
- TypeScript strict mode
- ESLint for code quality

## License

This is a demonstration project for a local pharmacy management system.
