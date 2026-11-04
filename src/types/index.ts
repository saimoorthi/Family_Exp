export type UserRole = 'admin' | 'user';

export type PaymentMethod = string;

export interface PaymentMethodItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface DepositTypeItem {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  password?: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  photoUrl?: string;
  defaultPaymentMethod?: string;
  defaultModule?: ActiveTab;
  createdAt: string;
  updatedAt: string;
}

export interface FamilySettings {
  familyName: string;
  currency: string;
  dateFormat: string;
  appVersion?: string;
  aboutDescription?: string;
  releaseNotes?: string;
  isSetupCompleted?: boolean;
  updatedAt?: string;
}

export interface EditHistoryChange {
  field: string;
  from: string | number;
  to: string | number;
}

export interface EditHistoryItem {
  timestamp: string;
  editedBy: string;
  editedByName: string;
  changes: EditHistoryChange[];
}

export interface Expense {
  id: string;
  familyId?: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  paidBy: string; // User ID
  paidByName: string;
  paymentMethod: PaymentMethod;
  description?: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPendingSync?: boolean;
  isEdited?: boolean;
  editHistory?: EditHistoryItem[];
}

export interface Deposit {
  id: string;
  familyId?: string;
  title: string;
  amount: number;
  depositType?: string;
  depositedBy: string; // User ID
  depositedByName: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPendingSync?: boolean;
  isEdited?: boolean;
  editHistory?: EditHistoryItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export type ActiveTab = 'dashboard' | 'expenses' | 'deposits' | 'reports' | 'settings';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';
