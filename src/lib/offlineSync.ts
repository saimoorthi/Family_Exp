import { Expense, Deposit, ActivityLog } from '../types';

export interface PendingItem {
  id: string;
  type: 'EXPENSE' | 'DEPOSIT' | 'LOG';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY_PENDING_QUEUE = 'family_expense_pending_queue_v1';
const STORAGE_KEY_LOCAL_EXPENSES = 'family_expense_cached_expenses_v1';
const STORAGE_KEY_LOCAL_DEPOSITS = 'family_expense_cached_deposits_v1';

// Get all pending sync items
export function getPendingQueue(): PendingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read pending queue:', e);
    return [];
  }
}

// Save pending sync queue
export function savePendingQueue(queue: PendingItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save pending queue:', e);
  }
}

// Enqueue a pending item
export function enqueuePendingItem(item: Omit<PendingItem, 'timestamp' | 'retryCount'>): void {
  const queue = getPendingQueue();
  // Avoid duplicate enqueue for same id and action
  const filtered = queue.filter(
    (existing) => !(existing.id === item.id && existing.action === item.action)
  );
  filtered.push({
    ...item,
    timestamp: Date.now(),
    retryCount: 0,
  });
  savePendingQueue(filtered);
}

// Remove an item from the pending queue after successful sync
export function dequeuePendingItem(id: string, action: string): void {
  const queue = getPendingQueue();
  const filtered = queue.filter(
    (item) => !(item.id === id && item.action === action)
  );
  savePendingQueue(filtered);
}

// Cache local expenses for instant offline availability
export function getCachedExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_EXPENSES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.warn('Failed to cache expenses locally:', e);
  }
}

// Cache local deposits for instant offline availability
export function getCachedDeposits(): Deposit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_DEPOSITS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedDeposits(deposits: Deposit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_DEPOSITS, JSON.stringify(deposits));
  } catch (e) {
    console.warn('Failed to cache deposits locally:', e);
  }
}
