import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Flame, 
  Plus, 
  Trash2, 
  X 
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
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-03] ROUTINES & CONSISTENCY MATRIX</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            Daily Habits
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Architectural streak tracking with 7-day checklists and 30-day execution heatmaps.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="werkbund-btn werkbund-btn-signal self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Daily Progress Card: Sharp Architectural Frame */}
      <div className="p-4 bg-surface border-1.5 border-border-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 werkbund-coord text-signal-secondary">
            <Flame className="w-3.5 h-3.5" />
            <span>[RATE-01] TODAY'S EXECUTION RATE</span>
          </div>
          <div className="text-lg sm:text-xl font-display font-bold text-ink tabular-nums uppercase">
            {completedTodayCount} of {habits.length} Habits Completed ({completionPercentage}%)
          </div>
          <p className="text-xs text-ink-secondary">
            Maintain daily operational discipline to sustain long-term streaks.
          </p>
        </div>

        <div className="w-full sm:w-56 bg-subtle border-1.5 border-border-strong h-4 p-0.5">
          <div
            className="bg-signal h-full transition-all duration-fast"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Habit List Table: Shared-Border Architecture */}
      <div className="bg-surface border-1.5 border-border-strong overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-4 py-2.5 border-b-1.5 border-border-strong bg-subtle text-[11px] font-mono text-ink uppercase tracking-wider font-bold">
          <div className="col-span-5">Routine / Description</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-4 text-center">Last 7 Days</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y-1.5 divide-border-strong">
          {habits.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted">
              [NULL] NO HABITS REGISTERED. CLICK "NEW HABIT" TO SCAFFOLD A ROUTINE.
            </div>
          ) : (
            habits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className="p-3 sm:px-4 flex flex-col md:grid md:grid-cols-12 items-center gap-3 hover:bg-subtle transition-colors duration-fast"
                >
                  {/* Habit info */}
                  <div className="w-full md:col-span-5 flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleHabitDay(habit, todayStr)}
                      className={`w-5 h-5 border-1.5 border-border-strong flex items-center justify-center transition-colors duration-fast ${
                        isDoneToday
                          ? 'bg-signal text-canvas font-bold'
                          : 'bg-canvas hover:bg-subtle'
                      }`}
                      title="Check off today"
                    >
                      {isDoneToday && <span className="text-xs">✓</span>}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold truncate uppercase ${
                          isDoneToday ? 'text-ink line-through opacity-80' : 'text-ink'
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
                    <span className="md:hidden werkbund-coord">Streak:</span>
                    <div className="flex items-center space-x-1 px-2 py-0.5 bg-subtle border-1.5 border-border-strong text-ink text-[11px] font-mono tabular-nums font-bold">
                      <Flame className="w-3 h-3 text-signal-secondary" />
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
                          className={`w-7 h-7 sm:w-6 sm:h-6 border-1.5 border-border-strong flex items-center justify-center text-[10px] font-mono font-bold transition-colors duration-fast ${
                            completed
                              ? 'bg-signal text-canvas'
                              : 'bg-canvas text-ink-muted hover:bg-subtle hover:text-ink'
                          } ${isToday ? 'outline outline-2 outline-offset-1 outline-signal' : ''}`}
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
                      className="p-1 border border-border-strong bg-canvas text-ink-muted hover:text-status-danger hover:border-status-danger transition-colors duration-fast"
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

      {/* 30-Day Routine Consistency Matrix: Sharp Architecture */}
      <div className="bg-surface border-1.5 border-border-strong p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b-1.5 border-border-strong gap-2">
          <div>
            <div className="werkbund-coord mb-0.5">[HEATMAP-01]</div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-ink">
              30-Day Routine Execution Heatmap
            </h3>
            <p className="text-[11px] text-ink-secondary mt-0.5">
              Daily habit completion density across the active 30-day rolling window.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-ink font-bold">
            <span className="werkbund-coord">Less</span>
            <span className="w-3.5 h-3.5 bg-canvas border border-border-strong" />
            <span className="w-3.5 h-3.5 bg-signal/30 border border-border-strong" />
            <span className="w-3.5 h-3.5 bg-signal/70 border border-border-strong" />
            <span className="w-3.5 h-3.5 bg-signal text-canvas border border-border-strong font-bold" />
            <span className="werkbund-coord">More</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {days30List.map((d) => {
            const count = completionCountsByDate[d] || 0;
            const ratio = habits.length > 0 ? count / habits.length : 0;
            const isToday = d === todayStr;

            let colorClass = 'bg-canvas text-ink-muted border-border-default';
            if (ratio === 1 && habits.length > 0) {
              colorClass = 'bg-signal text-canvas font-bold border-border-strong';
            } else if (ratio >= 0.5) {
              colorClass = 'bg-signal/70 text-canvas font-bold border-border-strong';
            } else if (ratio > 0) {
              colorClass = 'bg-signal/30 text-ink border-border-strong';
            }

            return (
              <div
                key={d}
                title={`${d}: ${count}/${habits.length} habits completed (${Math.round(ratio * 100)}%)`}
                className={`w-7 h-7 sm:w-8 sm:h-8 border-1.5 flex flex-col items-center justify-center text-[10px] font-mono tabular-nums transition-colors cursor-default ${colorClass} ${
                  isToday ? 'ring-2 ring-signal ring-offset-1' : ''
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-habit-modal-title"
            className="w-full max-w-sm bg-elevated border-1.5 border-border-strong p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-border-strong">
              <div>
                <span className="werkbund-coord text-[10px]">[HABIT-NEW]</span>
                <h3 id="create-habit-modal-title" className="font-display font-bold text-sm uppercase text-ink">
                  Add New Habit
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

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label htmlFor="habit-title-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Habit Title *
                </label>
                <input
                  id="habit-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages or 30 min workout"
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label htmlFor="habit-desc-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Description / Motivation
                </label>
                <input
                  id="habit-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this habit is important to you..."
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
