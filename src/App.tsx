import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DepositsView } from './components/deposits/DepositsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { DepositModal } from './components/deposits/DepositModal';
import { AppLockScreen } from './components/common/AppLockScreen';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { ActiveTab } from './types';
import { testConnection } from './lib/firebase';
import { checkAndSeedInitialData } from './lib/seedSampleData';

function MainAppContent() {
  const { userProfile, isLoading } = useAuth();
  const { toast, dismissToast } = useData();
  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    return userProfile?.defaultModule || 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync tab if user's default module changes on login
  useEffect(() => {
    if (userProfile?.defaultModule) {
      setCurrentTab(userProfile.defaultModule);
    }
  }, [userProfile?.id]);

  // App Lock State (PIN / Biometric) - scoped per user
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    // Clear legacy un-scoped device keys so other members are not accidentally locked
    try {
      localStorage.removeItem('family_app_lock_enabled');
      localStorage.removeItem('family_app_lock_pin');
      localStorage.removeItem('family_app_lock_biometric');
    } catch {
      // ignore
    }
    return false;
  });

  // Sync app lock state when userProfile loads or changes
  useEffect(() => {
    if (userProfile?.id) {
      const userLockEnabled =
        localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true';
      setIsAppLocked(userLockEnabled);
    } else {
      setIsAppLocked(false);
    }
  }, [userProfile?.id]);

  // Global Quick Add Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);

  // Connection test on initial app boot per Firebase skill guidelines
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to visibilitychange to lock when app is backgrounded or tab switched
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && userProfile?.id) {
        const userLockEnabled =
          localStorage.getItem(`family_app_lock_enabled_${userProfile.id}`) === 'true';
        if (userLockEnabled) {
          setIsAppLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userProfile?.id]);

  // Seed sample initial data on first admin login if database is blank
  useEffect(() => {
    if (userProfile) {
      checkAndSeedInitialData(userProfile.id, userProfile.displayName);
    }
  }, [userProfile]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FD] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="text-sm font-bold text-slate-800">Family Expense Tracker</div>
        <p className="text-xs text-slate-400 mt-1">Connecting to your secure family ledger...</p>
      </div>
    );
  }

  // If not logged in, render the Login Screen
  if (!userProfile) {
    return <LoginView />;
  }

  // If App Lock is enabled and locked, show AppLockScreen
  if (isAppLocked) {
    return <AppLockScreen onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F8FD] flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Desktop / Drawer Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Dynamic Top Header */}
        <Header
          currentTab={currentTab}
          onOpenProfile={() => setIsMobileMenuOpen(true)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          onOpenAddDeposit={() => setIsAddDepositOpen(true)}
        />

        {/* Floating Non-Intrusive Offline Connectivity Banner */}
        <OfflineStatusBanner />

        {/* Tab Module Views */}
        <main className="flex-1 mt-4">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setCurrentTab}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenAddDeposit={() => setIsAddDepositOpen(true)}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView onOpenAddModal={() => setIsAddExpenseOpen(true)} />
          )}

          {currentTab === 'deposits' && (
            <DepositsView onOpenAddModal={() => setIsAddDepositOpen(true)} />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>

        {/* Fixed Bottom Navigation for Mobile */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Global Add Expense Modal */}
        <ExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
        />

        {/* Global Add Deposit Modal */}
        <DepositModal
          isOpen={isAddDepositOpen}
          onClose={() => setIsAddDepositOpen(false)}
        />

        {/* Global Toast Confirmation Message */}
        {toast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[92%] sm:w-auto transition-all duration-300 pointer-events-auto animate-in fade-in slide-in-from-top-4">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold backdrop-blur-md border ${
                toast.type === 'error'
                  ? 'bg-rose-950/95 text-rose-100 border-rose-800/80 shadow-rose-950/40'
                  : toast.type === 'info'
                  ? 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-slate-950/40'
                  : 'bg-emerald-950/95 text-emerald-100 border-emerald-700/80 shadow-emerald-950/40'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="flex-1 text-[13px] tracking-tight">{toast.message}</span>
              <button
                onClick={dismissToast}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
