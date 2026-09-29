import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Habit } from '../types';
import {
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Flame,
  Trash2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HabitsPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();

  // Pomodoro State
  const [timerMode, setTimerMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Habits State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Load habits from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, title, frequency, streak, completedDates, createdAt FROM habits ORDER BY streak DESC, createdAt DESC;');
    if (res.values) {
      setHabits(
        res.values.map((v) => ({
          id: v[0],
          title: v[1],
          frequency: v[2] || 'daily',
          streak: v[3] || 0,
          completedDates: v[4] ? JSON.parse(v[4]) : [],
          createdAt: v[5],
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  // Web Audio API chime generator for Pomodoro completion
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio alert not supported', e);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playAlertSound();
      confetti({ particleCount: 40, spread: 45 });
      if (timerMode === 'work') {
        setSessionsCompleted((prev) => prev + 1);
        setTimerMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const switchMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === 'work') setTimeLeft(25 * 60);
    if (mode === 'shortBreak') setTimeLeft(5 * 60);
    if (mode === 'longBreak') setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const id = 'habit_' + Math.random().toString(36).substring(2, 9);
    runMutation(
      'INSERT INTO habits (id, title, frequency, streak, completedDates, createdAt) VALUES (?, ?, ?, ?, ?, ?);',
      [id, newHabitTitle.trim(), 'daily', 0, JSON.stringify([]), new Date().toISOString()]
    );

    setNewHabitTitle('');
    setShowAddModal(false);
  };

  const handleToggleHabit = (habit: Habit) => {
    const isCompletedToday = habit.completedDates.includes(todayStr);
    let newCompletedDates: string[];
    let newStreak = habit.streak;

    if (isCompletedToday) {
      newCompletedDates = habit.completedDates.filter((d) => d !== todayStr);
      newStreak = Math.max(0, newStreak - 1);
    } else {
      newCompletedDates = [...habit.completedDates, todayStr];
      newStreak = newStreak + 1;
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }

    runMutation(
      'UPDATE habits SET streak = ?, completedDates = ? WHERE id = ?;',
      [newStreak, JSON.stringify(newCompletedDates), habit.id]
    );
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Delete this habit?')) {
      runMutation('DELETE FROM habits WHERE id = ?;', [id]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-purple-400" />
          <span>Focus Timer & Daily Habit Streaks</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Stay focused with Pomodoro sessions and track daily habits locally inside SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: POMODORO TIMER */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between text-center">
          <div>
            <div className="flex justify-center gap-2 mb-6">
              <button
                onClick={() => switchMode('work')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timerMode === 'work' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Focus (25m)
              </button>
              <button
                onClick={() => switchMode('shortBreak')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timerMode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Short Break (5m)
              </button>
              <button
                onClick={() => switchMode('longBreak')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timerMode === 'longBreak' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Long Break (15m)
              </button>
            </div>

            {/* Big Countdown Display */}
            <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-widest my-6">
              {formatTime(timeLeft)}
            </div>

            <div className="text-xs text-slate-400 font-medium">
              {timerMode === 'work' ? 'Time to concentrate!' : 'Relax and recharge.'} •{' '}
              <span className="text-purple-400">{sessionsCompleted} sessions done today</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>
            <button
              onClick={() => switchMode(timerMode)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: DAILY HABIT STREAKS */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-white">Daily Habit Streaks</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Habit</span>
            </button>
          </div>

          {habits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No habits created. Build consistency by adding daily targets (e.g. Code 1 hour, Read 20 mins, Workout).
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.map((habit) => {
                const isCompleted = habit.completedDates.includes(todayStr);
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleHabit(habit)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'border border-slate-700 hover:border-purple-400 bg-slate-900'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className={`text-xs font-bold ${isCompleted ? 'text-purple-300 line-through' : 'text-white'}`}>
                          {habit.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isCompleted ? 'Completed for today!' : 'Pending today'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-bold">
                        <Flame className="w-3.5 h-3.5 fill-orange-400" />
                        <span>{habit.streak}d</span>
                      </span>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Daily Habit</h3>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  placeholder="e.g. Read 20 mins, Workout..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
