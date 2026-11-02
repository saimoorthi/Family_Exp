import React from 'react';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X,
  ShieldCheck,
  Heart,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const { familySettings, syncStatus, manualSync, lastSyncFormatted, expenses, deposits, formatCurrency } =
    useData();

  const totalDeposits = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalBalance = totalDeposits - totalExpenses;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: ReceiptIndianRupee },
    { id: 'deposits', label: 'Deposits', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Only visible on MD+ screens) */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 p-5 select-none overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                {familySettings.familyName || 'Family Expense'}
              </h2>
              <p className="text-[11px] font-medium text-slate-400">Expense & Fund Tracker</p>
            </div>
          </div>
        </div>

        {/* User Badge Card */}
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-100/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {userProfile?.displayName || 'Family Member'}
              </span>
              {isAdmin && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">@{userProfile?.username || 'admin'}</p>
          </div>
        </div>

        {/* Quick Balance Summary */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500">Family Balance</div>
          <div
            className={`text-lg font-extrabold mt-0.5 ${
              totalBalance >= 0 ? 'text-indigo-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(totalBalance)}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-200/60">
            <span>In: {formatCurrency(totalDeposits)}</span>
            <span>Out: {formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="mt-5 space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Utilities */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
          <PWAInstallButton compact={false} />

          {/* Last Synced Text Banner */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span className="truncate">{lastSyncFormatted}</span>
              <button onClick={manualSync} className="text-indigo-600 hover:text-indigo-800 ml-1">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              {syncStatus === 'offline' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline Mode
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online & Synced
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Profile Details Drawer (Opened when clicking profile icon, WITHOUT main menu) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-white shadow-2xl animate-in slide-in-from-right duration-200 z-10 flex flex-col p-5 select-none overflow-y-auto">
            {/* Header with Close */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Profile & Sync Details
              </h3>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Badge Card */}
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100/70 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {userProfile?.displayName || 'Family Member'}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-amber-600" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate font-medium">@{userProfile?.username || 'admin'}</p>
              </div>
            </div>

            {/* Quick Family Balance Summary */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Family Balance
              </div>
              <div
                className={`text-2xl font-extrabold mt-0.5 ${
                  totalBalance >= 0 ? 'text-indigo-900' : 'text-rose-600'
                }`}
              >
                {formatCurrency(totalBalance)}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2 border-t border-slate-200/60">
                <span>In: <strong className="text-emerald-600">{formatCurrency(totalDeposits)}</strong></span>
                <span>Out: <strong className="text-rose-600">{formatCurrency(totalExpenses)}</strong></span>
              </div>
            </div>

            {/* Last Synced Text Banner (Requirement 6) */}
            <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Cloud Synchronization
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-900">
                  {syncStatus === 'offline' ? (
                    <span className="flex items-center gap-1 text-amber-700">
                      <WifiOff className="w-3 h-3" /> Offline
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  )}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-indigo-600' : 'text-indigo-600'}`} />
                <span>{lastSyncFormatted}</span>
              </div>
              <button
                onClick={manualSync}
                className="w-full mt-2 text-center text-xs font-bold bg-white text-indigo-700 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer shadow-2xs"
              >
                Sync Now
              </button>
            </div>

            {/* Utilities: PWA Install & Sign Out */}
            <div className="mt-10 pt-4 border-t border-slate-100 space-y-3">
              <PWAInstallButton compact={false} />

              <button
                onClick={() => {
                  onCloseMobile();
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
