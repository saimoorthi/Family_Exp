import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Trash2,
  ReceiptIndianRupee,
  ChevronDown,
  Lock,
  CheckCircle2,
  User,
  CreditCard,
} from 'lucide-react';
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
  const { categories, paymentMethods, members, addExpense, updateExpense, expenses } = useData();
  const { userProfile, isAdmin } = useAuth();

  // Categories sorted alphabetically in ascending order (A to Z)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [categories]);

  // Frequently used categories calculated from real expense frequency
  const frequentlyUsedCategories = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return sortedCategories.slice(0, 4);
    }
    const countMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const catName = e.category?.trim();
      if (catName) {
        countMap[catName.toLowerCase()] = (countMap[catName.toLowerCase()] || 0) + 1;
      }
    });

    const scored = categories
      .map((cat) => ({
        cat,
        count: countMap[cat.name.toLowerCase()] || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    if (scored.length > 0) {
      return scored.slice(0, 4).map((item) => item.cat);
    }
    return sortedCategories.slice(0, 4);
  }, [expenses, categories, sortedCategories]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(expenseToEdit?.category || '');
  const [paidBy, setPaidBy] = useState(userProfile?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Dropdown Open States (matching the unified in-app dropdown UI)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] = useState(false);

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
      setCategory('');
      setPaidBy(userProfile?.id || members[0]?.id || '');
      setPaymentMethod(userProfile?.defaultPaymentMethod || 'Cash');
      setDescription('');
      setReceiptUrl(undefined);
    }
    setShowCategoryDropdown(false);
    setShowPaidByDropdown(false);
    setShowPaymentMethodDropdown(false);
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
    if (!category || category === 'Select Category') {
      setError('Please select an expense category');
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
      <div className="w-full max-w-xl md:max-w-2xl rounded-2xl bg-white p-5 md:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Form fields in clean 2-column layout on both mobile and desktop:
            1. Date | 2. Amount
            3. Expense Title | 4. Category (Dropdown)
            5. Paid By | 6. Payment Method (Dropdown)
            7. Description / Remarks (2-column span)
            Receipt Attachment (2-column span)
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 sm:pl-8 pr-2.5 sm:pr-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>
            </div>

            {/* 3. Expense Title (Spanning full width for comfortable data entry) */}
            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Expense Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you spend on? (e.g. Grocery shopping, Electricity bill, Petrol)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-2xs"
                required
              />
            </div>

            {/* 4. Category (Unified Custom Dropdown) */}
            <div className="relative">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Category *
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowPaidByDropdown(false);
                  setShowPaymentMethodDropdown(false);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: category
                        ? categories.find((c) => c.name.toLowerCase() === category.toLowerCase())?.color || '#F43F5E'
                        : '#CBD5E1',
                    }}
                  />
                  <span className={`truncate ${!category ? 'text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
                    {category || 'Select Category'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-[250px] sm:w-[280px] max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
                  {/* Frequently Used Categories */}
                  {frequentlyUsedCategories.length > 0 && (
                    <div className="pb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1.5 pb-1 block">
                        Frequently Used
                      </span>
                      {frequentlyUsedCategories.map((cat) => (
                        <button
                          key={`freq-${cat.id}`}
                          type="button"
                          onClick={() => {
                            setCategory(cat.name);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                            category === cat.name
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {category === cat.name && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1.5" />
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-slate-100" />
                    </div>
                  )}

                  {/* All Categories in Alphabetical Ascending Order */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-1 block">
                      All Categories (A–Z)
                    </span>
                    {sortedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.name);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          category === cat.name
                            ? 'bg-rose-50 text-rose-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {category === cat.name && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Paid By (Unified Custom Dropdown for Admin, locked Self for Member) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
                  5. Paid By *
                </label>
                {isAdmin && (
                  <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold hidden sm:inline">
                    Admin
                  </span>
                )}
              </div>
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaidByDropdown(!showPaidByDropdown);
                      setShowCategoryDropdown(false);
                      setShowPaymentMethodDropdown(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between cursor-pointer focus:outline-none transition shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {members.find((m) => m.id === paidBy)?.displayName ||
                          userProfile?.displayName ||
                          'Select Member'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                        showPaidByDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showPaidByDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setPaidBy(m.id);
                            setShowPaidByDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                            paidBy === m.id
                              ? 'bg-rose-50 text-rose-700 font-bold'
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
                          {paidBy === m.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
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
                  setShowCategoryDropdown(false);
                  setShowPaidByDropdown(false);
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
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pmName}</span>
                      </div>
                      {paymentMethod === pmName && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
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
                placeholder="Add optional notes, item details, or invoice ref..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* Optional Receipt Attachment (2-column span) */}
            <div className="col-span-2">
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Attachment (Optional)
              </label>
              {receiptUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-36 bg-slate-50 flex items-center justify-center group">
                  <img src={receiptUrl} alt="Receipt preview" className="object-contain max-h-36 w-full" />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(undefined)}
                    className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 transition cursor-pointer"
                    title="Remove receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition text-slate-400 hover:text-slate-600">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 text-slate-400" />
                  <span className="text-[11px] sm:text-xs font-semibold">Upload receipt photo or invoice</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit and Cancel Buttons - Styled in Red */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
