import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Expense,
  Deposit,
  CategoryItem,
  PaymentMethodItem,
  DepositTypeItem,
  FamilySettings,
  UserProfile,
  UserRole,
  ActivityLog,
  SyncState,
  EditHistoryItem,
  EditHistoryChange,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_DEPOSIT_TYPES,
  DEFAULT_FAMILY_SETTINGS,
} from '../lib/constants';
import {
  getPendingQueue,
  savePendingQueue,
  enqueuePendingItem,
  dequeuePendingItem,
  getCachedExpenses,
  saveCachedExpenses,
  getCachedDeposits,
  saveCachedDeposits,
} from '../lib/offlineSync';
import { useAuth, hashPassword } from './AuthContext';
import { formatDate } from '../lib/dateUtils';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface DataContextType {
  expenses: Expense[];
  deposits: Deposit[];
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
  depositTypes: DepositTypeItem[];
  members: UserProfile[];
  familySettings: FamilySettings;
  activityLogs: ActivityLog[];
  syncStatus: SyncState;
  pendingCount: number;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date | undefined | null) => string;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  addDeposit: (deposit: Omit<Deposit, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<boolean>;
  updateDeposit: (id: string, updates: Partial<Deposit>) => Promise<boolean>;
  deleteDeposit: (id: string) => Promise<boolean>;
  addCategory: (cat: Omit<CategoryItem, 'id'>) => Promise<boolean>;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  addPaymentMethod: (pm: Omit<PaymentMethodItem, 'id'>) => Promise<boolean>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodItem>) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  addDepositType: (dt: Omit<DepositTypeItem, 'id'>) => Promise<boolean>;
  updateDepositType: (id: string, updates: Partial<DepositTypeItem>) => Promise<boolean>;
  deleteDepositType: (id: string) => Promise<boolean>;
  updateFamilySettings: (settings: Partial<FamilySettings>) => Promise<boolean>;
  toggleMemberActive: (memberId: string, currentStatus: boolean) => Promise<boolean>;
  updateMemberRole: (memberId: string, newRole: 'admin' | 'user') => Promise<boolean>;
  updateMember: (
    memberId: string,
    updates: { displayName?: string; password?: string; role?: UserRole }
  ) => Promise<boolean>;
  deleteMember: (memberId: string) => Promise<boolean>;
  manualSync: () => Promise<void>;
  wipeAllData: () => Promise<boolean>;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  lastSyncTime: Date;
  lastSyncFormatted: string;
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
}

/**
 * Recursively remove keys with `undefined` values to prevent Firestore from throwing
 * "Unsupported field value: undefined" errors on setDoc / updateDoc.
 */
