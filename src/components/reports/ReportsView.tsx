import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  CheckCircle,
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
  Legend,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { exportToExcel, exportToPDF } from '../../lib/exportReports';
import { CategoryIcon } from '../common/CategoryIcon';

type DateRangeType = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL_TIME';

export const ReportsView: React.FC = () => {
  const { expenses, deposits, categories, members, familySettings, formatCurrency } = useData();

  const [dateRange, setDateRange] = useState<DateRangeType>('THIS_MONTH');
  const [activeReportTab, setActiveReportTab] = useState<'category' | 'members' | 'monthly'>('category');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Calculate filtered date bounds
  const { filteredExpenses, filteredDeposits, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let label = '';

    if (dateRange === 'THIS_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (dateRange === 'LAST_MONTH') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      label = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const exp = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= startDate && d <= endDate;
      });
      const dep = deposits.filter((d) => {
        const d_date = new Date(d.date);
        return d_date >= startDate && d_date <= endDate;
      });
      return { filteredExpenses: exp, filteredDeposits: dep, dateRangeLabel: label };
    } else if (dateRange === 'LAST_3_MONTHS') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      label = `Last 3 Months (${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${now.toLocaleDateString('en-US', { month: 'short' })})`;
    } else if (dateRange === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      label = `Year ${now.getFullYear()}`;
    } else {
      // ALL_TIME
      startDate = new Date(2000, 0, 1);
      label = 'All Time Records';
    }

    const exp = expenses.filter((e) => new Date(e.date) >= startDate);
    const dep = deposits.filter((d) => new Date(d.date) >= startDate);

    return { filteredExpenses: exp, filteredDeposits: dep, dateRangeLabel: label };
  }, [expenses, deposits, dateRange]);

  // Aggregate Figures
  const totalExpense = useMemo(
    () => filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );
  const totalDeposit = useMemo(
    () => filteredDeposits.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    [filteredDeposits]
  );
  const netSavings = totalDeposit - totalExpense;
  const savingsRate = totalDeposit > 0 ? Math.round((netSavings / totalDeposit) * 100) : 0;

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'Other';
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count += 1;
      map[cat].total += Number(exp.amount) || 0;
    });

    return Object.entries(map)
      .map(([name, stat]) => {
        const catObj = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const color = catObj?.color || '#818CF8';
        const percentage = totalExpense > 0 ? ((stat.total / totalExpense) * 100).toFixed(1) : '0';
        return {
          name,
          total: stat.total,
          count: stat.count,
          color,
          percentage: Number(percentage),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, categories, totalExpense]);

  // Member-wise Breakdown (Expenditures vs Deposits)
  const memberStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; deposits: number; expenses: number }> = {};

    members.forEach((m) => {
      map[m.id] = { id: m.id, name: m.displayName, deposits: 0, expenses: 0 };
    });

    filteredDeposits.forEach((d) => {
      const id = d.depositedBy || 'unknown';
      if (!map[id]) map[id] = { id, name: d.depositedByName || 'Member', deposits: 0, expenses: 0 };
      map[id].deposits += Number(d.amount) || 0;
    });

    filteredExpenses.forEach((e) => {
      const id = e.paidBy || 'unknown';
      if (!map[id]) map[id] = { id, name: e.paidByName || 'Member', deposits: 0, expenses: 0 };
      map[id].expenses += Number(e.amount) || 0;
    });

    return Object.values(map).map((item) => ({
      ...item,
      net: item.deposits - item.expenses,
    }));
  }, [filteredDeposits, filteredExpenses, members]);

  // Handle Export Excel
  const handleExportExcel = () => {
    exportToExcel({
      familyName: familySettings.familyName,
      currency: familySettings.currency,
      dateRangeLabel,
      expenses: filteredExpenses,
      deposits: filteredDeposits,
      categories,
      members,
    });
    setExportSuccessMsg('Excel report downloaded successfully!');
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    exportToPDF({
      familyName: familySettings.familyName,
      currency: familySettings.currency,
      dateRangeLabel,
      expenses: filteredExpenses,
      deposits: filteredDeposits,
      categories,
      members,
    });
    setExportSuccessMsg('PDF report generated and downloaded!');
    setTimeout(() => setExportSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Header Toolbar with Filters & Export Actions */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-xs border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              ['THIS_MONTH', 'This Month'],
              ['LAST_MONTH', 'Last Month'],
              ['LAST_3_MONTHS', 'Last 3 Months'],
              ['THIS_YEAR', 'This Year'],
              ['ALL_TIME', 'All Time'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDateRange(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                dateRange === val
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {exportSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Fund Inflow
          </span>
          <div className="text-lg md:text-xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(totalDeposit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {filteredDeposits.length} deposits
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Family Outflow
          </span>
          <div className="text-lg md:text-xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(totalExpense)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {filteredExpenses.length} expenses
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Net Savings
          </span>
          <div
            className={`text-lg md:text-xl font-extrabold mt-1 ${
              netSavings >= 0 ? 'text-indigo-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netSavings)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Inflow minus Outflow</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Savings Rate
          </span>
          <div className="text-lg md:text-xl font-extrabold text-indigo-600 mt-1">
            {savingsRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Of total contributions</span>
        </div>
      </div>

      {/* 3. Sub-View Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => setActiveReportTab('category')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReportTab === 'category'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          <span>Category-Wise Breakdown</span>
        </button>

        <button
          onClick={() => setActiveReportTab('members')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReportTab === 'members'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Member-Wise Analysis</span>
        </button>
      </div>

      {/* 4. Tab 1: Category Breakdown */}
      {activeReportTab === 'category' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Category Spending Distribution</h3>
            <div className="h-60 relative flex items-center justify-center">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="total"
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`rep-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrency(Number(val) || 0),
                        'Total',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No expenses in selected period</div>
              )}
            </div>
            <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
              Period: {dateRangeLabel}
            </div>
          </div>

          {/* Detailed Category Table */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Expenses by Category</h3>
            {categoryStats.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {categoryStats.map((cat) => (
                  <div key={cat.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">{cat.name}</span>
                        <span className="text-[11px] text-slate-400">{cat.count} transactions</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 block">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="text-[11px] text-indigo-600 font-semibold">
                        {cat.percentage}% of total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No expense transactions recorded in this date range.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Member Analysis */}
      {activeReportTab === 'members' && (
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Member Contributions vs Expenditures
            </h3>
            <span className="text-xs text-slate-400">{dateRangeLabel}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Amount']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="deposits" name="Deposits (In)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Paid Expenses (Out)" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Member Breakdown Table */}
          <div className="pt-4 border-t border-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Member</th>
                  <th className="pb-2">Fund Deposited</th>
                  <th className="pb-2">Expenses Paid</th>
                  <th className="pb-2 text-right">Net Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberStats.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-bold text-slate-800">{m.name}</td>
                    <td className="py-2.5 text-emerald-600 font-bold">{formatCurrency(m.deposits)}</td>
                    <td className="py-2.5 text-slate-700 font-medium">{formatCurrency(m.expenses)}</td>
                    <td
                      className={`py-2.5 font-extrabold text-right ${
                        m.net >= 0 ? 'text-indigo-900' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(m.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
