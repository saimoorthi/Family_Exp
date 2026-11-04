import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const EXCLUDED_KEYS = new Set([
  'createLucideIcon',
  'default',
  'icons',
  'LucideIcon',
  'LucideProps',
  'IconNode',
]);

/**
 * All valid, dynamically discovered Lucide Icon Component names from lucide-react (1400+ icons)
 */
export const ALL_LUCIDE_KEYS: string[] = Object.keys(LucideIcons).filter((key) => {
  if (EXCLUDED_KEYS.has(key)) return false;
  if (!/^[A-Z]/.test(key)) return false;
  const val = (LucideIcons as Record<string, any>)[key];
  return (
    typeof val === 'function' ||
    (typeof val === 'object' && val !== null && ('render' in val || '$$typeof' in val))
  );
});

/**
 * Convert any string (kebab-case, snake_case, spaces) to PascalCase
 * e.g. "spray-can" -> "SprayCan", "car-taxi-front" -> "CarTaxiFront"
 */
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Convert PascalCase to lucide.dev kebab-case format
 * e.g. "SprayCan" -> "spray-can", "CarTaxiFront" -> "car-taxi-front"
 */
export function pascalToKebab(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Semantic keyword aliases mapping common english category search words to real Lucide icons
 */
const KEYWORD_MAP: Record<string, string[]> = {
  clean: ['Brush', 'Sparkles', 'SprayCan', 'WashingMachine', 'Paintbrush', 'Bath'],
  cleaning: ['Brush', 'Sparkles', 'SprayCan', 'WashingMachine', 'Bath'],
  brush: ['Brush', 'Paintbrush'],
  food: ['Utensils', 'UtensilsCrossed', 'Pizza', 'Coffee', 'Apple', 'Cake', 'Sandwich', 'Soup', 'CookingPot'],
  grocery: ['ShoppingBag', 'ShoppingCart', 'Store', 'Apple', 'Carrot', 'Milk'],
  groceries: ['ShoppingBag', 'ShoppingCart', 'Store', 'Apple', 'Carrot', 'Milk'],
  fruit: ['Apple', 'Cherry', 'Banana'],
  medical: ['HeartPulse', 'Stethoscope', 'Pill', 'Syringe', 'Hospital', 'Activity'],
  health: ['HeartPulse', 'Heart', 'Stethoscope', 'Pill', 'Activity', 'Dumbbell'],
  doctor: ['Stethoscope', 'Hospital', 'HeartPulse', 'Pill'],
  gym: ['Dumbbell', 'Activity', 'Bike', 'HeartPulse'],
  fitness: ['Dumbbell', 'Activity', 'Bike', 'HeartPulse'],
  travel: ['Plane', 'Train', 'Bus', 'Car', 'Hotel', 'Luggage', 'Compass'],
  car: ['Car', 'CarFront', 'CarTaxiFront', 'CableCar', 'Fuel'],
  cab: ['CarTaxiFront', 'Car', 'CarFront'],
  taxi: ['CarTaxiFront', 'Car'],
  fuel: ['Fuel', 'Flame', 'Zap'],
  pet: ['Dog', 'Cat', 'Fish', 'Bird'],
  pets: ['Dog', 'Cat', 'Fish', 'Bird'],
  bill: ['Receipt', 'ReceiptIndianRupee', 'FileText', 'Zap', 'Droplets'],
  bills: ['Receipt', 'ReceiptIndianRupee', 'FileText', 'Zap', 'Droplets'],
  shopping: ['ShoppingBag', 'ShoppingCart', 'Tag', 'Store', 'Package'],
  clothes: ['Shirt', 'Scissors', 'Sparkles'],
  cloth: ['Shirt', 'Scissors'],
  home: ['Home', 'Bed', 'Bath', 'Sofa', 'Lamp', 'Tv', 'DoorClosed'],
  house: ['Home', 'Bed', 'Bath', 'Sofa', 'Lamp'],
  money: ['Wallet', 'Coins', 'CreditCard', 'Landmark', 'Banknote', 'ReceiptIndianRupee'],
  cash: ['Wallet', 'Coins', 'CreditCard', 'Banknote', 'ReceiptIndianRupee'],
  education: ['GraduationCap', 'Book', 'BookOpen', 'Laptop', 'School'],
  school: ['GraduationCap', 'Book', 'BookOpen', 'School'],
  entertainment: ['Film', 'Tv', 'Gamepad2', 'Music', 'Ticket', 'PartyPopper'],
  gaming: ['Gamepad2', 'Gamepad', 'Tv'],
  game: ['Gamepad2', 'Gamepad', 'Tv'],
  utilities: ['Zap', 'Droplets', 'Flame', 'Lightbulb', 'Wifi'],
  electric: ['Zap', 'Lightbulb', 'Plug', 'Power'],
  water: ['Droplets', 'Bath', 'ShowerHead'],
};

// Popular starter icons for default display
const POPULAR_STARTER_ICONS = [
  'ShoppingBag',
  'ShoppingCart',
  'Utensils',
  'UtensilsCrossed',
  'Coffee',
  'Pizza',
  'Cake',
  'Brush',
  'Sparkles',
  'SprayCan',
  'WashingMachine',
  'Home',
  'Car',
  'CarTaxiFront',
  'Fuel',
  'Bike',
  'Bus',
  'Train',
  'Plane',
  'Zap',
  'Droplets',
  'Flame',
  'Lightbulb',
  'HeartPulse',
  'Pill',
  'Stethoscope',
  'Dumbbell',
  'Baby',
  'Dog',
  'Cat',
  'Shirt',
  'GraduationCap',
  'BookOpen',
  'Laptop',
  'Film',
  'Tv',
  'Gamepad2',
  'Music',
  'ReceiptIndianRupee',
  'Wallet',
  'CreditCard',
  'Wifi',
  'Gift',
  'PartyPopper',
  'Shield',
  'Tag',
  'Package',
  'MoreHorizontal',
];

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  className = 'w-5 h-5',
  color,
  size = 20,
}) => {
  const all = LucideIcons as Record<string, any>;
  if (!name) {
    const Fallback = all.Tag || all.FolderTree;
    return <Fallback className={className} size={size} style={color ? { color } : undefined} />;
  }

  // 1. Direct key match (e.g. "SprayCan" or "Brush")
  let Comp = all[name];

  // 2. PascalCase conversion (e.g. "spray-can" -> "SprayCan")
  if (!Comp) {
    const pascal = toPascalCase(name);
    Comp = all[pascal];
  }

  // 3. Case-insensitive lookup across all 1400+ Lucide keys
  if (!Comp) {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const matchedKey = ALL_LUCIDE_KEYS.find((k) => k.toLowerCase() === clean);
    if (matchedKey) {
      Comp = all[matchedKey];
    }
  }

  if (Comp && (typeof Comp === 'function' || typeof Comp === 'object')) {
    return <Comp className={className} size={size} style={color ? { color } : undefined} />;
  }

  // 4. Default Fallback
  const Fallback = all.Tag || all.FolderTree;
  return <Fallback className={className} size={size} style={color ? { color } : undefined} />;
};

