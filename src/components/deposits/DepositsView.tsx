import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Edit2,
  Trash2,
  Calendar,
  User,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Filter,
  RotateCcw,
  Tag,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Deposit } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DepositModal, DEPOSIT_TYPES } from './DepositModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DepositsViewProps {
  onOpenAddModal: () => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({ onOpenAddModal }) => {
  const { deposits, expenses, members, deleteDeposit, formatCurrency, formatDate, depositTypes } = useData();
  const { userProfile, isAdmin } = useAuth();

  const availableDepositTypes =
    depositTypes && depositTypes.length > 0 ? depositTypes.map((dt) => dt.name) : DEPOSIT_TYPES;

  // Helper to get first and last day of current month (YYYY-MM-DD) in local calendar
  const getCurrentMonthBounds = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const from = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  };

  const initialBounds = getCurrentMonthBounds();

  // Filter States: From Date, To Date, Deposit Type, Deposit By (matching Expense module)
  const [fromDate, setFromDate] = useState<string>(initialBounds.from);
  const [toDate, setToDate] = useState<string>(initialBounds.to);
  const [selectedDepositType, setSelectedDepositType] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<string>('ALL');

  // Unified in-app custom dropdown toggle states
  const [showTypeFilterDropdown, setShowTypeFilterDropdown] = useState(false);
  const [showMemberFilterDropdown, setShowMemberFilterDropdown] = useState(false);

  // Pagination & Modals
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [viewingDeposit, setViewingDeposit] = useState<Deposit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset filter to Current Month
  const handleResetToCurrentMonth = () => {
    const bounds = getCurrentMonthBounds();
    setFromDate(bounds.from);
    setToDate(bounds.to);
    setSelectedDepositType('ALL');
    setSelectedMember('ALL');
    setCurrentPage(1);
  };

  // Available Fund calculation: Total Deposits minus Total Expenses
  const totalDeposits = useMemo(() => {
    return deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [deposits]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const availableFund = totalDeposits - totalExpenses;

  // Member-wise contributions calculation
  const memberContributions = useMemo(() => {
    const map: Record<string, { id: string; name: string; total: number; count: number }> = {};

    members.forEach((m) => {
      map[m.id] = { id: m.id, name: m.displayName, total: 0, count: 0 };
    });

    deposits.forEach((d) => {
      const id = d.depositedBy || 'unknown';
      if (!map[id]) {
        map[id] = { id, name: d.depositedByName || 'Member', total: 0, count: 0 };
      }
      map[id].total += Number(d.amount) || 0;
      map[id].count += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage: totalDeposits > 0 ? Math.round((item.total / totalDeposits) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [deposits, members, totalDeposits]);

  // Filtered Deposits: always sorted newest first, no sort dropdown needed
  const filteredDeposits = useMemo(() => {
    return deposits
      .filter((d) => {
        if (fromDate && d.date < fromDate) return false;
        if (toDate && d.date > toDate) return false;
        if (selectedDepositType !== 'ALL' && (d.depositType || 'Contribution') !== selectedDepositType) {
          return false;
        }
        if (selectedMember !== 'ALL' && d.depositedBy !== selectedMember) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [deposits, fromDate, toDate, selectedDepositType, selectedMember]);

  // Financial summary for filtered selection
  const totalFilteredAmount = useMemo(() => {
    return filteredDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [filteredDeposits]);

  // Pagination calculation
  const totalCount = filteredDeposits.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedDeposits = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDeposits.slice(start, start + PAGE_SIZE);
  }, [filteredDeposits, safePage]);

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deleteDeposit(deletingId);
      setDeletingId(null);
    }
  };

  // Helper to format date-time
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Access Restriction: Only admin users have access to deposit module
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 pt-12 pb-24 text-center animate-in fade-in">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            You don't have access to the Deposits module. Please contact your family head for fund details and deposit records.
          </p>
          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Family Head Access</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Header Overview Cards (Reduced Size, Available Fund + Compact Member Contributions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Available Fund Card (Replaced Total Family Fund) */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-md shadow-emerald-600/15 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100">Available Fund</span>
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
              <Wallet className="w-4 h-4 text-white" />
            </span>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${availableFund >= 0 ? 'text-white' : 'text-rose-200'}`}>
              {formatCurrency(availableFund)}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-100/90 mt-1 flex-wrap">
              <span>Deposits: <strong>{formatCurrency(totalDeposits)}</strong></span>
              <span>•</span>
              <span>Expenses: <strong>{formatCurrency(totalExpenses)}</strong></span>
            </div>
          </div>
        </div>

        {/* Member Contributions Summary (Reduced Compact Size) */}
        <div className="md:col-span-2 bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Member-Wise Contributions</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {memberContributions.length} members
            </span>
          </div>

          <div className="space-y-2 my-1 max-h-24 sm:max-h-28 overflow-y-auto pr-1">
            {memberContributions.map((m) => (
              <div key={m.id} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-slate-700 text-[11px] truncate">{m.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(m.total)}</span>
                    <span className="text-slate-400 font-medium text-[10px] w-7 text-right">
                      {m.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400 flex items-center justify-between">
            <span>{deposits.length} deposit records</span>
            <span className="text-emerald-600 font-semibold">Active Ledger</span>
          </div>
        </div>
      </div>

      {/* 2. Header Action & Add Deposit Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Deposits
          </h2>
          <p className="text-xs text-slate-400">
            Review, filter, and track all family funds and member contributions
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-emerald-600/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deposit</span>
        </button>
      </div>

      {/* 3. Responsive Filter Card (Same UI as Expense module) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Deposits</span>
          </div>
          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] px-2.5 py-1.5 rounded-xl transition cursor-pointer"
            title="Reset filters to current month"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>This Month</span>
          </button>
        </div>

        {/* Filter Controls: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* From Date */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              From Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 focus-within:bg-white transition">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              To Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Deposit Type Dropdown (Matches Category UI in Expense module) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 focus-within:bg-white transition relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Deposit Type
            </label>
            <button
              type="button"
              onClick={() => {
                setShowTypeFilterDropdown(!showTypeFilterDropdown);
                setShowMemberFilterDropdown(false);
              }}
              className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {selectedDepositType === 'ALL' ? 'All Deposit Types' : selectedDepositType}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  showTypeFilterDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showTypeFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepositType('ALL');
                    setShowTypeFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    selectedDepositType === 'ALL'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>All Deposit Types</span>
                  {selectedDepositType === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                {availableDepositTypes.map((t) => {
                  const isSelected = selectedDepositType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedDepositType(t);
                        setShowTypeFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deposit By Dropdown (Matches Paid By UI in Expense module) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 focus-within:bg-white transition relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Deposit By
            </label>
            <button
              type="button"
              onClick={() => {
                setShowMemberFilterDropdown(!showMemberFilterDropdown);
                setShowTypeFilterDropdown(false);
              }}
              className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {selectedMember === 'ALL'
                    ? 'All Contributors'
                    : members.find((m) => m.id === selectedMember)?.displayName || selectedMember}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  showMemberFilterDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showMemberFilterDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember('ALL');
                    setShowMemberFilterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                    selectedMember === 'ALL'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>All Contributors</span>
                  {selectedMember === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                {members.map((m) => {
                  const isSelected = selectedMember === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(m.id);
                        setShowMemberFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{m.displayName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Summary Stat Strip */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-between text-xs text-slate-700 font-medium">
        <span>
          Showing <strong className="text-slate-900 font-extrabold">{totalCount}</strong> deposits
          {fromDate && toDate && (
            <span className="text-slate-500 text-[11px] ml-1">
              ({formatDate(fromDate)} to {formatDate(toDate)})
            </span>
          )}
        </span>
        <span>
          Total:{' '}
          <strong className="text-sm font-extrabold text-emerald-700">
            {formatCurrency(totalFilteredAmount)}
          </strong>
        </span>
      </div>

      {/* 5. Deposit List (Max 10 per page, Compact with Eye view icon & E badge) */}
      {paginatedDeposits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedDeposits.map((dep) => {
            return (
              <div
                key={dep.id}
                className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-100 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Deposit Type pill, payment method, date */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {dep.depositType || 'Contribution'}
                    </span>

                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {dep.paymentMethod && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {dep.paymentMethod}
                        </span>
                      )}
                      <span className="font-semibold text-slate-500">{formatDate(dep.date)}</span>
                    </div>
                  </div>

                  {/* Main Info with E symbol if edited */}
                  <div className="flex items-start justify-between gap-3 mt-1">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                            {dep.title}
                          </h3>
                          {/* E symbol if edited */}
                          {dep.isEdited && (
                            <span
                              className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                              title="Edited after submission"
                            >
                              E
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Deposited by <span className="font-semibold text-slate-700">{dep.depositedByName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-emerald-600">
                        + {formatCurrency(dep.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Eye (View), Edit, and Delete */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
                    ID: {dep.id}
                  </span>

                  {/* Actions: View (Eye) + Edit + Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingDeposit(dep)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                      title="View full deposit details and edit history"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => setEditingDeposit(dep)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                      title="Edit deposit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingId(dep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                      title="Delete deposit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No deposits recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedMember !== 'ALL' || selectedDepositType !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'Add money contributed or deposited by family members into the shared fund.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            + Add First Deposit
          </button>
        </div>
      )}

      {/* 6. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Page <strong className="text-slate-700">{safePage}</strong> of{' '}
            <strong className="text-slate-700">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= safePage - 1 && pageNum <= safePage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      safePage === pageNum
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 7. View Deposit Modal (Eye Icon - Detailed view + Remarks + Edit History) */}
      {viewingDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setViewingDeposit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Deposit Details
                  </h3>
                  {viewingDeposit.isEdited && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Edited (E)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">ID: {viewingDeposit.id}</span>
              </div>
            </div>

            {/* Main Financial Badge */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/80 rounded-2xl p-4 my-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Deposit Amount
                </span>
                <span className="text-2xl font-black text-emerald-900">
                  {formatCurrency(viewingDeposit.amount)}
                </span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-emerald-700 shadow-2xs">
                {viewingDeposit.depositType || 'Contribution'}
              </span>
            </div>

            {/* Deposit Key Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Title</span>
                <span className="font-bold text-slate-800 block truncate">{viewingDeposit.title}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Deposit Date</span>
                <span className="font-bold text-slate-800 block">{formatDate(viewingDeposit.date)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Deposit By</span>
                <span className="font-bold text-slate-800 block truncate">{viewingDeposit.depositedByName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Payment Mode</span>
                <span className="font-bold text-slate-800 block">{viewingDeposit.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Description / Remarks */}
            <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Description / Remarks
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {viewingDeposit.description ? viewingDeposit.description : 'No remarks or notes provided.'}
              </p>
            </div>

            {/* Detailed Edit History Section if edited */}
            {viewingDeposit.isEdited || (viewingDeposit.editHistory && viewingDeposit.editHistory.length > 0) ? (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold flex items-center justify-center">
                    E
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Edit History ({viewingDeposit.editHistory?.length || 0})
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Audit trail of all edits submitted after initial entry.
                </p>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {viewingDeposit.editHistory && viewingDeposit.editHistory.length > 0 ? (
                    viewingDeposit.editHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-3 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-amber-950 font-semibold pb-1.5 border-b border-amber-200/60">
                          <span className="font-bold">Edited by {item.editedByName}</span>
                          <span className="text-slate-500 font-medium text-[10px]">
                            {formatDateTime(item.timestamp)}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-0.5">
                          {item.changes.map((ch, cIdx) => (
                            <div key={cIdx} className="flex items-start justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-600 shrink-0">{ch.field}:</span>
                              <div className="flex items-center gap-1.5 text-right font-medium flex-wrap justify-end">
                                <span className="text-rose-600/80 line-through text-[11px]">
                                  {String(ch.from)}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-emerald-700 font-bold">{String(ch.to)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">
                      This record was updated. Detailed field changes will appear on future edits.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 8. Edit Deposit Modal */}
      {editingDeposit && (
        <DepositModal
          isOpen={true}
          onClose={() => setEditingDeposit(null)}
          depositToEdit={editingDeposit}
        />
      )}

      {/* 9. Confirm Deletion Dialog */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Deposit Record?"
        message="Are you sure you want to delete this deposit record? This will decrease the family balance immediately."
        confirmLabel="Delete Deposit"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