function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleaned[key] = typeof val === 'object' && val !== null ? cleanFirestoreData(val) : val;
      }
    }
    return cleaned as T;
  }
  return data;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, isAdmin } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>(() => getCachedExpenses());
  const [deposits, setDeposits] = useState<Deposit[]>(() => getCachedDeposits());
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(DEFAULT_PAYMENT_METHODS);
  const [depositTypes, setDepositTypes] = useState<DepositTypeItem[]>(DEFAULT_DEPOSIT_TYPES);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [familySettings, setFamilySettings] = useState<FamilySettings>(DEFAULT_FAMILY_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Toast confirmation notification state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, message, type });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const [syncStatus, setSyncStatus] = useState<SyncState>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'
  );
  const [pendingCount, setPendingCount] = useState<number>(getPendingQueue().length);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem('family_expense_last_sync_timestamp');
      if (saved) {
        const parsed = new Date(saved);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    } catch {}
    return new Date();
  });

  const markSyncSuccess = useCallback(() => {
    const now = new Date();
    setLastSyncTime(now);
    try {
      localStorage.setItem('family_expense_last_sync_timestamp', now.toISOString());
    } catch {}
  }, []);

  const lastSyncFormatted = useMemo(() => {
    const day = String(lastSyncTime.getDate()).padStart(2, '0');
    const month = String(lastSyncTime.getMonth() + 1).padStart(2, '0');
    const year = String(lastSyncTime.getFullYear()).slice(-2);
    const time = lastSyncTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `Last Synced ${day}-${month}-${year} at ${time}`;
  }, [lastSyncTime]);

  // Selected Month filter for dashboard and overview (format: "YYYY-MM", defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Currency Formatter - strictly Indian Rupee ₹
  const formatCurrency = useCallback((amount: number) => {
    const num = Number(amount || 0);
    return `₹ ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }, []);

  // Record an Activity Log
  const logActivity = useCallback(
    async (action: string, details: string) => {
      if (!userProfile) return;
      const logId = 'log_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const logItem: ActivityLog = {
        id: logId,
        action,
        details,
        userId: userProfile.id,
        userName: userProfile.displayName,
        timestamp: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        enqueuePendingItem({ id: logId, type: 'LOG', action: 'CREATE', data: logItem });
        setActivityLogs((prev) => [logItem, ...prev.slice(0, 49)]);
        return;
      }

      try {
        await setDoc(doc(db, 'activityLogs', logId), logItem);
      } catch (e) {
        console.warn('Could not write activity log to Firestore:', e);
      }
    },
    [userProfile]
  );

  // Process Offline Queue when online
  const processQueue = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    const queue = getPendingQueue();
    setPendingCount(queue.length);
    if (queue.length === 0) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    let hasError = false;

    for (const item of queue) {
      try {
        const cleanedData = cleanFirestoreData(item.data);
        if (item.type === 'EXPENSE') {
          if (item.action === 'CREATE' || item.action === 'UPDATE') {
            await setDoc(doc(db, 'expenses', item.id), cleanedData, { merge: true });
          } else if (item.action === 'DELETE') {
            await deleteDoc(doc(db, 'expenses', item.id));
          }
        } else if (item.type === 'DEPOSIT') {
          if (item.action === 'CREATE' || item.action === 'UPDATE') {
            await setDoc(doc(db, 'deposits', item.id), cleanedData, { merge: true });
          } else if (item.action === 'DELETE') {
            await deleteDoc(doc(db, 'deposits', item.id));
          }
        } else if (item.type === 'LOG' && item.action === 'CREATE') {
          await setDoc(doc(db, 'activityLogs', item.id), cleanedData);
        }
        dequeuePendingItem(item.id, item.action);
      } catch (err) {
        console.error('Failed to sync queue item:', item, err);
        hasError = true;
      }
    }

    const remaining = getPendingQueue().length;
    setPendingCount(remaining);
    setSyncStatus(hasError ? 'error' : 'synced');
    if (!hasError) {
      markSyncSuccess();
    }
  }, [markSyncSuccess]);

  // Manual sync trigger
  const manualSync = async () => {
    await processQueue();
    markSyncSuccess();
  };

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      processQueue();
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  // Real-time Firestore Listeners (only when authenticated)
  useEffect(() => {
    if (!userProfile) return;

    // 1. Expenses Listener
    const unsubscribeExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
        });
        // Sort newest first (descending: date first, then createdAt)
        list.sort((a, b) => {
          const dateDiff = (b.date || '').localeCompare(a.date || '');
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        setExpenses(list);
        saveCachedExpenses(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    );

    // 2. Deposits Listener
    const unsubscribeDeposits = onSnapshot(
      collection(db, 'deposits'),
      (snapshot) => {
        const list: Deposit[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Deposit);
        });
        // Sort newest first (descending: date first, then createdAt)
        list.sort((a, b) => {
          const dateDiff = (b.date || '').localeCompare(a.date || '');
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        setDeposits(list);
        saveCachedDeposits(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'deposits');
      }
    );

    // 3. Categories Listener
    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CategoryItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as CategoryItem);
          });
          setCategories(list);
        } else {
          // If Firestore categories collection is empty, seed defaults
          DEFAULT_CATEGORIES.forEach(async (cat) => {
            try {
              await setDoc(doc(db, 'categories', cat.id), cat);
            } catch (e) {
              // Ignore seed collision
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    // 3b. Payment Methods Listener
    const unsubscribePaymentMethods = onSnapshot(
      collection(db, 'paymentMethods'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PaymentMethodItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as PaymentMethodItem);
          });
          setPaymentMethods(list);
        } else {
          DEFAULT_PAYMENT_METHODS.forEach(async (pm) => {
            try {
              await setDoc(doc(db, 'paymentMethods', pm.id), pm);
            } catch (e) {
              // Ignore seed collision
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'paymentMethods');
      }
    );

    // 3c. Deposit Types Listener
    const unsubscribeDepositTypes = onSnapshot(
      collection(db, 'depositTypes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: DepositTypeItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as DepositTypeItem);
          });
          setDepositTypes(list);
        } else {
          DEFAULT_DEPOSIT_TYPES.forEach(async (dt) => {
            try {
              await setDoc(doc(db, 'depositTypes', dt.id), dt);
            } catch (e) {
              // Ignore seed collision
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'depositTypes');
      }
    );

    // 4. Family Members Listener
    const unsubscribeMembers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setMembers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    // 5. Family Settings Listener
    const unsubscribeSettings = onSnapshot(
      doc(db, 'familySettings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as FamilySettings;
          setFamilySettings(data);
          try {
            localStorage.setItem('family_settings_cache', JSON.stringify(data));
            if (data.appVersion) {
              localStorage.setItem('family_app_version', data.appVersion);
            }
          } catch {
            // ignore
          }
        } else {
          // Initialize defaults
          setDoc(doc(db, 'familySettings', 'general'), {
            ...DEFAULT_FAMILY_SETTINGS,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'familySettings/general');
      }
    );

    // 6. Activity Logs Listener (admin only)
    let unsubscribeLogs = () => {};
    if (isAdmin) {
      unsubscribeLogs = onSnapshot(
        query(collection(db, 'activityLogs'), limit(30)),
        (snapshot) => {
          const list: ActivityLog[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivityLogs(list);
        },
        (error) => {
          // Admin logs may be optional if rules are tight
          console.warn('Activity log listener:', error);
        }
      );
    }

    // Process any offline queue items
    processQueue();

    return () => {
      unsubscribeExpenses();
      unsubscribeDeposits();
      unsubscribeCategories();
      unsubscribePaymentMethods();
      unsubscribeDepositTypes();
      unsubscribeMembers();
      unsubscribeSettings();
      unsubscribeLogs();
    };
  }, [userProfile, isAdmin, processQueue]);

  // Add Expense
  const addExpense = async (
    itemData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<boolean> => {
    if (!userProfile) return false;

    const id = 'exp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newExpense: Expense = {
      ...itemData,
      id,
      createdBy: userProfile.id,
      createdAt: now,
      updatedAt: now,
      isPendingSync: !navigator.onLine,
    };

    // Optimistic UI update
    setExpenses((prev) => {
      const updated = [newExpense, ...prev];
      saveCachedExpenses(updated);
      return updated;
    });

    logActivity('ADD_EXPENSE', `Added expense: "${itemData.title}" for ${formatCurrency(itemData.amount)}`);

    const cleanedExpense = cleanFirestoreData(newExpense);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'CREATE', data: cleanedExpense });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Expense added (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'expenses', id), cleanedExpense);
      setSyncStatus('synced');
      showToast('Expense added successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'CREATE', data: cleanedExpense });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.CREATE, `expenses/${id}`);
      return false;
    }
  };

  // Update Expense
  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<boolean> => {
    const now = new Date().toISOString();
    const existing = expenses.find((e) => e.id === id);

    // Compute changes for detailed edit history
    const changes: EditHistoryChange[] = [];
    if (existing) {
      if (updates.title !== undefined && updates.title !== existing.title) {
        changes.push({ field: 'Title', from: existing.title, to: updates.title });
      }
      if (updates.amount !== undefined && Number(updates.amount) !== Number(existing.amount)) {
        changes.push({
          field: 'Amount',
          from: `₹ ${Number(existing.amount).toLocaleString('en-IN')}`,
          to: `₹ ${Number(updates.amount).toLocaleString('en-IN')}`,
        });
      }
      if (updates.category !== undefined && updates.category !== existing.category) {
        changes.push({ field: 'Category', from: existing.category, to: updates.category });
      }
      if (updates.date !== undefined && updates.date !== existing.date) {
        changes.push({ field: 'Date', from: existing.date, to: updates.date });
      }
      if (updates.paymentMethod !== undefined && updates.paymentMethod !== existing.paymentMethod) {
        changes.push({ field: 'Payment Method', from: existing.paymentMethod, to: updates.paymentMethod });
      }
      if (updates.paidByName !== undefined && updates.paidByName !== existing.paidByName) {
        changes.push({ field: 'Paid By', from: existing.paidByName, to: updates.paidByName });
      }
      if (updates.description !== undefined && (updates.description || '') !== (existing.description || '')) {
        changes.push({
          field: 'Remarks',
          from: existing.description || 'None',
          to: updates.description || 'None',
        });
      }
    }

    let editHistory = existing?.editHistory || [];
    let isEdited = existing?.isEdited || false;

    if (changes.length > 0) {
      isEdited = true;
      const historyEntry: EditHistoryItem = {
        timestamp: now,
        editedBy: userProfile?.id || 'unknown',
        editedByName: userProfile?.displayName || 'User',
        changes,
      };
      editHistory = [historyEntry, ...editHistory];
    }

    const payload: Partial<Expense> = {
      ...updates,
      updatedAt: now,
      isEdited,
      editHistory,
    };

    // Optimistic UI update
    setExpenses((prev) => {
      const updated = prev.map((exp) => (exp.id === id ? ({ ...exp, ...payload } as Expense) : exp));
      saveCachedExpenses(updated);
      return updated;
    });

    logActivity('UPDATE_EXPENSE', `Updated expense "${updates.title || id}"`);

    const cleanedPayload = cleanFirestoreData(payload);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'UPDATE', data: cleanedPayload });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Expense updated (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'expenses', id), cleanedPayload);
      setSyncStatus('synced');
      showToast('Expense updated successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'UPDATE', data: cleanedPayload });
      setPendingCount(getPendingQueue().length);
      handleFirestoreError(error, OperationType.UPDATE, `expenses/${id}`);
      return false;
    }
  };

  // Delete Expense
  const deleteExpense = async (id: string): Promise<boolean> => {
    const toDelete = expenses.find((e) => e.id === id);

    // Optimistic UI update
    setExpenses((prev) => {
      const updated = prev.filter((exp) => exp.id !== id);
      saveCachedExpenses(updated);
      return updated;
    });

    logActivity('DELETE_EXPENSE', `Deleted expense "${toDelete?.title || id}"`);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'DELETE', data: { id } });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Expense deleted (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'expenses', id));
      setSyncStatus('synced');
      showToast('Expense deleted successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'EXPENSE', action: 'DELETE', data: { id } });
      setPendingCount(getPendingQueue().length);
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
      return false;
    }
  };

  // Add Deposit
  const addDeposit = async (
    itemData: Omit<Deposit, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<boolean> => {
    if (!userProfile) return false;

    const id = 'dep_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const newDeposit: Deposit = {
      ...itemData,
      id,
      createdBy: userProfile.id,
      createdAt: now,
      updatedAt: now,
      isPendingSync: !navigator.onLine,
    };

    setDeposits((prev) => {
      const updated = [newDeposit, ...prev];
      saveCachedDeposits(updated);
      return updated;
    });

    logActivity('ADD_DEPOSIT', `Added deposit: "${itemData.title}" of ${formatCurrency(itemData.amount)}`);

    const cleanedDeposit = cleanFirestoreData(newDeposit);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'CREATE', data: cleanedDeposit });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Deposit added (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'deposits', id), cleanedDeposit);
      setSyncStatus('synced');
      showToast('Deposit added successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'CREATE', data: cleanedDeposit });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.CREATE, `deposits/${id}`);
      return false;
    }
  };

  // Update Deposit
  const updateDeposit = async (id: string, updates: Partial<Deposit>): Promise<boolean> => {
    const now = new Date().toISOString();
    const existing = deposits.find((d) => d.id === id);

    // Compute changes for detailed edit history
    const changes: EditHistoryChange[] = [];
    if (existing) {
      if (updates.title !== undefined && updates.title !== existing.title) {
        changes.push({ field: 'Title', from: existing.title, to: updates.title });
      }
      if (updates.amount !== undefined && Number(updates.amount) !== Number(existing.amount)) {
        changes.push({
          field: 'Amount',
          from: `₹ ${Number(existing.amount).toLocaleString('en-IN')}`,
          to: `₹ ${Number(updates.amount).toLocaleString('en-IN')}`,
        });
      }
      if (updates.depositType !== undefined && updates.depositType !== existing.depositType) {
        changes.push({ field: 'Deposit Type', from: existing.depositType || 'General', to: updates.depositType });
      }
      if (updates.date !== undefined && updates.date !== existing.date) {
        changes.push({ field: 'Date', from: existing.date, to: updates.date });
      }
      if (updates.paymentMethod !== undefined && updates.paymentMethod !== existing.paymentMethod) {
        changes.push({ field: 'Payment Method', from: existing.paymentMethod, to: updates.paymentMethod });
      }
      if (updates.depositedByName !== undefined && updates.depositedByName !== existing.depositedByName) {
        changes.push({ field: 'Deposit By', from: existing.depositedByName, to: updates.depositedByName });
      }
      if (updates.description !== undefined && (updates.description || '') !== (existing.description || '')) {
        changes.push({
          field: 'Remarks',
          from: existing.description || 'None',
          to: updates.description || 'None',
        });
      }
    }

    let editHistory = existing?.editHistory || [];
    let isEdited = existing?.isEdited || false;

    if (changes.length > 0) {
      isEdited = true;
      const historyEntry: EditHistoryItem = {
        timestamp: now,
        editedBy: userProfile?.id || 'unknown',
        editedByName: userProfile?.displayName || 'User',
        changes,
      };
      editHistory = [historyEntry, ...editHistory];
    }

    const payload: Partial<Deposit> = {
      ...updates,
      updatedAt: now,
      isEdited,
      editHistory,
    };

    setDeposits((prev) => {
      const updated = prev.map((dep) => (dep.id === id ? ({ ...dep, ...payload } as Deposit) : dep));
      saveCachedDeposits(updated);
      return updated;
    });

    logActivity('UPDATE_DEPOSIT', `Updated deposit "${updates.title || id}"`);

    const cleanedPayload = cleanFirestoreData(payload);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'UPDATE', data: cleanedPayload });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Deposit updated (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'deposits', id), cleanedPayload);
      setSyncStatus('synced');
      showToast('Deposit updated successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'UPDATE', data: cleanedPayload });
      setPendingCount(getPendingQueue().length);
      handleFirestoreError(error, OperationType.UPDATE, `deposits/${id}`);
      return false;
    }
  };

  // Delete Deposit
  const deleteDeposit = async (id: string): Promise<boolean> => {
    const toDelete = deposits.find((d) => d.id === id);

    setDeposits((prev) => {
      const updated = prev.filter((dep) => dep.id !== id);
      saveCachedDeposits(updated);
      return updated;
    });

    logActivity('DELETE_DEPOSIT', `Deleted deposit "${toDelete?.title || id}"`);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'DELETE', data: { id } });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      showToast('Deposit deleted (saved offline)');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'deposits', id));
      setSyncStatus('synced');
      showToast('Deposit deleted successfully');
      return true;
    } catch (error) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'DELETE', data: { id } });
      setPendingCount(getPendingQueue().length);
      handleFirestoreError(error, OperationType.DELETE, `deposits/${id}`);
      return false;
    }
  };

  // Category Management
  const addCategory = async (cat: Omit<CategoryItem, 'id'>): Promise<boolean> => {
    const id = 'cat_' + Date.now().toString(36);
    const newCat = { ...cat, id };
    setCategories((prev) => [...prev, newCat]);
    try {
      await setDoc(doc(db, 'categories', id), newCat);
      logActivity('ADD_CATEGORY', `Created category: "${cat.name}"`);
      showToast(`Category "${cat.name}" added successfully`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to add category', 'error');
      return false;
    }
  };

  const updateCategory = async (id: string, updates: Partial<CategoryItem>): Promise<boolean> => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await updateDoc(doc(db, 'categories', id), cleanFirestoreData(updates));
      logActivity('UPDATE_CATEGORY', `Updated category "${updates.name || id}"`);
      showToast('Category updated successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to update category', 'error');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'categories', id));
      logActivity('DELETE_CATEGORY', `Deleted category`);
      showToast('Category deleted successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to delete category', 'error');
      return false;
    }
  };

  // Payment Method Management
  const addPaymentMethod = async (pm: Omit<PaymentMethodItem, 'id'>): Promise<boolean> => {
    const id = 'pm_' + Date.now().toString(36);
    const newPm: PaymentMethodItem = { ...pm, id };
    setPaymentMethods((prev) => [...prev, newPm]);
    try {
      await setDoc(doc(db, 'paymentMethods', id), newPm);
      logActivity('ADD_PAYMENT_METHOD', `Added payment method: "${pm.name}"`);
      showToast(`Payment method "${pm.name}" added successfully`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to add payment method', 'error');
      return false;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethodItem>): Promise<boolean> => {
    setPaymentMethods((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await updateDoc(doc(db, 'paymentMethods', id), cleanFirestoreData(updates));
      logActivity('UPDATE_PAYMENT_METHOD', `Updated payment method "${updates.name || id}"`);
      showToast('Payment method updated successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to update payment method', 'error');
      return false;
    }
  };

  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
      logActivity('DELETE_PAYMENT_METHOD', `Deleted payment method`);
      showToast('Payment method deleted successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to delete payment method', 'error');
      return false;
    }
  };

  // Deposit Type Management
  const addDepositType = async (dt: Omit<DepositTypeItem, 'id'>): Promise<boolean> => {
    const id = 'dt_' + Date.now().toString(36);
    const newDt: DepositTypeItem = { ...dt, id };
    setDepositTypes((prev) => [...prev, newDt]);
    try {
      await setDoc(doc(db, 'depositTypes', id), newDt);
      logActivity('ADD_DEPOSIT_TYPE', `Added deposit type: "${dt.name}"`);
      showToast(`Deposit type "${dt.name}" added successfully`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to add deposit type', 'error');
      return false;
    }
  };

  const updateDepositType = async (id: string, updates: Partial<DepositTypeItem>): Promise<boolean> => {
    setDepositTypes((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await updateDoc(doc(db, 'depositTypes', id), cleanFirestoreData(updates));
      logActivity('UPDATE_DEPOSIT_TYPE', `Updated deposit type "${updates.name || id}"`);
      showToast('Deposit type updated successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to update deposit type', 'error');
      return false;
    }
  };

  const deleteDepositType = async (id: string): Promise<boolean> => {
    const target = depositTypes.find((item) => item.id === id);
    setDepositTypes((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'depositTypes', id));
      logActivity('DELETE_DEPOSIT_TYPE', `Deleted deposit type`);
      showToast(`Deposit type "${target?.name || 'Item'}" deleted successfully`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to delete deposit type', 'error');
      return false;
    }
  };

  // Family Settings
  const updateFamilySettings = async (settings: Partial<FamilySettings>): Promise<boolean> => {
    const updated = { ...familySettings, ...settings, updatedAt: new Date().toISOString() };
    setFamilySettings(updated);
    try {
      localStorage.setItem('family_settings_cache', JSON.stringify(updated));
      if (updated.appVersion) {
        localStorage.setItem('family_app_version', updated.appVersion);
      }
    } catch {
      // ignore
    }
    try {
      await setDoc(doc(db, 'familySettings', 'general'), updated, { merge: true });
      logActivity('UPDATE_SETTINGS', 'Updated family settings');
      showToast('Changes saved successfully');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to save settings', 'error');
      return false;
    }
  };

  // Member Status & Role Toggle
  const toggleMemberActive = async (memberId: string, currentStatus: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
      });
      logActivity('TOGGLE_MEMBER_STATUS', `Set member ${memberId} status to ${!currentStatus ? 'Active' : 'Deactivated'}`);
      showToast(`Member account ${!currentStatus ? 'activated' : 'deactivated'}`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to update member status', 'error');
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, newRole: 'admin' | 'user'): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'users', memberId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      logActivity('UPDATE_MEMBER_ROLE', `Changed member ${memberId} role to ${newRole}`);
      showToast(`Member role updated to ${newRole}`);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Failed to update member role', 'error');
      return false;
    }
  };

  const updateMember = async (
    memberId: string,
    updates: { displayName?: string; password?: string; role?: UserRole }
  ): Promise<boolean> => {
    try {
      const payload: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      if (updates.displayName !== undefined && updates.displayName.trim()) {
        payload.displayName = updates.displayName.trim();
      }
      if (updates.password !== undefined && updates.password.trim()) {
        payload.password = await hashPassword(updates.password.trim());
      }
      if (updates.role) {
        payload.role = updates.role;
      }
      await updateDoc(doc(db, 'users', memberId), payload);
      logActivity('UPDATE_MEMBER', `Updated member account "${updates.displayName || memberId}"`);
      showToast('Member details updated successfully');
      return true;
    } catch (e) {
      console.error('Failed to update member:', e);
      showToast('Failed to update member', 'error');
      return false;
    }
  };

  const deleteMember = async (memberId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'users', memberId));
      logActivity('DELETE_MEMBER', `Deleted member account ${memberId}`);
      showToast('Member account deleted successfully');
      return true;
    } catch (e) {
      console.error('Failed to delete member:', e);
      showToast('Failed to delete member', 'error');
      return false;
    }
  };

  const wipeAllData = async (): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      setSyncStatus('syncing');

      // 1. Delete all expenses from Firestore
      const expSnap = await getDocs(collection(db, 'expenses'));
      for (const docSnap of expSnap.docs) {
        await deleteDoc(docSnap.ref).catch(() => {});
      }
      setExpenses([]);
      saveCachedExpenses([]);

      // 2. Delete all deposits from Firestore
      const depSnap = await getDocs(collection(db, 'deposits'));
      for (const docSnap of depSnap.docs) {
        await deleteDoc(docSnap.ref).catch(() => {});
      }
      setDeposits([]);
      saveCachedDeposits([]);

      // 3. Clear all local offline pending queue items and cached data
      savePendingQueue([]);
      localStorage.removeItem('family_expense_pending_queue_v1');
      localStorage.removeItem('family_expense_cached_expenses_v1');
      localStorage.removeItem('family_expense_cached_deposits_v1');
      setPendingCount(0);

      // 4. Mark setup permanently completed in device storage and in Firestore familySettings
      localStorage.setItem('family_ledger_seeded_or_wiped', 'true');
      await setDoc(
        doc(db, 'familySettings', 'general'),
        { isSetupCompleted: true, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});

      logActivity('WIPE_ALL_DATA', 'Admin executed complete ledger wipeout: all expenses and deposits cleared');
      setSyncStatus('synced');
      showToast('Ledger wiped clean. Ready for fresh real data!');
      return true;
    } catch (e) {
      console.error('Error wiping data:', e);
      setSyncStatus('error');
      showToast('Failed to wipe data', 'error');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        expenses,
        deposits,
        categories,
        paymentMethods,
        depositTypes,
        members,
        familySettings,
        activityLogs,
        syncStatus,
        pendingCount,
        formatCurrency,
        formatDate,
        addExpense,
        updateExpense,
        deleteExpense,
        addDeposit,
        updateDeposit,
        deleteDeposit,
        addCategory,
        updateCategory,
        deleteCategory,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        addDepositType,
        updateDepositType,
        deleteDepositType,
        updateFamilySettings,
        toggleMemberActive,
        updateMemberRole,
        updateMember,
        deleteMember,
        manualSync,
        wipeAllData,
        selectedMonth,
        setSelectedMonth,
        lastSyncTime,
        lastSyncFormatted,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
