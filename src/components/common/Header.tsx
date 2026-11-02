import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ActiveTab } from '../../types';

interface HeaderProps {
  currentTab: ActiveTab;
  onOpenProfile?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddDeposit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenProfile,
  onOpenAddExpense,
  onOpenAddDeposit,
}) => {
  const { userProfile } = useAuth();
  const { syncStatus, manualSync, lastSyncFormatted } = useData();

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 17) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  const tabTitles: Record<ActiveTab, string> = {
    dashboard: 'Dashboard',
    expenses: 'Expenses',
    deposits: 'Deposits',
    reports: 'Financial Reports',
    settings: 'Settings',
  };

  return (
    <header className="relative bg-gradient-to-b from-[#4338CA] via-[#4F46E5] to-[#6366F1] text-white pt-4 pb-5 px-4 md:px-8 shadow-md rounded-b-[2rem] transition-all">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Side: Current Tab Title & Greeting */}
        <div className="text-left min-w-0 flex-1">
          <h1 className="text-sm md:text-base font-semibold tracking-tight text-indigo-100 truncate">
            {tabTitles[currentTab]}
          </h1>
          {currentTab === 'dashboard' && (
            <p className="text-[10px] md:text-xs text-indigo-200/90 font-medium truncate">
              {getGreeting()}
            </p>
          )}
        </div>

        {/* Center: App Name (Family Expense) - Prominent & Premium */}
        <div className="text-center px-2 flex-shrink-0">
          <span className="font-black text-lg sm:text-xl md:text-2xl tracking-tight text-white drop-shadow-sm">
            Family Expense
          </span>
        </div>

        {/* Right Actions: Quick Add & User Profile Avatar with Verified Cloud Sync Badge */}
        <div className="flex items-center justify-end gap-2 shrink-0 flex-1">
          {/* Quick Add Buttons on Desktop / Tablet */}
          <div className="hidden md:flex items-center gap-1.5">
            {onOpenAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="flex items-center gap-1 bg-rose-600 text-white hover:bg-rose-700 font-bold px-2.5 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Expense</span>
              </button>
            )}
            {onOpenAddDeposit && (
              <button
                onClick={onOpenAddDeposit}
                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
            )}
          </div>

          {/* Profile Avatar with Verified Sync Status Badge (like verified accounts) */}
          <div className="relative">
            <button
              onClick={onOpenProfile}
              title={`Profile & Sync • ${lastSyncFormatted}`}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-indigo-700 font-bold shadow-md ring-2 ring-white/30 text-sm shrink-0 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </button>

            {/* Verified Cloud Sync Badge on Profile Icon */}
            {syncStatus === 'synced' && (
              <span
                onClick={onOpenProfile}
                title={`Synced: ${lastSyncFormatted}`}
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-indigo-600 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            )}

            {syncStatus === 'syncing' && (
              <span
                onClick={onOpenProfile}
                title="Syncing with Cloud..."
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center ring-2 ring-indigo-600 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5 text-white animate-spin" />
              </span>
            )}

            {syncStatus === 'offline' && (
              <span
                onClick={onOpenProfile}
                title="Offline Mode"
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-indigo-600 shadow-xs cursor-pointer"
              >
                <WifiOff className="w-2.5 h-2.5 text-white" />
              </span>
            )}

            {syncStatus === 'error' && (
              <span
                onClick={onOpenProfile}
                title="Sync Issue - Click to Retry"
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center ring-2 ring-indigo-600 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
