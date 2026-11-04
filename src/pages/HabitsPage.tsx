import React, { useState, useEffect, useMemo } from 'react';
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

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const computeCurrentStreak = (completedDates: string[], todayStr: string): number => {
  if (!completedDates || completedDates.length === 0) return 0;
  const dateSet = new Set(completedDates);
  const cursor = new Date(todayStr + 'T00:00:00');

  // If today is not yet checked off, start checking from yesterday so an active streak is preserved
  if (!dateSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dateSet.has(formatLocalDate(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (dateSet.has(formatLocalDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const HabitsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';
  const [searchParams] = useSearchParams();
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const todayStr = formatLocalDate(new Date());

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
    const nextDates = alreadyDone
      ? habit.completedDates.filter((d) => d !== dateStr)
      : [...habit.completedDates, dateStr];

    const nextStreak = computeCurrentStreak(nextDates, todayStr);

    const updated: HabitItem = {
      ...habit,
      completedDates: nextDates,
      streak: nextStreak,
    };
    await dataService.saveHabit(userId, updated);
  };

  const handleDeleteHabit = async (id: string) => {
    if (confirm('Delete this habit routine permanently?')) {
      await dataService.deleteHabit(userId, id);
    }
  };

  const daysList = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(formatLocalDate(d));
    }
    return days;
  }, [todayStr]);

  const days30List = useMemo(() => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(formatLocalDate(d));
    }
    return days;
  }, [todayStr]);

  const completionCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of habits) {
      for (const d of h.completedDates) {
        counts[d] = (counts[d] || 0) + 1;
      }
    }
    return counts;
  }, [habits]);

  const completedTodayCount = completionCountsByDate[todayStr] || 0;
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
            Track daily habits, streaks, and 7-day consistency
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
            Complete your daily routines to maintain your active streaks.
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
                      const dayName = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-label={`Toggle ${habit.title} for ${d}`}
                          aria-pressed={completed}
                          onClick={() => handleToggleHabitDay(habit, d)}
                          className={`w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] font-mono transition ${
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
                      type="button"
                      aria-label={`Delete ${habit.title}`}
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 sm:p-1 text-slate-400 hover:text-rose-500 rounded transition"
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

      {/* 30-Day Routine Consistency Matrix */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              30-Day Routine Execution Heatmap
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daily habit completion rate over the past 30 days
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 border border-emerald-500/80" />
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-600" />
            <span>More</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {days30List.map((d) => {
            const count = completionCountsByDate[d] || 0;
            const ratio = habits.length > 0 ? count / habits.length : 0;
            const isToday = d === todayStr;

            let colorClass = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400';
            if (ratio === 1 && habits.length > 0) {
              colorClass = 'bg-emerald-500 border-emerald-600 text-white font-bold';
            } else if (ratio >= 0.5) {
              colorClass = 'bg-emerald-500/70 border-emerald-500/80 text-white';
            } else if (ratio > 0) {
              colorClass = 'bg-emerald-500/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-300';
            }

            return (
              <div
                key={d}
                title={`${d}: ${count}/${habits.length} habits completed (${Math.round(ratio * 100)}%)`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border flex flex-col items-center justify-center text-[10px] font-mono tabular-nums transition-colors cursor-default ${colorClass} ${
                  isToday ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900' : ''
                }`}
              >
                <span>{d.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-habit-modal-title"
            className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3.5">
              <h3 id="create-habit-modal-title" className="font-semibold text-sm text-slate-900 dark:text-white">Add New Habit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label htmlFor="habit-title-input" className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Habit Title *
                </label>
                <input
                  id="habit-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages or 30 min workout"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label htmlFor="habit-desc-input" className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Description / Motivation
                </label>
                <input
                  id="habit-desc-input"
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
