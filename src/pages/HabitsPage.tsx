import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Flame, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  X 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { HabitItem } from '@/types';

export const HabitsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'vault-owner';
  const [searchParams] = useSearchParams();
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = dataService.subscribeToHabits(userId, (data) => {
      setHabits(data);
    });
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
    return () => {
      unsubscribe();
    };
  }, [userId, searchParams]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHabit: HabitItem = {
      id: 'habit-' + Date.now(),
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      frequency: 'daily',
      streak: 0,
      completedDates: [],
      createdAt: Date.now(),
    };

    await dataService.saveHabit(userId, newHabit);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleToggleHabitDay = async (habit: HabitItem, dateStr: string) => {
    const alreadyDone = habit.completedDates.includes(dateStr);
    let nextDates = [...habit.completedDates];
    let nextStreak = habit.streak;

    if (alreadyDone) {
      nextDates = nextDates.filter((d) => d !== dateStr);
      if (dateStr === todayStr && nextStreak > 0) {
        nextStreak -= 1;
      }
    } else {
      nextDates.push(dateStr);
      if (dateStr === todayStr) {
        nextStreak += 1;
      }
    }

    const updated: HabitItem = {
      ...habit,
      completedDates: nextDates,
      streak: nextStreak,
    };
    await dataService.saveHabit(userId, updated);
  };

  const handleDeleteHabit = async (id: string) => {
    await dataService.deleteHabit(userId, id);
  };

  // Generate last 7 days strings [YYYY-MM-DD]
  const getLast7Days = () => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const daysList = getLast7Days();
  const completedTodayCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const completionPercentage = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Habits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Routine tracker, streak preservation, and seven-day completion matrix
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Daily Progress Card */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase tracking-wider text-rose-500">
            <Flame className="w-3.5 h-3.5" />
            <span>Today's Execution Rate</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {completedTodayCount} of {habits.length} Habits Completed ({completionPercentage}%)
          </div>
          <p className="text-xs text-slate-500">
            Daily cadence tracking against active routine benchmarks.
          </p>
        </div>

        <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Habit List Table */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <div className="col-span-5">Routine / Description</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-4 text-center">Last 7 Days</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {habits.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No habits registered yet. Click "New Habit" to start building your routine.
            </div>
          ) : (
            habits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className="py-2.5 px-3 flex flex-col md:grid md:grid-cols-12 items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  {/* Habit info */}
                  <div className="w-full md:col-span-5 flex items-center space-x-2.5">
                    <button
                      onClick={() => handleToggleHabitDay(habit, todayStr)}
                      className={`p-1 rounded transition ${
                        isDoneToday
                          ? 'text-emerald-500'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      title="Check off today"
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-medium truncate ${
                          isDoneToday
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      {habit.description && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="w-full md:col-span-2 flex items-center justify-between md:justify-center space-x-1">
                    <span className="md:hidden text-xs text-slate-400 font-mono">Streak:</span>
                    <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-mono tabular-nums">
                      <Flame className="w-3 h-3" />
                      <span>{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  {/* 7 Days matrix */}
                  <div className="w-full md:col-span-4 flex items-center justify-center space-x-1">
                    {daysList.map((d) => {
                      const completed = habit.completedDates.includes(d);
                      const isToday = d === todayStr;
                      const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'narrow' });
                      return (
                        <button
                          key={d}
                          onClick={() => handleToggleHabitDay(habit, d)}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition ${
                            completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          } ${isToday ? 'ring-1 ring-emerald-500' : ''}`}
                          title={`${d}: ${completed ? 'Completed' : 'Missed'}`}
                        >
                          <span>{dayName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action */}
                  <div className="w-full md:col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Add New Habit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages or 30 min workout"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Description / Motivation
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this habit is important to you..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
