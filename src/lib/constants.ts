import { CategoryItem, PaymentMethodItem } from '../types';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#F59E0B', isDefault: true },
  { id: 'cat-electricity', name: 'Electricity', icon: 'Zap', color: '#3B82F6', isDefault: true },
  { id: 'cat-water', name: 'Water', icon: 'Droplets', color: '#06B6D4', isDefault: true },
  { id: 'cat-rent', name: 'Rent / House Maintenance', icon: 'Home', color: '#8B5CF6', isDefault: true },
  { id: 'cat-medical', name: 'Medical', icon: 'HeartPulse', color: '#EF4444', isDefault: true },
  { id: 'cat-transport', name: 'Transportation', icon: 'Car', color: '#10B981', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', icon: 'Tag', color: '#EC4899', isDefault: true },
  { id: 'cat-education', name: 'Education', icon: 'GraduationCap', color: '#6366F1', isDefault: true },
  { id: 'cat-travel', name: 'Travel', icon: 'Plane', color: '#14B8A6', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'Film', color: '#F97316', isDefault: true },
  { id: 'cat-other', name: 'Other', icon: 'MoreHorizontal', color: '#64748B', isDefault: true },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'pm-cash', name: 'Cash', isDefault: true },
  { id: 'pm-upi', name: 'UPI', isDefault: false },
  { id: 'pm-card', name: 'Card', isDefault: false },
  { id: 'pm-bank', name: 'Bank Transfer', isDefault: false },
  { id: 'pm-other', name: 'Other', isDefault: false },
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
] as const;

export const SUPPORTED_CURRENCIES = [
  { symbol: '₹', code: 'INR', label: 'Indian Rupee (₹)' },
];

export const DEFAULT_FAMILY_SETTINGS = {
  familyName: 'Our Family',
  currency: '₹',
  dateFormat: 'DD-MM-YY',
};
