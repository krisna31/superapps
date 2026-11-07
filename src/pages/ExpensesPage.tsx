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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-04] FINANCIAL CASHFLOW & BUDGET</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            Expenses & Budget
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Architectural cashflow ledger with category analytics, CSV data portability, and net balance monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={exportCsv}
            disabled={expenses.length === 0}
            className="werkbund-btn werkbund-btn-outline disabled:opacity-40"
            title="Download CSV ledger"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="werkbund-btn werkbund-btn-signal"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards: Shared-Border Grid */}
      <div className="werkbund-grid grid-cols-1 md:grid-cols-3">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[LEDGER-01] TOTAL INCOME</span>
            <ArrowDownLeft className="w-4 h-4 text-status-success" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-status-success tabular-nums tracking-tight">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="werkbund-coord text-[10px] mt-1">ALL REGISTERED EARNINGS</div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[LEDGER-02] TOTAL EXPENSES</span>
            <ArrowUpRight className="w-4 h-4 text-status-danger" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-status-danger tabular-nums tracking-tight">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="werkbund-coord text-[10px] mt-1">ALL REGISTERED EXPENDITURES</div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="werkbund-coord">[LEDGER-03] NET BALANCE</span>
            <Wallet className="w-4 h-4 text-signal" />
          </div>
          <div className={`mt-2 text-2xl font-display font-bold tabular-nums tracking-tight ${netBalance >= 0 ? 'text-ink' : 'text-status-danger'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="werkbund-coord text-[10px] mt-1">NET REMAINING SURPLUS</div>
        </div>
      </div>

      {/* Categorical Spend Distribution */}
      {sortedCategories.length > 0 && totalExpense > 0 && (
        <div className="bg-surface border-1.5 border-border-strong p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-1.5 border-border-strong">
            <div>
              <div className="werkbund-coord mb-0.5">[ANALYTICS-01]</div>
              <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                Top Expenditure Categories
              </span>
            </div>
            <span className="werkbund-coord text-[10px] tabular-nums">
              TOTAL EXPENSE: RP {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedCategories.map(([cat, amount]) => {
              const pct = Math.round((amount / totalExpense) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-ink font-bold uppercase">{cat}</span>
                    <span className="text-ink-secondary tabular-nums">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-subtle border-1.5 border-border-strong h-3 p-0.5">
                    <div
                      className="bg-signal-secondary h-full transition-all duration-fast"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="flex items-center justify-between bg-surface p-2 border-1.5 border-border-strong">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border-1.5 transition-colors duration-fast ${
              filterType === 'all'
                ? 'bg-ink text-canvas border-border-strong font-bold'
                : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
            }`}
          >
            All ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border-1.5 transition-colors duration-fast ${
              filterType === 'expense'
                ? 'bg-status-danger text-white border-status-danger font-bold'
                : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border-1.5 transition-colors duration-fast ${
              filterType === 'income'
                ? 'bg-status-success text-white border-status-success font-bold'
                : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Transaction List: Architectural Table */}
      <div className="bg-surface border-1.5 border-border-strong overflow-hidden">
        <div className="divide-y-1.5 divide-border-strong">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted">
              [NULL] NO TRANSACTIONS RECORDED IN THIS CATEGORY.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-2.5 px-4 flex items-center justify-between hover:bg-subtle transition-colors duration-fast"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 border-1.5 border-border-strong flex items-center justify-center flex-shrink-0 ${
                      exp.type === 'income'
                        ? 'bg-status-success text-white font-bold'
                        : 'bg-status-danger text-white font-bold'
                    }`}
                  >
                    {exp.type === 'income' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-ink uppercase truncate">
                      {exp.description}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-ink-muted mt-0.5">
                      <span className="px-1.5 py-0.2 border border-border-strong bg-subtle text-ink font-bold uppercase">
                        {exp.category}
                      </span>
                      <span>•</span>
                      <span className="tabular-nums">{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span
                    className={`text-xs font-mono font-bold tabular-nums ${
                      exp.type === 'income'
                        ? 'text-status-success'
                        : 'text-status-danger'
                    }`}
                  >
                    {exp.type === 'income' ? '+' : '-'} Rp {exp.amount.toLocaleString('id-ID')}
                  </span>

                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1 border border-border-strong bg-canvas text-ink-muted hover:text-status-danger hover:border-status-danger transition-colors duration-fast"
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

      {/* New Transaction Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-transaction-modal-title"
            className="w-full max-w-sm bg-elevated border-1.5 border-border-strong p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-border-strong">
              <div>
                <span className="werkbund-coord text-[10px]">[TRANSACTION-NEW]</span>
                <h3 id="record-transaction-modal-title" className="font-display font-bold text-sm uppercase text-ink">
                  Record Transaction
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-ink-muted hover:text-ink border-1.5 border-transparent hover:border-border-strong"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 border-1.5 border-border-strong bg-subtle text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 border transition-colors duration-fast uppercase font-bold text-[11px] ${
                    type === 'expense'
                      ? 'bg-status-danger text-white border-status-danger'
                      : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 border transition-colors duration-fast uppercase font-bold text-[11px] ${
                    type === 'income'
                      ? 'bg-status-success text-white border-status-success'
                      : 'bg-canvas text-ink border-border-subtle hover:border-border-strong'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label htmlFor="exp-amount-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
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
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="exp-category-select" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Category
                  </label>
                  <select
                    id="exp-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink uppercase font-bold focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exp-date-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Date
                  </label>
                  <input
                    id="exp-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exp-desc-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Description / Vendor
                </label>
                <input
                  id="exp-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Server hosting, Lunch meeting"
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t-1.5 border-border-strong">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="werkbund-btn werkbund-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="werkbund-btn werkbund-btn-signal"
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
