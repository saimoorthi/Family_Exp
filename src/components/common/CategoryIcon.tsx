import React from 'react';
import {
  ShoppingBag,
  Zap,
  Droplets,
  Home,
  HeartPulse,
  Car,
  Tag,
  GraduationCap,
  Plane,
  Film,
  MoreHorizontal,
  Coffee,
  Smartphone,
  Gift,
  Briefcase,
  Shield,
  Utensils,
  ReceiptIndianRupee,
  Brush,
  Sparkles,
  Paintbrush,
  Wrench,
  Hammer,
  Scissors,
  Shirt,
  Baby,
  Dog,
  Cat,
  Fuel,
  Tv,
  Gamepad2,
  Dumbbell,
  Bike,
  Bus,
  Train,
  Truck,
  HeartHandshake,
  Activity,
  Pill,
  Stethoscope,
  UtensilsCrossed,
  Pizza,
  ShoppingCart,
  Store,
  Wallet,
  CreditCard,
  Coins,
  Landmark,
  BookOpen,
  Book,
  FileText,
  Laptop,
  Wifi,
  Music,
  Headphones,
  Camera,
  Ticket,
  Building,
  Hotel,
  Bath,
  Bed,
  Flame,
  Sun,
  CloudRain,
  PartyPopper,
  Cake,
  Smile,
  Heart,
  Package,
  Box,
  Lightbulb,
  Clock,
  Key,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';

export const ICON_REGISTRY: Record<string, { icon: LucideIcon; label: string; keywords: string[] }> = {
  // Cleaning & Home Maintenance
  Brush: { icon: Brush, label: 'Brush / Cleaning', keywords: ['brush', 'clean', 'cleaning', 'wash', 'sweep', 'scrub'] },
  Sparkles: { icon: Sparkles, label: 'Sparkles / Hygiene', keywords: ['clean', 'cleaning', 'shine', 'hygiene', 'sparkle', 'maid'] },
  Paintbrush: { icon: Paintbrush, label: 'Paintbrush / Decor', keywords: ['paint', 'decor', 'art', 'renovation', 'home'] },
  Wrench: { icon: Wrench, label: 'Wrench / Repairs', keywords: ['repair', 'tool', 'plumbing', 'mechanic', 'fix'] },
  Hammer: { icon: Hammer, label: 'Hammer / Construction', keywords: ['hammer', 'carpenter', 'hardware', 'construction', 'tools'] },
  Scissors: { icon: Scissors, label: 'Scissors / Grooming', keywords: ['salon', 'haircut', 'barber', 'tailor', 'grooming'] },

  // Food & Dining
  Utensils: { icon: Utensils, label: 'Dining / Food', keywords: ['food', 'lunch', 'dinner', 'restaurant', 'meal', 'eat'] },
  UtensilsCrossed: { icon: UtensilsCrossed, label: 'Cooking / Kitchen', keywords: ['cook', 'cooking', 'chef', 'kitchen', 'food'] },
  Coffee: { icon: Coffee, label: 'Coffee / Tea / Snacks', keywords: ['coffee', 'tea', 'cafe', 'breakfast', 'snacks', 'drink'] },
  Pizza: { icon: Pizza, label: 'Fast Food / Pizza', keywords: ['pizza', 'burger', 'fastfood', 'takeout', 'party'] },
  Cake: { icon: Cake, label: 'Cake / Bakery', keywords: ['cake', 'bakery', 'sweets', 'dessert', 'birthday'] },

  // Groceries & Shopping
  ShoppingBag: { icon: ShoppingBag, label: 'Groceries / Bags', keywords: ['groceries', 'supermarket', 'market', 'provisions', 'shopping'] },
  ShoppingCart: { icon: ShoppingCart, label: 'Shopping Cart', keywords: ['cart', 'mall', 'store', 'buy', 'online'] },
  Store: { icon: Store, label: 'Local Store / Shop', keywords: ['store', 'kirana', 'merchant', 'shop'] },
  Tag: { icon: Tag, label: 'Shopping / Tag', keywords: ['shopping', 'clothes', 'discount', 'fashion', 'tag'] },
  Package: { icon: Package, label: 'Delivery / Parcels', keywords: ['courier', 'delivery', 'amazon', 'parcel', 'package'] },

  // Transportation & Vehicles
  Car: { icon: Car, label: 'Car / Cab / Ride', keywords: ['car', 'uber', 'ola', 'cab', 'taxi', 'drive', 'auto'] },
  Fuel: { icon: Fuel, label: 'Petrol / Diesel / Fuel', keywords: ['fuel', 'petrol', 'diesel', 'gas', 'cng', 'station'] },
  Bike: { icon: Bike, label: 'Bike / Two Wheeler', keywords: ['bike', 'motorcycle', 'scooter', 'bicycle'] },
  Bus: { icon: Bus, label: 'Bus / Public Transport', keywords: ['bus', 'transit', 'commute', 'metro', 'fare'] },
  Train: { icon: Train, label: 'Train / Railway', keywords: ['train', 'railway', 'irctc', 'metro'] },
  Plane: { icon: Plane, label: 'Flights / Air Travel', keywords: ['flight', 'airline', 'airport', 'holiday', 'trip'] },

  // Housing & Utilities
  Home: { icon: Home, label: 'House / Rent', keywords: ['rent', 'house', 'maintenance', 'apartment', 'flat'] },
  Zap: { icon: Zap, label: 'Electricity / Power', keywords: ['electricity', 'power', 'eb', 'current', 'light', 'bill'] },
  Droplets: { icon: Droplets, label: 'Water / Utilities', keywords: ['water', 'plumbing', 'can', 'tanker', 'utility'] },
  Flame: { icon: Flame, label: 'Gas / Heating / LPG', keywords: ['gas', 'cylinder', 'lpg', 'heating', 'flame'] },
  Lightbulb: { icon: Lightbulb, label: 'Lighting / Electricals', keywords: ['bulb', 'lighting', 'electronics', 'hardware'] },

  // Health & Medical
  HeartPulse: { icon: HeartPulse, label: 'Medical / Healthcare', keywords: ['hospital', 'doctor', 'clinic', 'medical', 'emergency'] },
  Pill: { icon: Pill, label: 'Medicines / Pharmacy', keywords: ['pill', 'tablet', 'pharmacy', 'chemist', 'drugs'] },
  Stethoscope: { icon: Stethoscope, label: 'Doctor Consultation', keywords: ['doctor', 'checkup', 'physician', 'specialist'] },
  Heart: { icon: Heart, label: 'Wellness / Care', keywords: ['health', 'care', 'fitness', 'wellness', 'donation'] },

  // Family, Pets & Kids
  Baby: { icon: Baby, label: 'Baby / Kids', keywords: ['baby', 'infant', 'child', 'diaper', 'toys'] },
  Dog: { icon: Dog, label: 'Dog / Pet Care', keywords: ['dog', 'pet', 'puppy', 'vet', 'animal'] },
  Cat: { icon: Cat, label: 'Cat / Pets', keywords: ['cat', 'kitten', 'pet', 'vet'] },
  Shirt: { icon: Shirt, label: 'Clothes / Laundry', keywords: ['clothes', 'laundry', 'dryclean', 'apparel', 'iron'] },

  // Education & Work
  GraduationCap: { icon: GraduationCap, label: 'Education / College', keywords: ['school', 'college', 'tuition', 'degree', 'fees'] },
  BookOpen: { icon: BookOpen, label: 'Books / Stationary', keywords: ['book', 'stationary', 'library', 'study', 'course'] },
  Laptop: { icon: Laptop, label: 'Computer / Office', keywords: ['laptop', 'pc', 'hardware', 'software', 'work'] },
  Briefcase: { icon: Briefcase, label: 'Work / Business', keywords: ['work', 'office', 'job', 'business', 'tax'] },

  // Entertainment & Leisure
  Film: { icon: Film, label: 'Movies / Cinema', keywords: ['movie', 'theatre', 'cinema', 'ott', 'netflix'] },
  Tv: { icon: Tv, label: 'TV / Cable / DTH', keywords: ['tv', 'television', 'cable', 'dish', 'dth'] },
  Gamepad2: { icon: Gamepad2, label: 'Gaming / Recreation', keywords: ['game', 'gaming', 'playstation', 'hobby'] },
  Music: { icon: Music, label: 'Music / Concert', keywords: ['music', 'song', 'spotify', 'concert'] },
  Dumbbell: { icon: Dumbbell, label: 'Gym / Sports / Fitness', keywords: ['gym', 'fitness', 'workout', 'sports', 'exercise'] },

  // Finance, Gifts & Others
  ReceiptIndianRupee: { icon: ReceiptIndianRupee, label: 'Rupee / Bills / Taxes', keywords: ['rupee', 'bill', 'tax', 'receipt', 'charge'] },
  Wallet: { icon: Wallet, label: 'Wallet / Pocket Money', keywords: ['wallet', 'cash', 'allowance', 'money'] },
  CreditCard: { icon: CreditCard, label: 'Credit Card / EMI', keywords: ['card', 'emi', 'loan', 'swipe'] },
  Smartphone: { icon: Smartphone, label: 'Mobile / Recharge / Net', keywords: ['mobile', 'phone', 'recharge', 'data', 'internet'] },
  Wifi: { icon: Wifi, label: 'Broadband / Wi-Fi', keywords: ['wifi', 'broadband', 'router', 'fiber', 'internet'] },
  Gift: { icon: Gift, label: 'Gifts / Presents', keywords: ['gift', 'present', 'festive', 'celebration', 'wedding'] },
  PartyPopper: { icon: PartyPopper, label: 'Party / Events', keywords: ['party', 'event', 'function', 'festival', 'celebration'] },
  Shield: { icon: Shield, label: 'Insurance / Security', keywords: ['insurance', 'policy', 'lic', 'security', 'protection'] },
  MoreHorizontal: { icon: MoreHorizontal, label: 'Other / Miscellaneous', keywords: ['other', 'misc', 'general', 'etc'] },
};

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
  // Normalize lookup: case-insensitive, strip hyphens/spaces
  const cleanKey = (name || '').replace(/[-_\s]/g, '').toLowerCase();

  const foundEntry = Object.entries(ICON_REGISTRY).find(([key]) => {
    return key.toLowerCase() === cleanKey;
  });

  if (foundEntry) {
    const IconComponent = foundEntry[1].icon;
    return <IconComponent className={className} size={size} style={color ? { color } : undefined} />;
  }

  // Fallback icon
  const Fallback = ReceiptIndianRupee;
  return <Fallback className={className} size={size} style={color ? { color } : undefined} />;
};

export interface SearchedIconItem {
  name: string;
  label: string;
}

/**
 * Helper function to search/fetch Lucide icons based on user input keyword
 */
export function searchLucideIcons(query: string): SearchedIconItem[] {
  const q = (query || '').trim().toLowerCase().replace(/[-_]/g, ' ');
  const entries = Object.entries(ICON_REGISTRY);

  if (!q) {
    return entries.slice(0, 16).map(([name, data]) => ({
      name,
      label: data.label,
    }));
  }

  return entries
    .filter(([key, data]) => {
      const keyMatch = key.toLowerCase().includes(q) || q.includes(key.toLowerCase());
      const labelMatch = data.label.toLowerCase().includes(q);
      const keywordMatch = data.keywords.some((kw) => kw.includes(q) || q.includes(kw));
      return keyMatch || labelMatch || keywordMatch;
    })
    .map(([name, data]) => ({
      name,
      label: data.label,
    }));
}

