import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpensesPage } from '../pages/ExpensesPage';
import * as DbContextModule from '../context/DbContext';

describe('ExpensesPage Component', () => {
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
        columns: ['id', 'title', 'amount', 'type', 'category', 'date', 'notes', 'createdAt'],
        values: [
          ['e1', 'Salary', 3000, 'income', 'Salary', '2026-09-01', '', '2026-09-01'],
          ['e2', 'Groceries', 150, 'expense', 'Food & Dining', '2026-09-02', 'Fresh veggies', '2026-09-02'],
          ['e3', 'Cloud Server', 50, 'expense', 'Tech & Cloud', '2026-09-03', 'VPS', '2026-09-03'],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['expenses']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders balance cards and transaction list', () => {
    render(<ExpensesPage />);

    expect(screen.getByText('Expense & Budget Flow')).toBeInTheDocument();
    // Net Balance: 3000 - 200 = 2800
    expect(screen.getByText('$2800.00')).toBeInTheDocument();
    expect(screen.getAllByText('+$3000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('-$200.00').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Cloud Server')).toBeInTheDocument();
  });

  it('opens modal and submits new expense transaction', () => {
    render(<ExpensesPage />);

    const newBtn = screen.getByRole('button', { name: /New Transaction/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Add Transaction')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e.g. Groceries/i), {
      target: { value: 'Coffee & Snacks' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '15.50' },
    });

    const submitBtn = screen.getByRole('button', { name: /Add Entry/i });
    fireEvent.click(submitBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO expenses'),
      expect.arrayContaining(['Coffee & Snacks', 15.5, 'expense'])
    );
  });
});
