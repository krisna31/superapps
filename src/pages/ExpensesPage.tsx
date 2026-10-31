import React, { useState, useEffect } from 'react';
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
      id: 'exp-' + Date.now(),
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

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const totalIncome = expenses
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = expenses
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const categoryTotals = expenses
    .filter((e) => e.type === 'expense')
    .reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = expenses.map((e) => [
      e.date,
      e.type,
      `"${e.category.replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expenses & Budget
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal balance sheet, revenue inflows, and expenditure tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={exportCsv}
            disabled={expenses.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition disabled:opacity-50"
            title="Download CSV ledger"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Income</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">All registered earnings</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[10px] uppercase tracking-wider">Total Expenses</span>
            <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">All registered expenditures</div>
        </div>

        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[10px] uppercase tracking-wider">Net Balance</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`mt-1.5 text-xl font-bold font-mono tabular-nums ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Net remaining surplus</div>
        </div>
      </div>

      {/* Categorical Spend Distribution */}
      {sortedCategories.length > 0 && totalExpense > 0 && (
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Top Expenditure Categories
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Distribution of Rp {totalExpense.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {sortedCategories.map(([cat, amount]) => {
              const pct = Math.round((amount / totalExpense) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="text-slate-500 tabular-nums">
                      Rp {amount.toLocaleString('id-ID')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-600 dark:bg-slate-400 h-full transition-all duration-300"
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
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All ({expenses.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
              filterType === 'expense'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No transactions recorded in this category.
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-2 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      exp.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {exp.type === 'income' ? (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {exp.description}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                      <span className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[9px] uppercase">
                        {exp.category}
                      </span>
                      <span>•</span>
                      <span className="tabular-nums">{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 flex-shrink-0">
                  <span
                    className={`text-xs font-semibold font-mono tabular-nums ${
                      exp.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {exp.type === 'income' ? '+' : '-'} Rp {exp.amount.toLocaleString('id-ID')}
                  </span>

                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Record Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 rounded-md transition ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 rounded-md transition ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Amount (IDR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Starbucks or Grocery shopping"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono tabular-nums"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
