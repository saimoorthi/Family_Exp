import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wallet,
  Edit2,
  Trash2,
  Calendar,
  User,
  TrendingUp,
  PieChart as PieIcon,
  ArrowUpRight,
} from 'lucide-react';
import { Deposit } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DepositModal } from './DepositModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DepositsViewProps {
  onOpenAddModal: () => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({ onOpenAddModal }) => {
  const { deposits, members, deleteDeposit, formatCurrency, formatDate } = useData();
  const { userProfile, isAdmin } = useAuth();

  const [selectedMember, setSelectedMember] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  // Edit / Delete states
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Total All-Time Deposits
  const totalDeposits = useMemo(() => {
    return deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [deposits]);

  // Member-wise contributions calculation
  const memberContributions = useMemo(() => {
    const map: Record<string, { id: string; name: string; total: number; count: number }> = {};

    // Initialize with existing members
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

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return deposits
      .filter((d) => {
        if (selectedMember !== 'ALL' && d.depositedBy !== selectedMember) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [deposits, selectedMember, sortBy]);

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      await deleteDeposit(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-6xl mx-auto px-4 md:px-6 pt-2">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Deposits Card */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100">Total Family Fund</span>
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Wallet className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {formatCurrency(totalDeposits)}
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              Accumulated contributions from all members
            </p>
          </div>
        </div>

        {/* Member Contributions Summary */}
        <div className="md:col-span-2 bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Member-Wise Contributions</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {memberContributions.length} members
            </span>
          </div>

          <div className="space-y-2.5 my-2 max-h-36 overflow-y-auto pr-1">
            {memberContributions.map((m) => (
              <div key={m.id} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-700">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{formatCurrency(m.total)}</span>
                    <span className="text-slate-400 font-medium w-8 text-right">
                      {m.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{deposits.length} total deposit records</span>
            <span className="text-emerald-600 font-semibold">Active Fund</span>
          </div>
        </div>
      </div>

      {/* 2. Action and Filter Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-5 shadow-xs border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-bold text-slate-800">
            Deposits ({filteredDeposits.length})
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Contributors</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount (High to Low)</option>
            <option value="amount_asc">Amount (Low to High)</option>
          </select>

          <button
            onClick={onOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deposit</span>
          </button>
        </div>
      </div>

      {/* 3. Deposit List */}
      {filteredDeposits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDeposits.map((dep) => {
            const canManage = isAdmin || dep.createdBy === userProfile?.id;

            return (
              <div
                key={dep.id}
                className="bg-white rounded-3xl p-4 shadow-2xs border border-slate-100 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Deposit
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      {dep.paymentMethod && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-medium">
                          {dep.paymentMethod}
                        </span>
                      )}
                      <span>{formatDate(dep.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 mt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {dep.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Deposited by{' '}
                          <span className="font-semibold text-slate-700">{dep.depositedByName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-emerald-600">
                        + {formatCurrency(dep.amount)}
                      </span>
                    </div>
                  </div>

                  {dep.description && (
                    <p className="mt-2.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl italic">
                      "{dep.description}"
                    </p>
                  )}
                </div>

                {canManage && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-1 text-xs">
                    <button
                      onClick={() => setEditingDeposit(dep)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Edit deposit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(dep.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                      title="Delete deposit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No deposits recorded</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedMember !== 'ALL'
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

      {/* Edit Deposit Modal */}
      {editingDeposit && (
        <DepositModal
          isOpen={true}
          onClose={() => setEditingDeposit(null)}
          depositToEdit={editingDeposit}
        />
      )}

      {/* Confirm Deletion Dialog */}
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
