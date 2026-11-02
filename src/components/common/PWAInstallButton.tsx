import React, { useState } from 'react';
import { Download, CheckCircle, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 3000);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 font-medium transition cursor-pointer ${
            compact
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-sm'
              : 'w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm px-4 py-2.5 rounded-xl shadow-md justify-center'
          }`}
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>{installedSuccess ? 'App Installed!' : 'Install Family App'}</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 font-medium transition cursor-pointer ${
            compact
              ? 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs px-2.5 py-1.5 rounded-lg'
              : 'w-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm px-4 py-2.5 rounded-xl justify-center'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Install on iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Install on iPhone / iPad</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              To install this Family App on your home screen:
            </p>
            <ol className="mt-3 text-sm text-slate-700 space-y-2 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-100">
              <li>
                Tap the <span className="font-semibold text-indigo-600">Share</span> icon in Safari toolbar.
              </li>
              <li>
                Scroll down and tap <span className="font-semibold text-indigo-600">Add to Home Screen</span>.
              </li>
              <li>
                Tap <span className="font-semibold text-indigo-600">Add</span> in the top right corner.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-sm font-semibold text-white shadow"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
