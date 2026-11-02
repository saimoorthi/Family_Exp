import React, { useState, useEffect } from 'react';
import { X, Wallet, PlusCircle } from 'lucide-react';
import { Deposit, PaymentMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PAYMENT_METHODS } from '../../lib/constants';

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
  const { members, addDeposit, updateDeposit } = useData();
  const { userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [depositedBy, setDepositedBy] = useState(userProfile?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (depositToEdit) {
      setTitle(depositToEdit.title);
      setAmount(String(depositToEdit.amount));
      setDate(depositToEdit.date);
      setDepositedBy(depositToEdit.depositedBy);
      setPaymentMethod(depositToEdit.paymentMethod);
      setDescription(depositToEdit.description || '');
    } else {
      setTitle('Monthly Fund Contribution');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDepositedBy(userProfile?.id || members[0]?.id || '');
      setPaymentMethod('Bank Transfer');
      setDescription('');
    }
    setError(null);
  }, [depositToEdit, isOpen, members, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide a deposit title');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid deposit amount greater than 0');
      return;
    }
    if (!depositedBy) {
      setError('Please select who deposited the funds');
      return;
    }

    const selectedMember = members.find((m) => m.id === depositedBy);
    const depositedByName = selectedMember?.displayName || userProfile?.displayName || 'Family Member';

    setIsSubmitting(true);

    try {
      if (depositToEdit) {
        await updateDeposit(depositToEdit.id, {
          title: title.trim(),
          amount: parsedAmount,
          date,
          depositedBy,
          depositedByName,
          paymentMethod,
          description: description.trim(),
        });
      } else {
        await addDeposit({
          title: title.trim(),
          amount: parsedAmount,
          date,
          depositedBy,
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
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deposit Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Salary Contribution, Emergency Fund top-up"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm select-none">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Deposited By & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Deposited By *
              </label>
              <select
                value={depositedBy}
                onChange={(e) => setDepositedBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} {m.id === userProfile?.id ? '(You)' : ''}
                  </option>
                ))}
                {members.length === 0 && userProfile && (
                  <option value={userProfile.id}>{userProfile.displayName} (You)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Remarks (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g. November monthly deposit, savings contribution..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : depositToEdit ? 'Save Changes' : 'Record Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
