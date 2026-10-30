import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { HabitItem } from '@/types';

export const HabitsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'vault-owner';

  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsubscribe = dataService.subscribeToHabits(userId, (data) => {
      setHabits(data);
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Generate last 7 days strings [YYYY-MM-DD]
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const daysList = getLast7Days();
  const todayStr = daysList[daysList.length - 1];

  const handleToggleHabitDay = async (habit: HabitItem, dateStr: string) => {
    const isCompleted = habit.completedDates.includes(dateStr);
    let newDates = isCompleted
      ? habit.completedDates.filter((d) => d !== dateStr)
      : [...habit.completedDates, dateStr];

    // Calculate updated streak
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const s = checkDate.toISOString().split('T')[0];
      if (newDates.includes(s)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not checked yet, check if yesterday was checked
        if (s === todayStr && !newDates.includes(todayStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
          const y = checkDate.toISOString().split('T')[0];
          if (newDates.includes(y)) {
            // continue streak calculation from yesterday
            continue;
          }
        }
        break;
      }
    }

    const updated: HabitItem = {
      ...habit,
      completedDates: newDates,
      streak,
    };

    await dataService.saveHabit(userId, updated);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHabit: HabitItem = {
      id: 'habit-' + Date.now(),
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      frequency: 'daily',
      completedDates: [],
      streak: 0,
      createdAt: Date.now(),
    };

    await dataService.saveHabit(userId, newHabit);
    setHabits((prev) => [newHabit, ...prev]);
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleDeleteHabit = async (id: string) => {
    await dataService.deleteHabit(userId, id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const completedTodayCount = habits.filter((h) => h.completedDates.includes(todayStr)).length;
  const completionPercentage = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Habit Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Build consistency, track consecutive day streaks, and monitor progress
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Daily Progress Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-500">
            <Flame className="w-4 h-4" />
            <span>Today's Completion Goal</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {completedTodayCount} of {habits.length} Habits Completed ({completionPercentage}%)
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Keep your momentum going!
          </p>
        </div>

        <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Habit List Table / Cards */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="col-span-5">Habit</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-4 text-center">Last 7 Days</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {habits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No habits registered yet. Click "New Habit" to start building your routine!
            </div>
          ) : (
            habits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(todayStr);
              return (
                <div
                  key={habit.id}
                  className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                >
                  {/* Habit info */}
                  <div className="w-full md:col-span-5 flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleHabitDay(habit, todayStr)}
                      className={`p-1.5 rounded-lg transition ${
                        isDoneToday
                          ? 'text-emerald-500 bg-emerald-500/10'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      title="Check off today"
                    >
                      {isDoneToday ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs font-semibold ${
                          isDoneToday
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {habit.title}
                      </h4>
                      {habit.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Streak */}
                  <div className="w-full md:col-span-2 flex items-center justify-between md:justify-center space-x-1.5">
                    <span className="md:hidden text-xs text-slate-400">Streak:</span>
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{habit.streak} {habit.streak === 1 ? 'day' : 'days'}</span>
                    </div>
                  </div>

                  {/* 7 Days matrix */}
                  <div className="w-full md:col-span-4 flex items-center justify-center space-x-1.5">
                    {daysList.map((d) => {
                      const completed = habit.completedDates.includes(d);
                      const isToday = d === todayStr;
                      const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'narrow' });
                      return (
                        <button
                          key={d}
                          onClick={() => handleToggleHabitDay(habit, d)}
                          className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] font-medium transition ${
                            completed
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          } ${isToday ? 'ring-2 ring-emerald-500/50' : ''}`}
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
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add New Habit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 20 pages or 30 min workout"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Description / Motivation
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this habit is important to you..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
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
