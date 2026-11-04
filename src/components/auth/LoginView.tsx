import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HouseholdSnowfall } from './HouseholdSnowfall';

export const LoginView: React.FC = () => {
  const { login, authError, clearAuthError, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load remembered username
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem('family_expense_remember_username_v2');
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError('Please enter your username');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    await login(username.trim(), password, rememberMe);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FD] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-['Outfit']">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-80 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Gentle Greyscale Household Icons Snowfall (Drifting behind login fields) */}
      <HouseholdSnowfall />

      {/* Main Form Container */}
      <div className="w-full max-w-sm flex flex-col items-center z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6 animate-in fade-in duration-300">
          {/* Family House Logo Emblem */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 p-3">
              <svg
                className="w-full h-full drop-shadow-xs"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 100,25 L 170,85 L 170,165 Q 170,175 160,175 L 40,175 Q 30,175 30,165 L 30,85 Z"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 100,62 C 92,50 78,56 78,70 C 78,85 95,98 100,105 C 105,98 122,85 122,70 C 122,56 108,50 100,62 Z"
                  fill="#F472B6"
                />
                <path d="M 35,130 Q 15,115 10,95 Q 28,95 42,120 Z" fill="#34D399" />
                <path d="M 165,130 Q 185,115 190,95 Q 172,95 158,120 Z" fill="#34D399" />
                <circle cx="65" cy="115" r="14" fill="#FFFFFF" />
                <path d="M 45,165 C 45,142 58,135 65,135 C 72,135 85,142 85,165 Z" fill="#C7D2FE" />
                <circle cx="135" cy="115" r="14" fill="#FFFFFF" />
                <path d="M 115,165 C 115,142 128,135 135,135 C 142,135 155,142 155,165 Z" fill="#67E8F9" />
                <circle cx="100" cy="125" r="12" fill="#FFFFFF" />
                <path d="M 85,165 C 85,148 95,142 100,142 C 105,142 115,148 115,165 Z" fill="#FBCFE8" />
              </svg>
            </div>
          </div>

          {/* High-contrast Title & Subtitle for light background */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-2xs">
            Family Expense
          </h1>
          <p className="text-xs md:text-sm text-slate-600 font-medium mt-1 max-w-[260px] leading-relaxed">
            Track, manage and share our family expenses
          </p>
        </div>

        {/* Card with Form */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 animate-in zoom-in-95 duration-200">
          {/* Error Message */}
          {(authError || localError) && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="leading-snug">{authError || localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-['Outfit']">
            {/* Username Input with explicit Outfit font */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-['Outfit'] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password with explicit Outfit font */}
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-['Outfit'] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-600">Remember me</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 font-['Outfit']"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Minimal Encryption Notice & Attribution */}
          <div className="mt-5 flex flex-col items-center justify-center text-center select-none">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>256-bit encrypted • Version 1.1</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Made by KK for Tharkuri
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
