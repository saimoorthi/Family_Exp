import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  IndianRupee,
  Plus,
  ArrowRight,
  ReceiptIndianRupee,
  Wallet,
  Calendar,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ActiveTab } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddExpense: () => void;
  onOpenAddDeposit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddDeposit,
}) => {
  const { expenses, deposits, categories, formatCurrency, formatDate, selectedMonth, setSelectedMonth } =
    useData();

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Helper to format YYYY-MM into "Nov - 26"
  const formatMonthLabel = (monthKey: string) => {
    if (!monthKey || !monthKey.includes('-')) return monthKey;
    const [yearStr, monthStr] = monthKey.split('-');
    const monthIdx = parseInt(monthStr, 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[monthIdx] || monthStr;
    const shortYear = yearStr.slice(-2);
    return `${monthName} - ${shortYear}`;
  };

  // 1. Gather all dates from expenses and deposits to find range
  const allEntryDates = useMemo(() => {
    const dates: string[] = [];
    expenses.forEach((e) => {
      if (e.date) dates.push(e.date);
    });
    deposits.forEach((d) => {
      if (d.date) dates.push(d.date);
    });
    return dates.filter(Boolean).sort();
  }, [expenses, deposits]);

  // 2. Month Options for dropdown
  // Starts strictly from first entry (no previous months), up to latest month / current month
  // Months with no entries are greyed out
  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    if (allEntryDates.length === 0) {
      return [{ value: currentKey, label: formatMonthLabel(currentKey), hasData: false }];
    }

    // Earliest entry
    const earliestDate = allEntryDates[0];
    const [eYearStr, eMonthStr] = earliestDate.split('-');
    const startYear = parseInt(eYearStr, 10);
    const startMonth = parseInt(eMonthStr, 10);

    // Latest entry
    const latestDate = allEntryDates[allEntryDates.length - 1];
    const [lYearStr, lMonthStr] = latestDate.split('-');
    let endYear = parseInt(lYearStr, 10);
    let endMonth = parseInt(lMonthStr, 10);

    // Extend up to current date if current date is after latest entry
    if (currentYear > endYear || (currentYear === endYear && currentMonth > endMonth)) {
      endYear = currentYear;
      endMonth = currentMonth;
    }

    const options: { value: string; label: string; hasData: boolean }[] = [];
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const val = `${curY}-${String(curM).padStart(2, '0')}`;
      const hasExp = expenses.some((e) => e.date?.startsWith(val));
      const hasDep = deposits.some((d) => d.date?.startsWith(val));
      options.push({
        value: val,
        label: formatMonthLabel(val),
        hasData: hasExp || hasDep,
      });

      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    return options.reverse();
  }, [allEntryDates, expenses, deposits]);

  // If selectedMonth has no data and there is an option with data, default to latest with data
  useEffect(() => {
    if (monthOptions.length > 0) {
      const currentSelectedHasData = monthOptions.find((m) => m.value === selectedMonth && m.hasData);
      if (!currentSelectedHasData) {
        const latestWithData = monthOptions.find((m) => m.hasData);
        if (latestWithData) {
          setSelectedMonth(latestWithData.value);
        }
      }
    }
  }, [monthOptions, selectedMonth, setSelectedMonth]);

  // Filter transactions for the selected month (YYYY-MM)
  const monthExpenses = expenses.filter((e) => e.date?.startsWith(selectedMonth));
  const monthDeposits = deposits.filter((d) => d.date?.startsWith(selectedMonth));

  // Calculations for selected month
  const monthTotalExpenses = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const monthTotalDeposits = monthDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const monthBalance = monthTotalDeposits - monthTotalExpenses;

  // All-time totals
  const allTimeExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const allTimeDeposits = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const allTimeBalance = allTimeDeposits - allTimeExpenses;

  // Category breakdown for donut chart
  const categoryMap: Record<string, number> = {};
  monthExpenses.forEach((exp) => {
    const cat = exp.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(exp.amount) || 0);
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => {
      const catObj = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
      const color = catObj?.color || '#818CF8';
      const percentage = monthTotalExpenses > 0 ? Math.round((value / monthTotalExpenses) * 100) : 0;
      return { name, value, color, percentage };
    })
    .sort((a, b) => b.value - a.value);

  const hasExpensesInMonth = categoryData.length > 0;
  const chartData = hasExpensesInMonth
    ? categoryData
    : [{ name: 'No Expenses', value: 1, color: '#E2E8F0', percentage: 0 }];

  // ----------------------------------------------------------------------
  // Year Overview Logic (Years only with available data)
  // ----------------------------------------------------------------------
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 4) {
        yearSet.add(e.date.substring(0, 4));
      }
    });
    deposits.forEach((d) => {
      if (d.date && d.date.length >= 4) {
        yearSet.add(d.date.substring(0, 4));
      }
    });
    if (yearSet.size === 0) {
      yearSet.add(String(new Date().getFullYear()));
    }
    return Array.from(yearSet).sort().reverse();
  }, [expenses, deposits]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return selectedMonth ? selectedMonth.split('-')[0] : String(new Date().getFullYear());
  });

  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Year Overview calculations
  const yearDeposits = useMemo(() => {
    return deposits.filter((d) => d.date?.startsWith(selectedYear));
  }, [deposits, selectedYear]);

  const yearExpenses = useMemo(() => {
    return expenses.filter((e) => e.date?.startsWith(selectedYear));
  }, [expenses, selectedYear]);

  const yearTotalDeposits = useMemo(() => {
    return yearDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [yearDeposits]);

  const yearTotalExpenses = useMemo(() => {
    return yearExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [yearExpenses]);

  // Average expense for the month in selectedYear
  const monthsWithExpensesCount = useMemo(() => {
    const distinctMonths = new Set(yearExpenses.map((e) => e.date?.substring(0, 7)).filter(Boolean));
    return distinctMonths.size || 1;
  }, [yearExpenses]);

  const avgMonthlyExpense = yearTotalExpenses / monthsWithExpensesCount;

  // Monthly Expense Trend for selectedYear
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const yearlyExpenseData = useMemo(() => {
    return monthLabels.map((label, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const monthKey = `${selectedYear}-${monthNum}`;
      const expTotal = expenses
        .filter((e) => e.date?.startsWith(monthKey))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return {
        month: label,
        monthKey,
        expenses: expTotal,
      };
    });
  }, [selectedYear, expenses]);

  const totalYearlyExpenses = yearlyExpenseData.reduce((sum, m) => sum + m.expenses, 0);

  // Combined Recent Transactions (Maximum 10 entries)
  const combinedRecent = [
    ...expenses.map((e) => ({
      ...e,
      txType: 'EXPENSE' as const,
      displayDate: e.date,
    })),
    ...deposits.map((d) => ({
      ...d,
      txType: 'DEPOSIT' as const,
      displayDate: d.date,
      category: 'Deposit',
    })),
  ]
    .sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4 md:space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-3.5 md:px-6 pt-2">
      {/* 1. All-time Quick Stats (Desktop/Tablet) */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Family Balance</span>
            <div className={`text-xl font-extrabold mt-1 ${allTimeBalance >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
              {formatCurrency(allTimeBalance)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Deposits (All Time)</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(allTimeDeposits)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Expenses (All Time)</span>
            <div className="text-xl font-extrabold text-rose-600 mt-1">
              {formatCurrency(allTimeExpenses)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Month Overview Card (Horizontal 3 KPIs + Month Dropdown) */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 animate-in fade-in">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight">
            Month Overview
          </h2>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-900 font-bold px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm transition cursor-pointer border border-indigo-100 shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formatMonthLabel(selectedMonth)}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-indigo-600 transition-transform ${
                  showMonthDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Select Month
                </div>
                {monthOptions.map((opt) => {
                  const isSelected = opt.value === selectedMonth;
                  if (!opt.hasData) {
                    return (
                      <div
                        key={opt.value}
                        title="No entries in this month"
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 flex items-center justify-between select-none cursor-not-allowed bg-slate-50/40"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-slate-300 italic">No entries</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedMonth(opt.value);
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-600 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3 Month KPIs Horizontal */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          {/* Deposits */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-emerald-500">
              <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Deposits</div>
            <div className="text-xs sm:text-base md:text-xl font-extrabold text-slate-900 mt-0.5 truncate">
              {formatCurrency(monthTotalDeposits)}
            </div>
          </div>

          {/* Expenses */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-rose-500">
              <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Expenses</div>
            <div className="text-xs sm:text-base md:text-xl font-extrabold text-slate-900 mt-0.5 truncate">
              {formatCurrency(monthTotalExpenses)}
            </div>
          </div>

          {/* Balance */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-indigo-500">
              <span className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Balance</div>
            <div
              className={`text-xs sm:text-base md:text-xl font-extrabold mt-0.5 truncate ${
                monthBalance >= 0 ? 'text-indigo-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(monthBalance)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Year Overview Card (Horizontal Layout) */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 animate-in fade-in">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight">
            Year Overview
          </h2>

          {/* Year Dropdown only for available data */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Year KPIs Horizontal */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          {/* Overall Deposit */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-emerald-500">
              <span className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                <ArrowUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Overall Deposit</div>
            <div className="text-xs sm:text-base md:text-xl font-extrabold text-slate-900 mt-0.5 truncate">
              {formatCurrency(yearTotalDeposits)}
            </div>
          </div>

          {/* Overall Expense */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-rose-500">
              <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center">
                <ArrowDown className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Overall Expense</div>
            <div className="text-xs sm:text-base md:text-xl font-extrabold text-slate-900 mt-0.5 truncate">
              {formatCurrency(yearTotalExpenses)}
            </div>
          </div>

          {/* Avg. Expense / Month */}
          <div className="px-1 md:px-2">
            <div className="flex items-center justify-center mb-1 text-indigo-500">
              <span className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
              </span>
            </div>
            <div className="text-[11px] md:text-sm font-semibold text-slate-400">Avg. Expense</div>
            <div className="text-xs sm:text-base md:text-xl font-extrabold text-indigo-900 mt-0.5 truncate">
              {formatCurrency(avgMonthlyExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Charts Section (Side-by-side on desktop, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Monthly Spend Category Donut Chart */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight">
              Monthly Spend ({formatMonthLabel(selectedMonth)})
            </h2>
            <span className="text-xs text-slate-400 font-medium">By Category</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 py-2">
            {/* Donut Chart */}
            <div className="sm:col-span-7 h-48 sm:h-52 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={hasExpensesInMonth ? 3 : 0}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-sm md:text-base font-extrabold text-slate-900">
                  {formatCurrency(monthTotalExpenses)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Expenses</span>
              </div>
            </div>

            {/* Legends Breakdown */}
            <div className="sm:col-span-5 space-y-1.5 md:space-y-2 max-h-48 overflow-y-auto pr-1">
              {hasExpensesInMonth ? (
                categoryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-900 font-bold shrink-0 ml-2">
                      {item.percentage}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No expense records for this month yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{monthExpenses.length} transactions recorded</span>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5. Separate Card: Monthly Expenses Breakdown - Year (No Jan-Dec text) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight">
              Monthly Expenses Breakdown - {selectedYear}
            </h2>
          </div>

          <div className="h-52 sm:h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyExpenseData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Expense']}
                  labelFormatter={(lbl) => `${lbl} ${selectedYear}`}
                />
                <Bar dataKey="expenses" name="Expenses" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Average Monthly Expense</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(avgMonthlyExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Recent Transactions Card (Maximum 10 entries) */}
      <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight">
              Recent Transactions
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Latest {combinedRecent.length}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('expenses')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {combinedRecent.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {combinedRecent.map((tx) => {
              const isDeposit = tx.txType === 'DEPOSIT';
              const catObj = categories.find(
                (c) => c.name.toLowerCase() === (tx.category || '').toLowerCase()
              );
              const color = isDeposit ? '#10B981' : catObj?.color || '#F59E0B';
              const iconName = isDeposit ? 'Wallet' : catObj?.icon || 'ReceiptIndianRupee';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-2xl px-1.5 md:px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon Circle */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: `${color}18`,
                        color: color,
                      }}
                    >
                      {isDeposit ? (
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <CategoryIcon name={iconName} color={color} size={18} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 leading-snug truncate max-w-[150px] sm:max-w-xs">
                          {tx.title}
                        </h3>
                        {(tx as any).isEdited && (
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                            title="Edited after submission"
                          >
                            E
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-500">{formatDate(tx.displayDate)}</span>
                        <span>•</span>
                        <span className="truncate max-w-[80px]">
                          {isDeposit ? (tx as any).depositedByName : (tx as any).paidByName}
                        </span>
                        {tx.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md text-[9px] font-medium shrink-0">
                              {tx.paymentMethod}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0 ml-2">
                    <span
                      className={`text-xs sm:text-sm md:text-base font-extrabold ${
                        isDeposit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isDeposit ? `+ ${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 md:py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-3">
              <ReceiptIndianRupee className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No transactions recorded yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Start by recording your daily grocery, utilities, or family fund deposits.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={onOpenAddExpense}
                className="bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                + Add Expense
              </button>
              <button
                onClick={onOpenAddDeposit}
                className="bg-emerald-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                + Add Deposit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons for Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 flex flex-col gap-2.5 z-30">
        <button
          onClick={onOpenAddDeposit}
          aria-label="Add Deposit"
          className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenAddExpense}
          aria-label="Add Expense"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