export interface SearchedIconItem {
  name: string; // PascalCase component name (stored in category item)
  label: string; // lucide.dev kebab name
}

/**
 * Dynamically search and pull from the complete Lucide library (1400+ icons)
 * Supports:
 * - Exact lucide.dev kebab-case names: e.g. "spray-can", "car-taxi-front", "cookie", "anvil"
 * - Component names: e.g. "SprayCan", "CarTaxiFront"
 * - Partial search keywords: e.g. "car", "clean", "brush", "spray", "gym", "food"
 */
export function searchLucideIcons(query: string): SearchedIconItem[] {
  const raw = (query || '').trim();
  const cleanQ = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  // If query is empty, return popular starter icons
  if (!cleanQ) {
    return POPULAR_STARTER_ICONS.filter((name) => ALL_LUCIDE_KEYS.includes(name)).map((name) => ({
      name,
      label: `${pascalToKebab(name)} (${name})`,
    }));
  }

  const results: SearchedIconItem[] = [];
  const added = new Set<string>();

  const addMatch = (key: string) => {
    if (!added.has(key) && ALL_LUCIDE_KEYS.includes(key)) {
      added.add(key);
      results.push({
        name: key,
        label: `${pascalToKebab(key)} (${key})`,
      });
    }
  };

  // 1. Exact match from query (either kebab or pascal)
  // e.g. user typed "spray-can" or "spraycan" or "SprayCan"
  const pascalInput = toPascalCase(raw);
  if (ALL_LUCIDE_KEYS.includes(pascalInput)) {
    addMatch(pascalInput);
  }

  // Exact lowercase match
  for (const key of ALL_LUCIDE_KEYS) {
    if (key.toLowerCase() === cleanQ) {
      addMatch(key);
    }
  }

  // 2. Starts with query (e.g. "car" -> "Car", "CarFront", "CarTaxiFront"...)
  for (const key of ALL_LUCIDE_KEYS) {
    if (results.length >= 60) break;
    const lowerKey = key.toLowerCase();
    const kebab = pascalToKebab(key);
    if (lowerKey.startsWith(cleanQ) || kebab.startsWith(raw.toLowerCase())) {
      addMatch(key);
    }
  }

  // 3. Keyword Semantic Aliases (e.g. "cleaning" -> Brush, Sparkles, SprayCan...)
  if (KEYWORD_MAP[cleanQ]) {
    for (const alias of KEYWORD_MAP[cleanQ]) {
      if (results.length >= 60) break;
      addMatch(alias);
    }
  }

  // Also check if any KEYWORD_MAP key is contained in cleanQ or vice-versa
  Object.entries(KEYWORD_MAP).forEach(([kw, aliases]) => {
    if (results.length >= 60) return;
    if (cleanQ.includes(kw) || kw.includes(cleanQ)) {
      aliases.forEach((alias) => addMatch(alias));
    }
  });

  // 4. Substring / Includes match across all 1400+ Lucide icons
  for (const key of ALL_LUCIDE_KEYS) {
    if (results.length >= 60) break;
    const lowerKey = key.toLowerCase();
    const kebab = pascalToKebab(key);
    if (lowerKey.includes(cleanQ) || kebab.includes(raw.toLowerCase())) {
      addMatch(key);
    }
  }

  return results;
}

// Backwards-compatible export
export const ICON_REGISTRY: Record<string, { icon: LucideIcon; label: string; keywords: string[] }> = {};
