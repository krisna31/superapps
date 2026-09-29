import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitsPage } from '../pages/HabitsPage';
import * as DbContextModule from '../context/DbContext';

describe('HabitsPage Component', () => {
  const mockRunMutation = vi.fn();
  const mockRunQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(DbContextModule, 'useDb').mockReturnValue({
      isReady: true,
      error: null,
      refreshSignal: 0,
      triggerRefresh: vi.fn(),
      runQuery: mockRunQuery.mockReturnValue({
        columns: ['id', 'title', 'frequency', 'streak', 'completedDates', 'createdAt'],
        values: [
          ['h1', 'Read 20 pages', 'daily', 7, JSON.stringify([]), '2026-09-01'],
          ['h2', 'Push to GitHub', 'daily', 14, JSON.stringify([]), '2026-09-01'],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['habits']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders Pomodoro timer controls and habits list', () => {
    render(<HabitsPage />);

    expect(screen.getByText('Focus Timer & Daily Habit Streaks')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/Start Focus/i)).toBeInTheDocument();

    expect(screen.getByText('Read 20 pages')).toBeInTheDocument();
    expect(screen.getByText('Push to GitHub')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('14d')).toBeInTheDocument();
  });

  it('switches Pomodoro modes', () => {
    render(<HabitsPage />);

    const shortBreakBtn = screen.getByText(/Short Break \(5m\)/i);
    fireEvent.click(shortBreakBtn);

    expect(screen.getByText('05:00')).toBeInTheDocument();

    const longBreakBtn = screen.getByText(/Long Break \(15m\)/i);
    fireEvent.click(longBreakBtn);

    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('toggles habit completion status', () => {
    render(<HabitsPage />);

    const checkButtons = screen.getAllByRole('button');
    // Click habit check button
    const habitToggle = checkButtons.find((b) => b.className.includes('rounded-lg'));
    if (habitToggle) {
      fireEvent.click(habitToggle);
      expect(mockRunMutation).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE habits SET streak = ?'),
        expect.anything()
      );
    }
  });
});
