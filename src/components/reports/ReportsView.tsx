import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  Filter,
  PieChart as PieIcon,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Tag,
  User,
  CreditCard,
  Layers,
  ReceiptIndianRupee,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useData } from '../../context/DataContext';
import {
  exportExpenseReportToExcel,
  exportExpenseReportToPDF,
  exportDepositReportToExcel,
  exportDepositReportToPDF,
} from '../../lib/exportReports';
import { formatDate } from '../../lib/dateUtils';
import { CategoryIcon } from '../common/CategoryIcon';

type ReportType = 'expense' | 'deposit';

// Default Date Range Helpers
const getFirstDayOfMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportsView: React.FC = () => {
  const {
    expenses,
    deposits,
    categories,
    members,
    paymentMethods,
    depositTypes,
    familySettings,
    formatCurrency,
    showToast,
  } = useData();

  // Active Report Module: 'expense' | 'deposit'
  const [reportType, setReportType] = useState<ReportType>('expense');

  // Shared Date Range Filters
  const [fromDate, setFromDate] = useState<string>(getFirstDayOfMonth);
  const [toDate, setToDate] = useState<string>(getTodayString);

  // Expense Report Filters (Starts with "All XYZ")
  const [expenseCategory, setExpenseCategory] = useState<string>('ALL'); // 'ALL' = All Categories
  const [expensePaidBy, setExpensePaidBy] = useState<string>('ALL'); // 'ALL' = All Paid By
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<string>('ALL'); // 'ALL' = All Payment Methods

  // Deposit Report Filters (Starts with "All XYZ")
  const [depositTypeFilter, setDepositTypeFilter] = useState<string>('ALL'); // 'ALL' = All Deposit Types
  const [depositByFilter, setDepositByFilter] = useState<string>('ALL'); // 'ALL' = All Deposit By

  // Dropdown Open States
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showDepositTypeDropdown, setShowDepositTypeDropdown] = useState(false);
  const [showDepositByDropdown, setShowDepositByDropdown] = useState(false);

  // Close dropdowns on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCatDropdown(false);
        setShowPaidByDropdown(false);
        setShowPaymentDropdown(false);
        setShowDepositTypeDropdown(false);
        setShowDepositByDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') => {
    const now = new Date();
    if (preset === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setFromDate(`${year}-${month}-01`);
      setToDate(getTodayString());
    } else if (preset === 'LAST_MONTH') {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const y = firstLastMonth.getFullYear();
      const m = String(firstLastMonth.getMonth() + 1).padStart(2, '0');
      const lastDay = String(lastLastMonth.getDate()).padStart(2, '0');
      setFromDate(`${y}-${m}-01`);
      setToDate(`${y}-${m}-${lastDay}`);
    } else if (preset === 'THIS_YEAR') {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(getTodayString());
    } else {
      setFromDate('2020-01-01');
      setToDate(getTodayString());
    }
  };

  // Reset Filters for current report
  const handleResetFilters = () => {
    setFromDate(getFirstDayOfMonth());
    setToDate(getTodayString());
    if (reportType === 'expense') {
      setExpenseCategory('ALL');
      setExpensePaidBy('ALL');
      setExpensePaymentMethod('ALL');
    } else {
      setDepositTypeFilter('ALL');
      setDepositByFilter('ALL');
    }
    showToast('Filters reset to default', 'info');
  };

  // Human-readable Date Range Label
  const dateRangeLabel = useMemo(() => {
    if (!fromDate && !toDate) return 'All Records';
    if (fromDate && !toDate) return `From ${formatDate(fromDate)}`;
    if (!fromDate && toDate) return `Up to ${formatDate(toDate)}`;
    return `${formatDate(fromDate)} to ${formatDate(toDate)}`;
  }, [fromDate, toDate]);

  // ==========================================
  // EXPENSE REPORT FILTER LOGIC
  // ==========================================
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Date Range
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;

      // 2. Category Filter
      if (expenseCategory !== 'ALL' && e.category.toLowerCase() !== expenseCategory.toLowerCase()) {
        return false;
      }

      // 3. Paid By Filter
      if (expensePaidBy !== 'ALL') {
        const matchesName = e.paidByName?.toLowerCase() === expensePaidBy.toLowerCase();
        const matchesId = e.paidBy === expensePaidBy;
        if (!matchesName && !matchesId) return false;
      }

      // 4. Payment Method Filter
      if (expensePaymentMethod !== 'ALL') {
        const itemPm = e.paymentMethod || 'Cash';
        if (itemPm.toLowerCase() !== expensePaymentMethod.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, fromDate, toDate, expenseCategory, expensePaidBy, expensePaymentMethod]);

  // Expense Aggregates
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const avgExpenseAmount = useMemo(() => {
    return filteredExpenses.length > 0 ? totalExpenseAmount / filteredExpenses.length : 0;
  }, [filteredExpenses, totalExpenseAmount]);

  const expenseCategoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += Number(e.amount) || 0;
    });

    return Object.entries(map)
      .map(([name, stat]) => {
        const catObj = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const color = catObj?.color || '#006466';
        const percentage = totalExpenseAmount > 0 ? ((stat.total / totalExpenseAmount) * 100).toFixed(1) : '0';
        return {
          name,
          total: stat.total,
          count: stat.count,
          color,
          percentage: Number(percentage),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories, totalExpenseAmount]);

  // ==========================================
  // DEPOSIT REPORT FILTER LOGIC
  // ==========================================
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      // 1. Date Range
      if (fromDate && d.date < fromDate) return false;
      if (toDate && d.date > toDate) return false;

      // 2. Deposit Type Filter
      if (depositTypeFilter !== 'ALL') {
        const itemType = d.depositType || 'Contribution';
        if (itemType.toLowerCase() !== depositTypeFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Deposit By Filter
      if (depositByFilter !== 'ALL') {
        const matchesName = d.depositedByName?.toLowerCase() === depositByFilter.toLowerCase();
        const matchesId = d.depositedBy === depositByFilter;
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [deposits, fromDate, toDate, depositTypeFilter, depositByFilter]);

  // Deposit Aggregates
  const totalDepositAmount = useMemo(() => {
    return filteredDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  }, [filteredDeposits]);

  const avgDepositAmount = useMemo(() => {
    return filteredDeposits.length > 0 ? totalDepositAmount / filteredDeposits.length : 0;
  }, [filteredDeposits, totalDepositAmount]);

  const depositTypeBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredDeposits.forEach((d) => {
      const type = d.depositType || 'Contribution';
      if (!map[type]) map[type] = { count: 0, total: 0 };
      map[type].count += 1;
      map[type].total += Number(d.amount) || 0;
    });

    const colors = ['#006466', '#065A60', '#0B525B', '#144552', '#1B3A4B', '#212F45', '#10B981', '#3B82F6'];
    return Object.entries(map)
      .map(([name, stat], idx) => {
        const percentage = totalDepositAmount > 0 ? ((stat.total / totalDepositAmount) * 100).toFixed(1) : '0';
        return {
          name,
          total: stat.total,
          count: stat.count,
          color: colors[idx % colors.length],
          percentage: Number(percentage),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredDeposits, totalDepositAmount]);

  // ==========================================
  // EXPORT ACTION HANDLERS
  // ==========================================
  const handleExportPDF = () => {
    if (reportType === 'expense') {
      if (filteredExpenses.length === 0) {
        showToast('No expense records found for current filters', 'error');
        return;
      }
      exportExpenseReportToPDF({
        familyName: familySettings.familyName,
        currency: familySettings.currency,
        dateRangeLabel,
        categoryFilter: expenseCategory === 'ALL' ? 'All Categories' : expenseCategory,
        paidByFilter: expensePaidBy === 'ALL' ? 'All Paid By' : expensePaidBy,
        paymentMethodFilter: expensePaymentMethod === 'ALL' ? 'All Payment Methods' : expensePaymentMethod,
        expenses: filteredExpenses,
        categories,
        members,
      });
      showToast('Expense report exported as PDF successfully!', 'success');
    } else {
      if (filteredDeposits.length === 0) {
        showToast('No deposit records found for current filters', 'error');
        return;
      }
      exportDepositReportToPDF({
        familyName: familySettings.familyName,
        currency: familySettings.currency,
        dateRangeLabel,
        depositTypeFilter: depositTypeFilter === 'ALL' ? 'All Deposit Types' : depositTypeFilter,
        depositByFilter: depositByFilter === 'ALL' ? 'All Deposit By' : depositByFilter,
        deposits: filteredDeposits,
        members,
      });
      showToast('Deposit report exported as PDF successfully!', 'success');
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'expense') {
      if (filteredExpenses.length === 0) {
        showToast('No expense records found for current filters', 'error');
        return;
      }
      exportExpenseReportToExcel({
        familyName: familySettings.familyName,
        currency: familySettings.currency,
        dateRangeLabel,
        categoryFilter: expenseCategory === 'ALL' ? 'All Categories' : expenseCategory,
        paidByFilter: expensePaidBy === 'ALL' ? 'All Paid By' : expensePaidBy,
        paymentMethodFilter: expensePaymentMethod === 'ALL' ? 'All Payment Methods' : expensePaymentMethod,
        expenses: filteredExpenses,
        categories,
        members,
      });
      showToast('Expense report exported as Excel successfully!', 'success');
    } else {
      if (filteredDeposits.length === 0) {
        showToast('No deposit records found for current filters', 'error');
        return;
      }
      exportDepositReportToExcel({
        familyName: familySettings.familyName,
        currency: familySettings.currency,
        dateRangeLabel,
        depositTypeFilter: depositTypeFilter === 'ALL' ? 'All Deposit Types' : depositTypeFilter,
        depositByFilter: depositByFilter === 'ALL' ? 'All Deposit By' : depositByFilter,
        deposits: filteredDeposits,
        members,
      });
      showToast('Deposit report exported as Excel successfully!', 'success');
    }
  };

  return (
    <div ref={containerRef} className="space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Module Header & Segmented Tab Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006466]" />
            Reports & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate and export customized expense and deposit records
          </p>
        </div>

        {/* Segmented Toggle: Expense Report vs Deposit Report */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setReportType('expense');
              setShowCatDropdown(false);
              setShowPaidByDropdown(false);
              setShowPaymentDropdown(false);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'expense'
                ? 'bg-[#006466] text-white shadow-sm shadow-[#006466]/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ReceiptIndianRupee className="w-4 h-4" />
            <span>Expense Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReportType('deposit');
              setShowDepositTypeDropdown(false);
              setShowDepositByDropdown(false);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'deposit'
                ? 'bg-[#006466] text-white shadow-sm shadow-[#006466]/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit Report</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Filter Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-[#006466]" />
            <span>
              {reportType === 'expense' ? 'Expense Filters' : 'Deposit Filters'}
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              ({reportType === 'expense' ? filteredExpenses.length : filteredDeposits.length} records found)
            </span>
          </div>

          {/* Quick Presets & Reset */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => handleSetPreset('THIS_MONTH')}
              className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-600 cursor-pointer transition shrink-0"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('LAST_MONTH')}
              className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-600 cursor-pointer transition shrink-0"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => handleSetPreset('THIS_YEAR')}
              className="text-[11px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-600 cursor-pointer transition shrink-0"
            >
              This Year
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* EXPENSE REPORT FILTERS: From, To, Category, Paid By, Payment */}
        {/* ======================================================== */}
        {reportType === 'expense' ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3">
            {/* 1. From Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                From Date
              </label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 2. To Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                To Date
              </label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Category Filter (Starts with 'All Categories') */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowCatDropdown(!showCatDropdown);
                  setShowPaidByDropdown(false);
                  setShowPaymentDropdown(false);
                }}
                className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {expenseCategory === 'ALL' ? 'All Categories' : expenseCategory}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showCatDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCatDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setExpenseCategory('ALL');
                      setShowCatDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      expenseCategory === 'ALL'
                        ? 'bg-[#006466]/10 text-[#006466] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Categories</span>
                    {expenseCategory === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466]" />}
                  </button>
                  {categories.map((c) => {
                    const isSelected = expenseCategory === c.name;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setExpenseCategory(c.name);
                          setShowCatDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#006466]/10 text-[#006466] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="truncate">{c.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Paid By Filter (Starts with 'All Paid By') */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Paid By
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPaidByDropdown(!showPaidByDropdown);
                  setShowCatDropdown(false);
                  setShowPaymentDropdown(false);
                }}
                className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {expensePaidBy === 'ALL'
                      ? 'All Paid By'
                      : members.find((m) => m.id === expensePaidBy || m.displayName === expensePaidBy)
                          ?.displayName || expensePaidBy}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showPaidByDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showPaidByDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setExpensePaidBy('ALL');
                      setShowPaidByDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      expensePaidBy === 'ALL'
                        ? 'bg-[#006466]/10 text-[#006466] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Paid By</span>
                    {expensePaidBy === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466]" />}
                  </button>
                  {members.map((m) => {
                    const isSelected = expensePaidBy === m.id || expensePaidBy === m.displayName;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setExpensePaidBy(m.displayName);
                          setShowPaidByDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#006466]/10 text-[#006466] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{m.displayName}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Payment Method Filter (Starts with 'All Payment Methods') */}
            <div className="col-span-2 md:col-span-1 bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Payment
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentDropdown(!showPaymentDropdown);
                  setShowCatDropdown(false);
                  setShowPaidByDropdown(false);
                }}
                className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {expensePaymentMethod === 'ALL' ? 'All Payment Methods' : expensePaymentMethod}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showPaymentDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showPaymentDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setExpensePaymentMethod('ALL');
                      setShowPaymentDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      expensePaymentMethod === 'ALL'
                        ? 'bg-[#006466]/10 text-[#006466] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Payment Methods</span>
                    {expensePaymentMethod === 'ALL' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006466]" />
                    )}
                  </button>
                  {paymentMethods.map((pm) => {
                    const isSelected = expensePaymentMethod === pm.name;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => {
                          setExpensePaymentMethod(pm.name);
                          setShowPaymentDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#006466]/10 text-[#006466] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{pm.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* DEPOSIT REPORT FILTERS: From, To, Deposit Type, Deposit By */
          /* ======================================================== */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. From Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                From Date
              </label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 2. To Date */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                To Date
              </label>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Deposit Type Filter (Starts with 'All Deposit Types') */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Deposit Type
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowDepositTypeDropdown(!showDepositTypeDropdown);
                  setShowDepositByDropdown(false);
                }}
                className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {depositTypeFilter === 'ALL' ? 'All Deposit Types' : depositTypeFilter}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showDepositTypeDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDepositTypeDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositTypeFilter('ALL');
                      setShowDepositTypeDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      depositTypeFilter === 'ALL'
                        ? 'bg-[#006466]/10 text-[#006466] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Deposit Types</span>
                    {depositTypeFilter === 'ALL' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006466]" />
                    )}
                  </button>
                  {depositTypes.map((dt) => {
                    const isSelected = depositTypeFilter === dt.name;
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => {
                          setDepositTypeFilter(dt.name);
                          setShowDepositTypeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#006466]/10 text-[#006466] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{dt.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Deposit By Filter (Starts with 'All Deposit By') */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-[#006466]/20 focus-within:border-[#006466] focus-within:bg-white transition relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Deposit By
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowDepositByDropdown(!showDepositByDropdown);
                  setShowDepositTypeDropdown(false);
                }}
                className="w-full flex items-center justify-between text-left text-slate-800 font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {depositByFilter === 'ALL'
                      ? 'All Deposit By'
                      : members.find((m) => m.id === depositByFilter || m.displayName === depositByFilter)
                          ?.displayName || depositByFilter}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    showDepositByDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDepositByDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setDepositByFilter('ALL');
                      setShowDepositByDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      depositByFilter === 'ALL'
                        ? 'bg-[#006466]/10 text-[#006466] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Deposit By</span>
                    {depositByFilter === 'ALL' && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466]" />}
                  </button>
                  {members.map((m) => {
                    const isSelected = depositByFilter === m.id || depositByFilter === m.displayName;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setDepositByFilter(m.displayName);
                          setShowDepositByDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#006466]/10 text-[#006466] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{m.displayName}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#006466] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Export Action Bar with summary & PDF/Excel buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">
              {reportType === 'expense' ? 'Expense' : 'Deposit'} Period:
            </span>{' '}
            {dateRangeLabel}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            {reportType === 'expense' ? 'Total Expenses' : 'Total Deposits'}
          </span>
          <div
            className={`text-base sm:text-xl font-extrabold mt-1 truncate ${
              reportType === 'expense' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(reportType === 'expense' ? totalExpenseAmount : totalDepositAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            {reportType === 'expense' ? filteredExpenses.length : filteredDeposits.length} transactions
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Average Amount
          </span>
          <div className="text-base sm:text-xl font-extrabold text-slate-800 mt-1 truncate">
            {formatCurrency(reportType === 'expense' ? avgExpenseAmount : avgDepositAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Per transaction</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            {reportType === 'expense' ? 'Top Category' : 'Top Deposit Type'}
          </span>
          <div className="text-base sm:text-xl font-extrabold text-[#006466] mt-1 truncate">
            {reportType === 'expense'
              ? expenseCategoryBreakdown[0]?.name || 'N/A'
              : depositTypeBreakdown[0]?.name || 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            {reportType === 'expense'
              ? expenseCategoryBreakdown[0]
                ? `${formatCurrency(expenseCategoryBreakdown[0].total)} (${expenseCategoryBreakdown[0].percentage}%)`
                : 'No data'
              : depositTypeBreakdown[0]
              ? `${formatCurrency(depositTypeBreakdown[0].total)} (${depositTypeBreakdown[0].percentage}%)`
              : 'No data'}
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Active Filter Status
          </span>
          <div className="text-sm sm:text-base font-bold text-slate-700 mt-1 truncate">
            {reportType === 'expense' ? (
              expenseCategory !== 'ALL' || expensePaidBy !== 'ALL' || expensePaymentMethod !== 'ALL'
                ? 'Filtered Subset'
                : 'All Transactions'
            ) : depositTypeFilter !== 'ALL' || depositByFilter !== 'ALL' ? (
              'Filtered Subset'
            ) : (
              'All Transactions'
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">{dateRangeLabel}</span>
        </div>
      </div>

      {/* 5. Distribution Breakdown & Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {reportType === 'expense' ? 'Category Spending Breakdown' : 'Deposit Source Breakdown'}
            </h3>
            <span className="text-[10px] text-slate-400">Share of Total</span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {(reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {(reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown).map(
                      (entry, index) => (
                        <Cell key={`rep-cell-${index}`} fill={entry.color} />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Total Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center py-10">
                No transactions match selected filters
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Total {reportType === 'expense' ? 'Expenditure' : 'Deposits'}:{' '}
            <span className="font-bold text-slate-700">
              {formatCurrency(reportType === 'expense' ? totalExpenseAmount : totalDepositAmount)}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
            {reportType === 'expense' ? 'Expenses by Category' : 'Deposits by Type'}
          </h3>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {(reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown).length > 0 ? (
              (reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown).map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.count} transactions</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-900 block">
                      {formatCurrency(item.total)}
                    </span>
                    <span className="text-[10px] text-[#006466] font-semibold">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No records available for the selected filters.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Groups: {(reportType === 'expense' ? expenseCategoryBreakdown : depositTypeBreakdown).length}</span>
            <span>Period: {dateRangeLabel}</span>
          </div>
        </div>
      </div>

      {/* 6. Filtered Transactions Table / List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {reportType === 'expense' ? 'Detailed Expense Records' : 'Detailed Deposit Records'}
            </h3>
            <p className="text-xs text-slate-400">
              Showing {reportType === 'expense' ? filteredExpenses.length : filteredDeposits.length} transactions
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            Total:{' '}
            <span className={reportType === 'expense' ? 'text-rose-600' : 'text-emerald-600'}>
              {formatCurrency(reportType === 'expense' ? totalExpenseAmount : totalDepositAmount)}
            </span>
          </div>
        </div>

        {/* Mobile View: Transaction Cards */}
        <div className="block md:hidden space-y-2.5">
          {reportType === 'expense' ? (
            filteredExpenses.length > 0 ? (
              filteredExpenses.map((e, index) => (
                <div
                  key={e.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800 truncate">{e.title}</span>
                    <span className="text-xs font-extrabold text-rose-600 shrink-0">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium">#{index + 1} • {formatDate(e.date)}</span>
                    <span className="bg-white border border-slate-200/90 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {e.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Paid by: <strong className="text-slate-600">{e.paidByName}</strong></span>
                    <span>Method: <strong className="text-slate-600">{e.paymentMethod || 'Cash'}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                No expense transactions found for selected filters
              </div>
            )
          ) : filteredDeposits.length > 0 ? (
            filteredDeposits.map((d, index) => (
              <div
                key={d.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-800 truncate">{d.title}</span>
                  <span className="text-xs font-extrabold text-emerald-600 shrink-0">
                    {formatCurrency(d.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-slate-400 font-medium">#{index + 1} • {formatDate(d.date)}</span>
                  <span className="bg-emerald-50 border border-emerald-200/90 text-emerald-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                    {d.depositType || 'Contribution'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Deposited by: <strong className="text-slate-600">{d.depositedByName}</strong></span>
                  <span>Method: <strong className="text-slate-600">{d.paymentMethod || 'Cash'}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              No deposit transactions found for selected filters
            </div>
          )}
        </div>

        {/* Desktop View: Comprehensive Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5 pl-2">#</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Title</th>
                <th className="pb-2.5">{reportType === 'expense' ? 'Category' : 'Deposit Type'}</th>
                <th className="pb-2.5">{reportType === 'expense' ? 'Paid By' : 'Deposit By'}</th>
                <th className="pb-2.5">Payment Method</th>
                <th className="pb-2.5 text-right pr-2">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportType === 'expense' ? (
                filteredExpenses.length > 0 ? (
                  filteredExpenses.map((e, index) => (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 pl-2 text-slate-400 font-semibold">{index + 1}</td>
                      <td className="py-2.5 font-semibold text-slate-600 whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="py-2.5 font-bold text-slate-800 max-w-xs truncate">{e.title}</td>
                      <td className="py-2.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700 font-medium">{e.paidByName}</td>
                      <td className="py-2.5 text-slate-600">{e.paymentMethod || 'Cash'}</td>
                      <td className="py-2.5 text-right pr-2 font-extrabold text-rose-600 whitespace-nowrap">
                        {formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                      No expense records found for current filters.
                    </td>
                  </tr>
                )
              ) : filteredDeposits.length > 0 ? (
                filteredDeposits.map((d, index) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 pl-2 text-slate-400 font-semibold">{index + 1}</td>
                    <td className="py-2.5 font-semibold text-slate-600 whitespace-nowrap">
                      {formatDate(d.date)}
                    </td>
                    <td className="py-2.5 font-bold text-slate-800 max-w-xs truncate">{d.title}</td>
                    <td className="py-2.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                        {d.depositType || 'Contribution'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 font-medium">{d.depositedByName}</td>
                    <td className="py-2.5 text-slate-600">{d.paymentMethod || 'Cash'}</td>
                    <td className="py-2.5 text-right pr-2 font-extrabold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(d.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                    No deposit records found for current filters.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Total Row */}
            {(reportType === 'expense' ? filteredExpenses : filteredDeposits).length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-xs text-slate-800">
                  <td colSpan={6} className="py-3 pl-2 uppercase tracking-wider text-[11px]">
                    Total Filtered ({reportType === 'expense' ? filteredExpenses.length : filteredDeposits.length}{' '}
                    Transactions)
                  </td>
                  <td
                    className={`py-3 pr-2 text-right font-extrabold text-sm ${
                      reportType === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(reportType === 'expense' ? totalExpenseAmount : totalDepositAmount)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
