import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  X,
  Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { ExpenseItem } from '@/types';
import { generateSecureId } from '@/utils/security';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';
  const [searchParams] = useSearchParams();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const categories = [
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Health',
    'Tech/SaaS',
    'Salary',
    'Investments',
    'Other'
  ];

  useEffect(() => {
    const unsubscribe = dataService.subscribeToExpenses(userId, (data) => {
      setExpenses(data);
    });
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
    return () => {
      unsubscribe();
    };
  }, [userId, searchParams]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const newExpense: ExpenseItem = {
      id: generateSecureId('exp'),
      userId,
      type,
      amount: Number(amount),
      category,
      description: description.trim() || category,
      date,
      createdAt: Date.now(),
    };

    await dataService.saveExpense(userId, newExpense);
    setAmount('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Delete this transaction record?')) {
      await dataService.deleteExpense(userId, id);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterType === 'all') return true;
      return e.type === filterType;
    });
  }, [expenses, filterType]);

  const { totalIncome, totalExpense, sortedCategories } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catTotals: Record<string, number> = {};

    for (const e of expenses) {
      if (e.type === 'income') {
        income += e.amount;
      } else {
        expense += e.amount;
        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
      }
    }

    const sorted = Object.entries(catTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      totalIncome: income,
      totalExpense: expense,
      sortedCategories: sorted,
    };
  }, [expenses]);

  const netBalance = totalIncome - totalExpense;

  const exportCsv = () => {
    const sanitizeCsvValue = (val: string): string => {
      let escaped = (val || '').replace(/"/g, '""');
      if (/^[=\+\-@\t\r]/.test(escaped)) {
        escaped = "'" + escaped;
      }
      return `"${escaped}"`;
    };

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = expenses.map((e) => [
      e.date,
      e.type,
      sanitizeCsvValue(e.category),
      sanitizeCsvValue(e.description || ''),
      e.amount,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Financial Ledger</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            Expenses & Budget
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Apple Card inspired cashflow ledger with category analytics, CSV export, and balance tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={exportCsv}
            disabled={expenses.length === 0}
            className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold min-h-[40px] px-3.5 disabled:opacity-40"
            title="Download CSV ledger"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold min-h-[40px] px-4"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards - iOS Inset Grouped */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="ios-inset-grouped p-4 sm:p-5 shadow-sm bg-surface">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-secondary font-medium">Total Income</span>
            <div className="w-7 h-7 rounded-full bg-status-success/10 text-status-success flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-status-success tabular-nums tracking-tight">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">All registered earnings</div>
        </div>

        <div className="ios-inset-grouped p-4 sm:p-5 shadow-sm bg-surface">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-secondary font-medium">Total Expenses</span>
            <div className="w-7 h-7 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-display font-bold text-status-danger tabular-nums tracking-tight">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">All registered expenditures</div>
        </div>

        <div className="ios-inset-grouped p-4 sm:p-5 shadow-sm bg-surface">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-secondary font-medium">Net Balance</span>
            <div className="w-7 h-7 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl sm:text-3xl font-display font-bold tabular-nums tracking-tight ${netBalance >= 0 ? 'text-ink' : 'text-status-danger'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">Net remaining surplus</div>
        </div>
      </div>

      {/* Categorical Spend Distribution */}
      {sortedCategories.length > 0 && totalExpense > 0 && (
        <div className="ios-inset-grouped p-4 sm:p-5 bg-surface shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
            <span className="font-semibold text-xs text-ink uppercase tracking-wider">
              Top Expenditure Categories
            </span>
            <span className="text-[11px] text-ink-muted tabular-nums font-mono">
              Total: Rp {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedCategories.map(([cat, amount]) => {
              const pct = Math.round((amount / totalExpense) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-ink">{cat}</span>
                    <span className="text-ink-secondary tabular-nums">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-accent-primary h-full rounded-full transition-all duration-fast"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Segmented Control */}
      <div className="flex items-center justify-between">
        <div className="ios-segmented">
          <button
            onClick={() => setFilterType('all')}
            className={`ios-segmented-item ${filterType === 'all' ? 'ios-segmented-item-active' : ''}`}
          >
            All ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`ios-segmented-item ${filterType === 'expense' ? 'ios-segmented-item-active text-status-danger' : ''}`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`ios-segmented-item ${filterType === 'income' ? 'ios-segmented-item-active text-status-success' : ''}`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Transaction List: Apple Inset Grouped Table */}
      <div className="ios-inset-grouped bg-surface shadow-sm overflow-hidden">
        <div className="divide-y divide-border-subtle">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No transactions recorded in this category.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3 px-4 flex items-center justify-between hover:bg-subtle/50 transition-colors duration-fast min-h-[52px]"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                      exp.type === 'income'
                        ? 'bg-status-success/10 text-status-success'
                        : 'bg-status-danger/10 text-status-danger'
                    }`}
                  >
                    {exp.type === 'income' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-ink truncate">
                      {exp.description}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-ink-muted mt-0.5">
                      <span className="px-2 py-0.2 rounded-full bg-subtle text-ink-secondary text-[10px] font-medium">
                        {exp.category}
                      </span>
                      <span>•</span>
                      <span className="tabular-nums font-mono">{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 flex-shrink-0">
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      exp.type === 'income'
                        ? 'text-status-success'
                        : 'text-status-danger'
                    }`}
                  >
                    {exp.type === 'income' ? '+' : '-'} Rp {exp.amount.toLocaleString('id-ID')}
                  </span>

                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Transaction Modal: Apple Modal Sheet */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-transaction-modal-title"
            className="w-full max-w-sm bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border-subtle">
              <div>
                <span className="text-[11px] text-accent-primary font-semibold uppercase tracking-wider">Ledger Entry</span>
                <h3 id="record-transaction-modal-title" className="font-display font-bold text-base text-ink">
                  Record Transaction
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="ios-segmented w-full grid grid-cols-2 p-1">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`ios-segmented-item text-center ${
                    type === 'expense' ? 'ios-segmented-item-active text-status-danger font-semibold' : ''
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`ios-segmented-item text-center ${
                    type === 'income' ? 'ios-segmented-item-active text-status-success font-semibold' : ''
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label htmlFor="exp-amount-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Amount (IDR) *
                </label>
                <input
                  id="exp-amount-input"
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary tabular-nums min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="exp-category-select" className="block text-xs font-medium text-ink-secondary mb-1">
                    Category
                  </label>
                  <select
                    id="exp-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[44px]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exp-date-input" className="block text-xs font-medium text-ink-secondary mb-1">
                    Date
                  </label>
                  <input
                    id="exp-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exp-desc-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Description / Vendor
                </label>
                <input
                  id="exp-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Server hosting, Lunch meeting"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold py-2 px-4 shadow-sm"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
