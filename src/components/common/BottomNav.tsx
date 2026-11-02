import React from 'react';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expense', icon: ReceiptIndianRupee },
    { id: 'deposits', label: 'Deposits', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const isExpense = item.id === 'expenses';
          const Icon = item.icon;
          const activeClasses = isExpense
            ? 'bg-rose-600 text-white px-3.5 py-1.5 rounded-2xl shadow-md shadow-rose-500/25 scale-105'
            : 'bg-[#4F46E5] text-white px-3.5 py-1.5 rounded-2xl shadow-md shadow-indigo-500/20 scale-105';
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? activeClasses
                  : 'text-slate-500 hover:text-slate-800 px-2 py-1.5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span
                className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'text-white font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
