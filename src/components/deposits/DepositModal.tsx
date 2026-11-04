import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet,
  Lock,
  ChevronDown,
  CheckCircle2,
  User,
  CreditCard,
  Tag,
} from 'lucide-react';
import { Deposit, PaymentMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PAYMENT_METHODS } from '../../lib/constants';

export const DEPOSIT_TYPES = [
  'Salary',
  'Contribution',
  'Rental Income',
  'Dividend',
  'Business',
  'Gift',
  'Other',
];

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositToEdit?: Deposit | null;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  depositToEdit,
}) => {
  const { members, addDeposit, updateDeposit, paymentMethods, depositTypes } = useData();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const availableDepositTypes =
    depositTypes && depositTypes.length > 0 ? depositTypes.map((dt) => dt.name) : DEPOSIT_TYPES;

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [depositType, setDepositType] = useState('Contribution');
  const [depositedBy, setDepositedBy] = useState(userProfile?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    return (userProfile?.defaultPaymentMethod as PaymentMethod) || 'Cash';
  });
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Dropdown Open States (matching the unified in-app dropdown UI)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDepositedByDropdown, setShowDepositedByDropdown] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);

  useEffect(() => {
    if (depositToEdit) {
      setDate(depositToEdit.date);
      setAmount(String(depositToEdit.amount));
      setTitle(depositToEdit.title);
      setDepositType(depositToEdit.depositType || 'Contribution');
      setDepositedBy(depositToEdit.depositedBy);
      setPaymentMethod(depositToEdit.paymentMethod);
      setDescription(depositToEdit.description || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setTitle('Monthly Fund Contribution');
      setDepositType('Contribution');
      setDepositedBy(userProfile?.id || members[0]?.id || '');
      setPaymentMethod((userProfile?.defaultPaymentMethod as PaymentMethod) || 'Cash');
      setDescription('');
    }
    setShowTypeDropdown(false);
    setShowDepositedByDropdown(false);
    setShowPaymentMethodDropdown(false);
    setError(null);
  }, [depositToEdit, isOpen, members, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!date) {
      setError('Please select a valid date');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid deposit amount greater than 0');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a deposit title');
      return;
    }

    const actualDepositedBy = isAdmin
      ? depositedBy || userProfile?.id || ''
      : userProfile?.id || depositedBy;
    if (!actualDepositedBy) {
      setError('Please select who deposited the funds');
      return;
    }

    const selectedMember = members.find((m) => m.id === actualDepositedBy);
    const depositedByName = selectedMember?.displayName || userProfile?.displayName || 'Family Member';

    setIsSubmitting(true);

    try {
      if (depositToEdit) {
        await updateDeposit(depositToEdit.id, {
          title: title.trim(),
          amount: parsedAmount,
          date,
          depositType,
          depositedBy: actualDepositedBy,
          depositedByName,
          paymentMethod,
          description: description.trim(),
        });
      } else {
        await addDeposit({
          title: title.trim(),
          amount: parsedAmount,
          date,
          depositType,
          depositedBy: actualDepositedBy,
          depositedByName,
          paymentMethod,
          description: description.trim(),
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save deposit');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl md:max-w-2xl rounded-2xl bg-white p-5 md:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header - Green / Emerald Add Deposit Icon */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {depositToEdit ? 'Edit Deposit' : 'Record Deposit / Fund Contribution'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Form fields in clean 2-column layout matching Expense Modal:
            1. Date | 2. Amount
            3. Deposit Title (col-span-2)
            4. Deposit Type | 5. Deposited By
            6. Payment Method (col-span-2)
            7. Description / Remarks (col-span-2)
        */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {/* 1. Date */}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                1. Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* 2. Amount */}
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Amount *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs sm:text-sm select-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 sm:pl-8 pr-2.5 sm:pr-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* 3. Deposit Title (Spanning full width for comfortable data entry) */}
            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Deposit Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is this deposit for? (e.g. Monthly Fund Contribution, Salary deposit)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
                required
              />
            </div>

            {/* 4. Deposit Type (Unified Custom Dropdown) */}
            <div className="relative">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Deposit Type *
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowDepositedByDropdown(false);
                  setShowPaymentMethodDropdown(false);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{depositType || 'Select Type'}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showTypeDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showTypeDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95">
                  {availableDepositTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDepositType(t);
                        setShowTypeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        depositType === t
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{t}</span>
                      {depositType === t && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Deposited By (Unified Custom Dropdown for Admin, locked Self for Member) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
                  5. Deposit By *
                </label>
                {isAdmin && (
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold hidden sm:inline">
                    Admin
                  </span>
                )}
              </div>
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepositedByDropdown(!showDepositedByDropdown);
                      setShowTypeDropdown(false);
                      setShowPaymentMethodDropdown(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {members.find((m) => m.id === depositedBy)?.displayName ||
                          userProfile?.displayName ||
                          'Select Member'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                        showDepositedByDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showDepositedByDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setDepositedBy(m.id);
                            setShowDepositedByDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                            depositedBy === m.id
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {m.displayName.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">
                              {m.displayName} {m.id === userProfile?.id ? '(You)' : ''}
                            </span>
                          </div>
                          {depositedBy === m.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-700 select-none">
                  <span className="truncate">{userProfile?.displayName || 'You'}</span>
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-200/80 px-1.5 py-0.5 rounded-md shrink-0">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    Self
                  </span>
                </div>
              )}
            </div>

            {/* 6. Payment Method (Unified Custom Dropdown) */}
            <div className="col-span-2 relative">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                6. Payment Method *
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentMethodDropdown(!showPaymentMethodDropdown);
                  setShowTypeDropdown(false);
                  setShowDepositedByDropdown(false);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{paymentMethod || 'Cash'}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showPaymentMethodDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showPaymentMethodDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95">
                  {(paymentMethods && paymentMethods.length > 0
                    ? paymentMethods.map((pm) => pm.name)
                    : PAYMENT_METHODS
                  ).map((pmName) => (
                    <button
                      key={pmName}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pmName);
                        setShowPaymentMethodDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        paymentMethod === pmName
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{pmName}</span>
                      </div>
                      {paymentMethod === pmName && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Description / Remarks (2-column span) */}
            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                7. Description / Remarks (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. November monthly deposit, savings contribution..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : depositToEdit ? 'Save Changes' : 'Record Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
