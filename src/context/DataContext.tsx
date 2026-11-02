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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Expense,
  Deposit,
  CategoryItem,
  PaymentMethodItem,
  FamilySettings,
  UserProfile,
  ActivityLog,
  SyncState,
  EditHistoryItem,
  EditHistoryChange,
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, DEFAULT_FAMILY_SETTINGS } from '../lib/constants';
import {
  getPendingQueue,
  enqueuePendingItem,
  dequeuePendingItem,
  getCachedExpenses,
  saveCachedExpenses,
  getCachedDeposits,
  saveCachedDeposits,
} from '../lib/offlineSync';
import { useAuth } from './AuthContext';
import { formatDate } from '../lib/dateUtils';

interface DataContextType {
  expenses: Expense[];
  deposits: Deposit[];
  categories: CategoryItem[];
  paymentMethods: PaymentMethodItem[];
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
  updateFamilySettings: (settings: Partial<FamilySettings>) => Promise<boolean>;
  toggleMemberActive: (memberId: string, currentStatus: boolean) => Promise<boolean>;
  updateMemberRole: (memberId: string, newRole: 'admin' | 'user') => Promise<boolean>;
  manualSync: () => Promise<void>;
  wipeAllData: () => Promise<boolean>;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  lastSyncTime: Date;
  lastSyncFormatted: string;
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
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [familySettings, setFamilySettings] = useState<FamilySettings>(DEFAULT_FAMILY_SETTINGS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [syncStatus, setSyncStatus] = useState<SyncState>(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced'
  );
  const [pendingCount, setPendingCount] = useState<number>(getPendingQueue().length);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());

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
  }, []);

  // Manual sync trigger
  const manualSync = async () => {
    await processQueue();
    setLastSyncTime(new Date());
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
        // Sort newest first
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          setFamilySettings(docSnap.data() as FamilySettings);
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
        collection(db, 'activityLogs'),
        (snapshot) => {
          const list: ActivityLog[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivityLogs(list.slice(0, 50));
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
      return true;
    }

    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'expenses', id), cleanedExpense);
      setSyncStatus('synced');
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
      return true;
    }

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'expenses', id), cleanedPayload);
      setSyncStatus('synced');
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
      return true;
    }

    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'expenses', id));
      setSyncStatus('synced');
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
      return true;
    }

    try {
      setSyncStatus('syncing');
      await setDoc(doc(db, 'deposits', id), cleanedDeposit);
      setSyncStatus('synced');
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
    const payload = { ...updates, updatedAt: now };

    setDeposits((prev) => {
      const updated = prev.map((dep) => (dep.id === id ? { ...dep, ...payload } : dep));
      saveCachedDeposits(updated);
      return updated;
    });

    logActivity('UPDATE_DEPOSIT', `Updated deposit "${updates.title || id}"`);

    const cleanedPayload = cleanFirestoreData(payload);

    if (!navigator.onLine) {
      enqueuePendingItem({ id, type: 'DEPOSIT', action: 'UPDATE', data: cleanedPayload });
      setPendingCount(getPendingQueue().length);
      setSyncStatus('offline');
      return true;
    }

    try {
      setSyncStatus('syncing');
      await updateDoc(doc(db, 'deposits', id), cleanedPayload);
      setSyncStatus('synced');
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
      return true;
    }

    try {
      setSyncStatus('syncing');
      await deleteDoc(doc(db, 'deposits', id));
      setSyncStatus('synced');
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
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateCategory = async (id: string, updates: Partial<CategoryItem>): Promise<boolean> => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    try {
      await updateDoc(doc(db, 'categories', id), cleanFirestoreData(updates));
      logActivity('UPDATE_CATEGORY', `Updated category "${updates.name || id}"`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'categories', id));
      logActivity('DELETE_CATEGORY', `Deleted category`);
      return true;
    } catch (e) {
      console.error(e);
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
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethodItem>): Promise<boolean> => {
    setPaymentMethods((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    try {
      await updateDoc(doc(db, 'paymentMethods', id), cleanFirestoreData(updates));
      logActivity('UPDATE_PAYMENT_METHOD', `Updated payment method "${updates.name || id}"`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, 'paymentMethods', id));
      logActivity('DELETE_PAYMENT_METHOD', `Deleted payment method`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Family Settings
  const updateFamilySettings = async (settings: Partial<FamilySettings>): Promise<boolean> => {
    const updated = { ...familySettings, ...settings, updatedAt: new Date().toISOString() };
    setFamilySettings(updated);
    try {
      await setDoc(doc(db, 'familySettings', 'general'), updated, { merge: true });
      logActivity('UPDATE_SETTINGS', 'Updated family settings');
      return true;
    } catch (e) {
      console.error(e);
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
      return true;
    } catch (e) {
      console.error(e);
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
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const wipeAllData = async (): Promise<boolean> => {
    if (!isAdmin) return false;
    try {
      setSyncStatus('syncing');
      // Delete all expenses from Firestore
      for (const exp of expenses) {
        await deleteDoc(doc(db, 'expenses', exp.id)).catch(() => {});
      }
      setExpenses([]);
      saveCachedExpenses([]);

      // Delete all deposits from Firestore
      for (const dep of deposits) {
        await deleteDoc(doc(db, 'deposits', dep.id)).catch(() => {});
      }
      setDeposits([]);
      saveCachedDeposits([]);

      // Clear local queue
      localStorage.removeItem('family_expense_queue_v1');
      setPendingCount(0);

      logActivity('WIPE_ALL_DATA', 'Admin executed complete ledger wipeout: all expenses and deposits cleared');
      setSyncStatus('synced');
      return true;
    } catch (e) {
      console.error('Error wiping data:', e);
      setSyncStatus('error');
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
        updateFamilySettings,
        toggleMemberActive,
        updateMemberRole,
        manualSync,
        wipeAllData,
        selectedMonth,
        setSelectedMonth,
        lastSyncTime,
        lastSyncFormatted,
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
