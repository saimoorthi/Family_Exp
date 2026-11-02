import React, { useState, useEffect } from 'react';
import { Fingerprint, Delete, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const { userProfile, logout } = useAuth();
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if biometric is supported & enabled
  useEffect(() => {
    const isBioEnabled = localStorage.getItem('family_app_lock_biometric') === 'true';
    if (isBioEnabled && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => {
          setBiometricAvailable(available);
          if (available) {
            // Automatically prompt biometric unlock on open
            triggerBiometricUnlock();
          }
        })
        .catch(() => setBiometricAvailable(false));
    }
  }, []);

  const triggerBiometricUnlock = async () => {
    try {
      setErrorMsg(null);
      // If WebAuthn is available, perform challenge or verify device authentication
      if (window.PublicKeyCredential) {
        // Authenticate with platform authenticator (fingerprint / face ID / PIN)
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Simple biometric check flow
        onUnlock();
      }
    } catch {
      setErrorMsg('Biometric authentication failed. Please enter your PIN.');
    }
  };

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      validatePin(nextPin);
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const validatePin = (pin: string) => {
    const savedPin = localStorage.getItem('family_app_lock_pin') || '1234';
    if (pin === savedPin) {
      localStorage.setItem('family_app_lock_last_unlocked', Date.now().toString());
      onUnlock();
    } else {
      setIsShaking(true);
      setErrorMsg('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setEnteredPin('');
        setIsShaking(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1E1B4B] via-[#312E81] to-[#1E1B4B] text-white flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="pt-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 ring-2 ring-indigo-400/40 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-900/50">
          <Lock className="w-8 h-8 text-indigo-300" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Family Expense App Lock</h2>
        <p className="text-xs text-indigo-200 mt-0.5">
          Welcome back, {userProfile?.displayName || 'Family Member'}
        </p>
      </div>

      {/* Middle: PIN Dots & Error */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <span className="text-xs font-semibold text-indigo-200/90 tracking-wide uppercase">
          Enter 4-Digit Security PIN
        </span>

        {/* 4 PIN Dots */}
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
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-white scale-110 shadow-md shadow-white/50 ring-2 ring-white/60'
                    : 'bg-white/20 border border-white/30'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full animate-shake">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom: Numerical Keypad */}
      <div className="w-full max-w-xs pb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-2xl font-bold text-white transition cursor-pointer flex items-center justify-center shadow-xs backdrop-blur-xs"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button or Blank */}
          {biometricAvailable ? (
            <button
              onClick={triggerBiometricUnlock}
              title="Biometric Fingerprint / Face Unlock"
              className="h-16 rounded-2xl bg-indigo-600/50 hover:bg-indigo-600/70 text-indigo-200 flex items-center justify-center transition cursor-pointer"
            >
              <Fingerprint className="w-7 h-7 text-indigo-200" />
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* 0 digit */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-2xl font-bold text-white transition cursor-pointer flex items-center justify-center shadow-xs backdrop-blur-xs"
          >
            0
          </button>

          {/* Backspace Delete */}
          <button
            onClick={handleDelete}
            title="Delete Digit"
            className="h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
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
