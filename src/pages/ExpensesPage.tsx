import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Expense } from '../types';
import {
  Wallet,
  Plus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Download,
  Trash2,
  Calendar,
  Tag,
  PieChart,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Load from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, title, amount, type, category, date, notes, createdAt FROM expenses ORDER BY date DESC, createdAt DESC;');
    if (res.values) {
      setExpenses(
        res.values.map((v) => ({
          id: v[0],
          title: v[1],
          amount: v[2],
          type: v[3],
          category: v[4],
          date: v[5],
          notes: v[6],
          createdAt: v[7],
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const id = 'exp_' + Math.random().toString(36).substring(2, 9);
    runMutation(
      'INSERT INTO expenses (id, title, amount, type, category, date, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [id, title.trim() || 'Untitled', numAmount, type, category, date, notes.trim(), new Date().toISOString()]
    );

    setShowAddModal(false);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this transaction?')) {
      runMutation('DELETE FROM expenses WHERE id = ?;', [id]);
    }
  };

  const handleExportCsv = () => {
    let csv = 'ID,Title,Amount,Type,Category,Date,Notes\n';
    expenses.forEach((e) => {
      csv += `"${e.id}","${e.title}",${e.amount},"${e.type}","${e.category}","${e.date}","${e.notes || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superapps_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculations
  const totalIncome = expenses.filter((e) => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.filter((e) => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Category summary for expenses
  const categoryMap: { [key: string]: number } = {};
  expenses
    .filter((e) => e.type === 'expense')
    .forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

  const categories = [
    'Food & Dining',
    'Tech & Cloud',
    'Housing & Bills',
    'Transport',
    'Entertainment',
    'Salary',
    'Freelance',
    'Other',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>Expense & Budget Flow</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal financial ledger running in SQLite WASM. Keep your accounts completely private.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Balance</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-2xl font-extrabold mt-2 ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${netBalance.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total Assets in Record</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            +${totalIncome.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Earnings logged</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">
            -${totalExpense.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Outflows logged</div>
        </div>
      </div>

      {/* Two Columns: Category Breakdown & Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (1 Col) */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Spending by Category</h2>
          </div>

          {Object.keys(categoryMap).length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No expense categories recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryMap).map(([cat, amt]) => {
                const percentage = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{cat}</span>
                      <span className="font-mono text-slate-400">
                        ${amt.toFixed(2)} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transactions Table (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
            <span className="text-xs text-slate-500">{expenses.length} records</span>
          </div>

          {expenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No transactions logged. Click "New Transaction" to add your first expense or income.
            </div>
          ) : (
            <div className="space-y-2.5 overflow-x-auto">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {item.type === 'income' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.category}
                        </span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-mono font-bold ${
                        item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Transaction</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="flex bg-slate-900 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    type === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    type === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Groceries, Cloud Hosting, Salary..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
