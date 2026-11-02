import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ReceiptIndianRupee,
  Edit2,
  Calendar,
  FileImage,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Trash2,
  Filter,
  Tag,
  User,
} from 'lucide-react';
import { Expense } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { ExpenseModal } from './ExpenseModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatDateTime } from '../../lib/dateUtils';

interface ExpensesViewProps {
  onOpenAddModal: () => void;
}

const PAGE_SIZE = 10;

// Helper to get current month's start and end dates (YYYY-MM-DD)
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const from = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenAddModal }) => {
  const { expenses, categories, members, formatCurrency, formatDate, deleteExpense } = useData();
  const { userProfile, isAdmin } = useAuth();

  // Current Month default range
  const monthRange = useMemo(() => getCurrentMonthRange(), []);
  const [fromDate, setFromDate] = useState<string>(monthRange.from);
  const [toDate, setToDate] = useState<string>(monthRange.to);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<string>('ALL');

  // Pagination state (max 10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [fromDate, toDate, selectedCategory, selectedMember]);

  // Reset dates to current month
  const handleResetToCurrentMonth = () => {
    const range = getCurrentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setSelectedCategory('ALL');
    setSelectedMember('ALL');
    setCurrentPage(1);
  };

  // Filtered Expenses: always sorted newest first, no sort dropdown needed
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Date range filter
        if (fromDate && exp.date < fromDate) {
          return false;
        }
        if (toDate && exp.date > toDate) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
          return false;
        }

        // Member filter
        if (selectedMember !== 'ALL' && exp.paidBy !== selectedMember) {
          return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, fromDate, toDate, selectedCategory, selectedMember]);

  // Financial summary for filtered selection
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Pagination calculation
  const totalCount = filteredExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedExpenses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredExpenses.slice(start, start + PAGE_SIZE);
  }, [filteredExpenses, safePage]);

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Header with Red Add Expense Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Expenses
          </h2>
          <p className="text-xs text-slate-400">
            Track, filter, and review family expenses
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-rose-600/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 2. Responsive Filter Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Transactions</span>
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
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400 focus-within:bg-white transition">
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
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400 focus-within:bg-white transition">
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

          {/* Category Dropdown */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400 focus-within:bg-white transition relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="flex items-center gap-1.5 relative">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer pr-5 truncate"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
            </div>
          </div>

          {/* Member Dropdown */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400 focus-within:bg-white transition relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Paid By
            </label>
            <div className="flex items-center gap-1.5 relative">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full appearance-none bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer pr-5 truncate"
              >
                <option value="ALL">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Summary Stat Strip */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-xs text-slate-700 font-medium">
        <span>
          Showing <strong className="text-slate-900 font-extrabold">{totalCount}</strong> expenses
          {fromDate && toDate && (
            <span className="text-slate-500 text-[11px] ml-1">
              ({formatDate(fromDate)} to {formatDate(toDate)})
            </span>
          )}
        </span>
        <span>
          Total:{' '}
          <strong className="text-sm font-extrabold text-slate-900">
            {formatCurrency(totalFilteredAmount)}
          </strong>
        </span>
      </div>

      {/* 3. Expense List (Max 10 per page, Compact - Remarks removed) */}
      {paginatedExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedExpenses.map((exp) => {
            const catObj = categories.find(
              (c) => c.name.toLowerCase() === exp.category.toLowerCase()
            );
            const color = catObj?.color || '#6366F1';
            const iconName = catObj?.icon || 'ReceiptIndianRupee';
            const canEdit = isAdmin || exp.createdBy === userProfile?.id;

            return (
              <div
                key={exp.id}
                className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Top line: Category pill, payment method, date */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${color}18`,
                        color: color,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {exp.category}
                    </span>

                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {exp.paymentMethod && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {exp.paymentMethod}
                        </span>
                      )}
                      <span className="font-semibold text-slate-500">{formatDate(exp.date)}</span>
                    </div>
                  </div>

                  {/* Main Info with E symbol if edited */}
                  <div className="flex items-start justify-between gap-3 mt-1">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                        }}
                      >
                        <CategoryIcon name={iconName} color={color} size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug truncate">
                            {exp.title}
                          </h3>
                          {/* E symbol if edited */}
                          {exp.isEdited && (
                            <span
                              className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0"
                              title="Edited after submission"
                            >
                              E
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paid by <span className="font-semibold text-slate-700">{exp.paidByName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Eye (View), Edit, and Receipt info */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {exp.receiptUrl ? (
                    <button
                      onClick={() => setPreviewReceipt(exp.receiptUrl || null)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                  ) : (
                    <span className="text-slate-300 text-[11px]">No receipt</span>
                  )}

                  {/* Actions: View (Eye) + Edit + Delete (Admin only) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingExpense(exp)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                      title="View full expense details and edit history"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => setEditingExpense(exp)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                        title="Edit expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => setDeletingId(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition flex items-center gap-1 font-semibold text-xs"
                        title="Delete expense (Admin only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <ReceiptIndianRupee className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No expenses found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedCategory !== 'ALL' || selectedMember !== 'ALL'
              ? 'Try adjusting your category or member filter.'
              : 'No expense records found for the selected date range.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-rose-700 transition cursor-pointer"
          >
            + Add First Expense
          </button>
        </div>
      )}

      {/* 4. Pagination Controls (Max 10 per page) */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left">
            Showing <strong className="text-slate-800">{(safePage - 1) * PAGE_SIZE + 1}</strong> to{' '}
            <strong className="text-slate-800">{Math.min(safePage * PAGE_SIZE, totalCount)}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> expenses
          </div>

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
              // Only render window of page numbers if total pages is large
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
                    className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer ${
                      safePage === pageNum
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                return (
                  <span key={pageNum} className="text-slate-400 px-1">
                    ...
                  </span>
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

      {/* 5. View Expense Modal (Eye Icon - Detailed view + Remarks + Edit History) */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setViewingExpense(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ReceiptIndianRupee className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Expense Details
                  </h3>
                  {viewingExpense.isEdited && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      Edited (E)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">ID: {viewingExpense.id}</span>
              </div>
            </div>

            {/* Main Financial Badge */}
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100/80 rounded-2xl p-4 my-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expense Amount
                </span>
                <span className="text-2xl font-black text-indigo-900">
                  {formatCurrency(viewingExpense.amount)}
                </span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                {viewingExpense.category}
              </span>
            </div>

            {/* Expense Key Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Title</span>
                <span className="font-bold text-slate-800 block truncate">{viewingExpense.title}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Expense Date</span>
                <span className="font-bold text-slate-800 block">{formatDate(viewingExpense.date)}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Paid By</span>
                <span className="font-bold text-slate-800 block truncate">{viewingExpense.paidByName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Payment Mode</span>
                <span className="font-bold text-slate-800 block">{viewingExpense.paymentMethod || 'UPI'}</span>
              </div>
            </div>

            {/* Description / Remarks (shown in full detail here!) */}
            <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                Description / Remarks
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {viewingExpense.description ? viewingExpense.description : 'No remarks or notes provided.'}
              </p>
            </div>

            {/* Receipt Preview if available */}
            {viewingExpense.receiptUrl && (
              <div className="mt-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Receipt Attached</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(viewingExpense.receiptUrl || null)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  View Full Receipt
                </button>
              </div>
            )}

            {/* Detailed Edit History Section if edited */}
            {viewingExpense.isEdited || (viewingExpense.editHistory && viewingExpense.editHistory.length > 0) ? (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold flex items-center justify-center">
                    E
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Edit History ({viewingExpense.editHistory?.length || 0})
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Audit trail of all edits submitted after initial entry.
                </p>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {viewingExpense.editHistory && viewingExpense.editHistory.length > 0 ? (
                    viewingExpense.editHistory.map((item, idx) => (
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
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Original entry • No modifications made</span>
                <span>Submitted {formatDate(viewingExpense.createdAt)}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingExpense.id;
                      setViewingExpense(null);
                      setDeletingId(id);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    title="Delete expense (Admin only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                {(isAdmin || viewingExpense.createdBy === userProfile?.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      const toEdit = viewingExpense;
                      setViewingExpense(null);
                      setEditingExpense(toEdit);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Expense</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Expense Modal */}
      {editingExpense && (
        <ExpenseModal
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          expenseToEdit={editingExpense}
        />
      )}

      {/* 7. Receipt Image Zoom Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative max-w-lg max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl">
            <button
              onClick={() => setPreviewReceipt(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-700 p-1.5 rounded-full shadow-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewReceipt}
              alt="Receipt Attachment"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* 8. Confirm Delete Modal (Admin only) */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action will permanently remove it from the family ledger."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={async () => {
          if (deletingId) {
            await deleteExpense(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
