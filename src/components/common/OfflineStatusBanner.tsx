import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const OfflineStatusBanner: React.FC = () => {
  const { syncStatus, pendingCount } = useData();

  // Network connectivity status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track if we just came back online to show the temporary success message
  const [justReconnected, setJustReconnected] = useState(false);
  // Allow user to minimize banner into a compact pill if they want extra screen room
  const [isMinimized, setIsMinimized] = useState(false);
  // Allow user to dismiss banner for current offline session
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      setJustReconnected(true);

      // Auto-dismiss the green "Back Online" banner after 3.5 seconds
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine whether to display: offline mode or just reconnected
  const showOffline = (!isOnline || syncStatus === 'offline') && !isDismissed;
  const showReconnected = isOnline && justReconnected && !isDismissed;

  if (!showOffline && !showReconnected) {
    return null;
  }

  // 1. Reconnected / Synced State (Green banner, auto-dismisses in 3.5s)
  if (showReconnected) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto transition-all duration-300 pointer-events-auto animate-in fade-in slide-in-from-top-3">
        <div className="bg-gradient-to-r from-emerald-950/95 via-emerald-900/95 to-emerald-950/95 backdrop-blur-md border border-emerald-500/40 text-emerald-100 shadow-xl shadow-emerald-950/30 rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left min-w-0 pr-1">
            <div className="text-xs font-bold text-emerald-300">Back Online</div>
            <p className="text-[11px] sm:text-xs text-emerald-200/90 leading-snug">
              All data synced successfully with family ledger!
            </p>
          </div>
          <button
            onClick={() => setJustReconnected(false)}
            className="text-emerald-300/70 hover:text-emerald-100 p-1 rounded-lg transition shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Minimized Offline Pill (compact floating icon badge)
  if (isMinimized) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto animate-in fade-in slide-in-from-top-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-amber-950/90 hover:bg-amber-900/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-amber-950/30 cursor-pointer transition active:scale-95"
          title="Click to expand offline details"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-300">Offline</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500/25 border border-amber-400/30 text-amber-100 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
              {pendingCount}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-amber-400/80 ml-0.5" />
        </button>
      </div>
    );
  }

  // 3. Expanded Modern Ambient Offline Banner (z-40, below modals)
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[94%] sm:w-auto transition-all duration-300 pointer-events-auto animate-in fade-in slide-in-from-top-3">
      <div className="bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 backdrop-blur-md border border-amber-500/40 text-amber-100 shadow-xl shadow-amber-950/30 rounded-2xl p-3 sm:px-4 sm:py-2.5 flex items-start sm:items-center gap-3">
        {/* Pulsing Offline Indicator Icon */}
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400 relative mt-0.5 sm:mt-0">
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <WifiOff className="w-4 h-4" />
        </div>

        {/* Content & Approved Phrasing */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-amber-300 tracking-tight">
              Offline Mode
            </span>
            {pendingCount > 0 && (
              <span className="bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {pendingCount} pending {pendingCount === 1 ? 'entry' : 'entries'} saved
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-amber-200/90 leading-snug mt-0.5">
            You are adding data offline. Data will sync automatically when connectivity is restored (keep app open, or manually sync in Settings).
          </p>
        </div>

        {/* Controls: Minimize / Dismiss */}
        <div className="flex items-center gap-1 shrink-0 self-start sm:self-center ml-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-amber-300/70 hover:text-amber-100 rounded-lg hover:bg-amber-800/40 transition cursor-pointer"
            title="Minimize to compact pill"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-300/70 hover:text-amber-100 rounded-lg hover:bg-amber-800/40 transition cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
