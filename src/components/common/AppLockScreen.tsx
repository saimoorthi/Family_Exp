import React, { useState, useEffect } from 'react';
import { Fingerprint, Delete, Lock, LogOut } from 'lucide-react';
import { useAuth, hashPassword } from '../../context/AuthContext';
import { registerBiometricCredential, verifyBiometricCredential, isBiometricSupported } from '../../lib/biometrics';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const { userProfile, logout } = useAuth();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);

  // Check lockout status and biometric availability on mount
  useEffect(() => {
    if (!userProfile?.id) return;
    const lockoutKey = `family_app_lock_lockout_${userProfile.id}`;
    const storedLockout = localStorage.getItem(lockoutKey);
    if (storedLockout) {
      const remainingMs = parseInt(storedLockout, 10) - Date.now();
      if (remainingMs > 0) {
        setLockoutRemaining(Math.ceil(remainingMs / 1000));
      } else {
        localStorage.removeItem(lockoutKey);
      }
    }

    const isBioEnabled = localStorage.getItem(`family_app_lock_biometric_${userProfile.id}`) === 'true';
    if (isBioEnabled) {
      isBiometricSupported()
        .then((available) => {
          setBiometricAvailable(available);
          const credId = localStorage.getItem(`family_app_lock_cred_id_${userProfile.id}`);
          // Only auto-trigger if credential is already enrolled on this device
          if (available && credId) {
            triggerBiometricUnlock();
          }
        })
        .catch(() => setBiometricAvailable(false));
    }
  }, [userProfile?.id]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          if (userProfile?.id) {
            localStorage.removeItem(`family_app_lock_lockout_${userProfile.id}`);
          }
          setFailedAttempts(0);
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining, userProfile?.id]);

  const triggerBiometricUnlock = async () => {
    if (lockoutRemaining > 0 || !userProfile?.id) return;
    try {
      setErrorMsg(null);
      const credKey = `family_app_lock_cred_id_${userProfile.id}`;
      const savedCredId = localStorage.getItem(credKey);

      if (!savedCredId) {
        // No passkey registered yet on this device - register fingerprint now
        const newCredId = await registerBiometricCredential(
          userProfile.id,
          userProfile.displayName || 'Family Member'
        );
        localStorage.setItem(credKey, newCredId);
        localStorage.setItem(`family_app_lock_last_unlocked_${userProfile.id}`, Date.now().toString());
        localStorage.removeItem(`family_app_lock_failed_attempts_${userProfile.id}`);
        onUnlock();
        return;
      }

      // Verify enrolled biometric passkey
      const success = await verifyBiometricCredential(savedCredId);
      if (success) {
        localStorage.setItem(`family_app_lock_last_unlocked_${userProfile.id}`, Date.now().toString());
        localStorage.removeItem(`family_app_lock_failed_attempts_${userProfile.id}`);
        onUnlock();
      } else {
        setErrorMsg('Biometric verification failed. Please enter your PIN.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('abort')) {
        setErrorMsg('Biometric cancelled. Please enter your PIN.');
      } else if (errMsg.includes('not supported') || errMsg.includes('NotAllowedError')) {
        setErrorMsg('Biometric not available in this browser. Enter PIN.');
      } else {
        setErrorMsg('Biometric verification failed. Please enter your PIN.');
      }
    }
  };

  const handleKeyPress = (num: string) => {
    if (lockoutRemaining > 0) return;
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      validatePin(nextPin);
    }
  };

  const handleDelete = () => {
    if (lockoutRemaining > 0) return;
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const validatePin = async (pin: string) => {
    if (!userProfile?.id) {
      onUnlock();
      return;
    }
    const pinKey = `family_app_lock_pin_${userProfile.id}`;
    const savedPin = localStorage.getItem(pinKey);
    if (!savedPin) {
      // User has no PIN configured on this device
      onUnlock();
      return;
    }

    const hashedInput = await hashPassword(pin);
    // Allow either hashed match or legacy plain text match
    if (pin === savedPin || hashedInput === savedPin) {
      // Upgrade plain text PIN to hash if needed
      if (savedPin === pin) {
        localStorage.setItem(pinKey, hashedInput);
      }
      localStorage.setItem(`family_app_lock_last_unlocked_${userProfile.id}`, Date.now().toString());
      localStorage.removeItem(`family_app_lock_failed_attempts_${userProfile.id}`);
      setFailedAttempts(0);
      onUnlock();
    } else {
      setIsShaking(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockoutTimeMs = Date.now() + 30000;
        localStorage.setItem(`family_app_lock_lockout_${userProfile.id}`, lockoutTimeMs.toString());
        setLockoutRemaining(30);
        setErrorMsg('Too many failed attempts. Locked for 30 seconds.');
      } else {
        setErrorMsg(`Incorrect PIN. ${5 - newAttempts} attempt(s) remaining.`);
      }

      setTimeout(() => {
        setEnteredPin('');
        setIsShaking(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0B0F2A] text-white flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300 overflow-hidden">
      {/* 1. Animated Liquid Fluid Morphing Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Liquid Fluid Blob 1 - Indigo / Cyan */}
        <div
          className="absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 rounded-[45%] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 opacity-60 blur-3xl will-change-transform"
          style={{ animation: 'liquidFluid1 15s ease-in-out infinite' }}
        />
        {/* Liquid Fluid Blob 2 - Purple / Magenta */}
        <div
          className="absolute -bottom-20 -right-20 w-80 h-80 sm:w-96 sm:h-96 rounded-[48%] bg-gradient-to-tr from-purple-700 via-fuchsia-600 to-indigo-600 opacity-50 blur-3xl will-change-transform"
          style={{ animation: 'liquidFluid2 18s ease-in-out infinite' }}
        />
        {/* Liquid Fluid Blob 3 - Central Cyan Wave Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-cyan-500/40 via-teal-500/30 to-blue-600/40 blur-3xl will-change-transform"
          style={{ animation: 'liquidFluid3 12s ease-in-out infinite' }}
        />
        {/* Subtle Frosted Fluid Wave Backdrop Overlay */}
        <div className="absolute inset-0 bg-[#0B0F2A]/30 backdrop-blur-[40px]" />
      </div>

      {/* Top Header - Removed "APP LOCK" text */}
      <div className="pt-8 flex flex-col items-center z-10">
        <div className="w-16 h-16 rounded-3xl bg-white/[0.08] ring-1 ring-white/20 backdrop-blur-xl flex items-center justify-center text-white mb-3 shadow-xl shadow-indigo-950/50">
          <Lock className="w-8 h-8 text-cyan-300 drop-shadow-xs" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white/95">Family Expense</h2>
        <p className="text-xs text-indigo-200/90 mt-0.5 font-medium">
          Welcome back, {userProfile?.displayName || 'Family Member'}
        </p>
      </div>

      {/* Middle: Liquid Droplet PIN Indicators & Error */}
      <div className="flex flex-col items-center space-y-4 my-auto z-10">
        <span className="text-xs font-semibold text-indigo-200/90 tracking-wider uppercase">
          Enter 4-Digit Security PIN
        </span>

        {/* 4 Liquid Droplet Dots */}
        <div
          className={`flex items-center gap-4 py-2 transition-transform ${
            isShaking ? 'animate-bounce text-rose-400' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = enteredPin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-gradient-to-tr from-cyan-300 via-indigo-200 to-white shadow-lg shadow-cyan-400/60 ring-2 ring-cyan-300/80 scale-110'
                    : 'bg-white/10 border border-white/25 backdrop-blur-md'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-300 bg-rose-500/25 border border-rose-500/30 px-3.5 py-1 rounded-full animate-shake backdrop-blur-md">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom: Numerical Liquid Glass Keypad */}
      <div className="w-full max-w-xs pb-4 z-10">
        <div className="grid grid-cols-3 gap-3 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-white/[0.08] hover:bg-white/[0.18] active:bg-cyan-500/25 active:scale-95 active:ring-2 active:ring-cyan-300/40 border border-white/15 text-2xl font-bold text-white transition-all duration-150 cursor-pointer flex items-center justify-center shadow-lg shadow-black/20 backdrop-blur-xl"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button or Blank */}
          {biometricAvailable ? (
            <button
              onClick={triggerBiometricUnlock}
              title="Biometric Fingerprint / Face Unlock"
              className="h-16 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 border border-cyan-400/30 text-cyan-200 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl shadow-lg shadow-cyan-950/40"
            >
              <Fingerprint className="w-7 h-7 text-cyan-300" />
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* 0 digit */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white/[0.08] hover:bg-white/[0.18] active:bg-cyan-500/25 active:scale-95 active:ring-2 active:ring-cyan-300/40 border border-white/15 text-2xl font-bold text-white transition-all duration-150 cursor-pointer flex items-center justify-center shadow-lg shadow-black/20 backdrop-blur-xl"
          >
            0
          </button>

          {/* Backspace Delete */}
          <button
            onClick={handleDelete}
            title="Delete Digit"
            className="h-16 rounded-2xl bg-white/[0.08] hover:bg-white/[0.18] active:scale-95 border border-white/15 text-indigo-200 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl shadow-lg shadow-black/20"
          >
            <Delete className="w-6 h-6 text-indigo-200" />
          </button>
        </div>

        {/* Forgot PIN / Sign Out option */}
        <div className="mt-5 text-center">
          <button
            onClick={logout}
            className="text-xs text-indigo-300 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Forgot PIN? Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
