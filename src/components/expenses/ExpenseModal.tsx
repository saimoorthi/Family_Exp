import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, ReceiptIndianRupee, ChevronDown, Lock } from 'lucide-react';
import { Expense } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PAYMENT_METHODS } from '../../lib/constants';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { categories, paymentMethods, members, addExpense, updateExpense } = useData();
  const { userProfile, isAdmin } = useAuth();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Groceries');
  const [paidBy, setPaidBy] = useState(userProfile?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseToEdit) {
      setDate(expenseToEdit.date);
      setAmount(String(expenseToEdit.amount));
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setPaidBy(expenseToEdit.paidBy);
      setPaymentMethod(expenseToEdit.paymentMethod || 'Cash');
      setDescription(expenseToEdit.description || '');
      setReceiptUrl(expenseToEdit.receiptUrl);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setTitle('');
      setCategory(categories[0]?.name || 'Groceries');
      setPaidBy(userProfile?.id || members[0]?.id || '');
      setPaymentMethod(userProfile?.defaultPaymentMethod || 'Cash');
      setDescription('');
      setReceiptUrl(undefined);
    }
    setError(null);
  }, [expenseToEdit, isOpen, categories, members, userProfile]);

  if (!isOpen) return null;

  // Handle receipt image upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Receipt image must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!date) {
      setError('Please select a valid date');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an expense title');
      return;
    }

    // Paid by is restricted to current user unless admin
    const actualPaidBy = isAdmin ? paidBy || userProfile?.id || '' : userProfile?.id || paidBy;
    if (!actualPaidBy) {
      setError('Please select who paid for this expense');
      return;
    }

    const selectedMember = members.find((m) => m.id === actualPaidBy);
    const paidByName = selectedMember?.displayName || userProfile?.displayName || 'Family Member';

    setIsSubmitting(true);

    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
          date,
          amount: parsedAmount,
          title: title.trim(),
          category,
          paidBy: actualPaidBy,
          paidByName,
          paymentMethod: paymentMethod || 'Cash',
          description: description.trim(),
          ...(receiptUrl ? { receiptUrl } : {}),
        });
      } else {
        await addExpense({
          date,
          amount: parsedAmount,
          title: title.trim(),
          category,
          paidBy: actualPaidBy,
          paidByName,
          paymentMethod: paymentMethod || 'Cash',
          description: description.trim(),
          ...(receiptUrl ? { receiptUrl } : {}),
        });
      }
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save expense');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header - Red Add Expense Icon */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ReceiptIndianRupee className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
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

        {/* Form fields strictly ordered:
            1. Date
            2. Amount
            3. Expense Title
            4. Category (Dropdown)
            5. Paid By (Dropdown for admin, current user for others)
            6. Payment Method (Dropdown)
            7. Description / Remarks
        */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              required
            />
          </div>

          {/* 2. Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Amount *
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
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>
          </div>

          {/* 3. Expense Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Expense Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Grocery shopping, Electricity bill"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              required
            />
          </div>

          {/* 4. Category (Styled Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              4. Category *
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 5. Paid By (Dropdown for admin, default current user & locked for others) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Paid By *
              </label>
              {isAdmin && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                  Admin: Select member
                </span>
              )}
            </div>
            {isAdmin ? (
              <div className="relative">
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
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
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-100/90 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 select-none">
                <span>{userProfile?.displayName || 'You'} (You)</span>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 bg-slate-200/80 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Self
                </span>
              </div>
            )}
          </div>

          {/* 6. Payment Method (Dropdown, default Cash or user profile setting) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6. Payment Method *
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                required
              >
                {paymentMethods && paymentMethods.length > 0 ? (
                  paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.name}>
                      {pm.name}
                    </option>
                  ))
                ) : (
                  PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 7. Description / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              7. Description / Remarks (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add optional notes, item details, or invoice ref..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Optional Receipt Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receipt Attachment (Optional)
            </label>
            {receiptUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-36 bg-slate-50 flex items-center justify-center group">
                <img src={receiptUrl} alt="Receipt preview" className="object-contain max-h-36 w-full" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(undefined)}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-xl shadow-md hover:bg-rose-700 transition cursor-pointer"
                  title="Remove receipt"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
                <Upload className="w-5 h-5 mb-1 text-slate-400" />
                <span className="text-xs font-semibold">Upload receipt photo or invoice</span>
                <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 2MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit and Cancel Buttons - Styled in Red */}
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
              className="flex-1 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
