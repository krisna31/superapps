import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Flame, 
  Plus, 
  Trash2, 
  X,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { HabitItem } from '@/types';
import { generateSecureId } from '@/utils/security';

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
      id: generateSecureId('habit'),
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
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Routines & Consistency</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            Daily Habits
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Apple Health inspired streak tracking with 7-day checklists and 30-day consistency heatmap.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ios-btn ios-btn-primary rounded-[10px] self-start sm:self-auto text-xs font-semibold min-h-[40px] px-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Daily Progress Card: Apple Ring Style */}
      <div className="ios-inset-grouped p-4 sm:p-5 bg-surface shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-rose-500 font-semibold">
            <Flame className="w-4 h-4" />
            <span>Today's Execution Rate</span>
          </div>
          <div className="text-lg sm:text-xl font-display font-bold text-ink tabular-nums">
            {completedTodayCount} of {habits.length} Habits Completed ({completionPercentage}%)
          </div>
          <p className="text-xs text-ink-secondary">
            Maintain daily operational discipline to sustain long-term streaks.
          </p>
        </div>

        <div className="w-full sm:w-60 bg-subtle rounded-full h-3 overflow-hidden">
          <div
            className="bg-accent-primary h-full rounded-full transition-all duration-interactive"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Habit List Table: iOS Inset Grouped */}
      <div className="ios-inset-grouped bg-surface shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-4 py-2.5 border-b border-border-subtle bg-subtle/50 text-xs font-semibold text-ink-muted">
          <div className="col-span-5">Routine / Description</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-4 text-center">Last 7 Days</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-border-subtle">
          {habits.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No habits registered. Click "New Habit" to start a routine.
            </div>
          ) : (
            habits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className="p-3.5 sm:px-4 flex flex-col md:grid md:grid-cols-12 items-center gap-3 hover:bg-subtle/40 transition-colors duration-fast"
                >
                  {/* Habit info */}
                  <div className="w-full md:col-span-5 flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleHabitDay(habit, todayStr)}
                      className={`w-6 h-6 rounded-[8px] border flex items-center justify-center transition-all ${
                        isDoneToday
                          ? 'bg-status-success text-white border-status-success shadow-sm'
                          : 'bg-surface border-border-default hover:border-accent-primary'
                      }`}
                      title="Check off today"
                    >
                      {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isDoneToday ? 'text-ink line-through opacity-75' : 'text-ink'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      {habit.description && (
                        <p className="text-[11px] text-ink-secondary truncate">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="w-full md:col-span-2 flex items-center justify-between md:justify-center space-x-1">
                    <span className="md:hidden text-xs text-ink-muted">Streak:</span>
                    <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold tabular-nums border border-rose-500/20">
                      <Flame className="w-3.5 h-3.5 fill-rose-500" />
                      <span>{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  {/* 7 Days matrix */}
                  <div className="w-full md:col-span-4 flex items-center justify-center space-x-1.5">
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
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                            completed
                              ? 'bg-accent-primary text-white shadow-sm'
                              : 'bg-subtle text-ink-muted hover:bg-border-subtle hover:text-ink'
                          } ${isToday ? 'ring-2 ring-accent-primary ring-offset-2 dark:ring-offset-black' : ''}`}
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
                      className="p-1.5 rounded-lg text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors"
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
      <div className="ios-inset-grouped p-4 sm:p-5 bg-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-border-subtle gap-2">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-ink">
              30-Day Routine Execution Heatmap
            </h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              Daily habit completion density across the active 30-day rolling window.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] text-ink-muted font-medium">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded bg-subtle border border-border-subtle" />
            <span className="w-3.5 h-3.5 rounded bg-accent-primary/30 border border-accent-primary/40" />
            <span className="w-3.5 h-3.5 rounded bg-accent-primary/70 border border-accent-primary/80" />
            <span className="w-3.5 h-3.5 rounded bg-accent-primary text-white" />
            <span>More</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {days30List.map((d) => {
            const count = completionCountsByDate[d] || 0;
            const ratio = habits.length > 0 ? count / habits.length : 0;
            const isToday = d === todayStr;

            let colorClass = 'bg-subtle text-ink-muted border-border-subtle';
            if (ratio === 1 && habits.length > 0) {
              colorClass = 'bg-accent-primary text-white font-semibold shadow-sm';
            } else if (ratio >= 0.5) {
              colorClass = 'bg-accent-primary/70 text-white font-medium';
            } else if (ratio > 0) {
              colorClass = 'bg-accent-primary/25 text-ink';
            }

            return (
              <div
                key={d}
                title={`${d}: ${count}/${habits.length} habits completed (${Math.round(ratio * 100)}%)`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] border flex flex-col items-center justify-center text-[10px] font-mono tabular-nums transition-colors cursor-default ${colorClass} ${
                  isToday ? 'ring-2 ring-accent-primary ring-offset-2 dark:ring-offset-black' : ''
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-habit-modal-title"
            className="w-full max-w-sm bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border-subtle">
              <div>
                <span className="text-[11px] text-accent-primary font-semibold uppercase tracking-wider">New Routine</span>
                <h3 id="create-habit-modal-title" className="font-display font-bold text-base text-ink">
                  Add New Habit
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

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label htmlFor="habit-title-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Habit Title *
                </label>
                <input
                  id="habit-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages or 30 min workout"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="habit-desc-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Description / Motivation
                </label>
                <input
                  id="habit-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this habit is important to you..."
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
