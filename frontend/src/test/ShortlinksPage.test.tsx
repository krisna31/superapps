import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShortlinksPage } from '../pages/ShortlinksPage';
import * as DbContextModule from '../context/DbContext';

describe('ShortlinksPage Component', () => {
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
        columns: ['id', 'key', 'title', 'url', 'category', 'clicks', 'createdAt', 'updatedAt'],
        values: [
          ['1', 'gh', 'GitHub', 'https://github.com', 'Dev', 12, '2026-09-01', '2026-09-01'],
          ['2', 'cal', 'Google Calendar', 'https://calendar.google.com', 'Work', 5, '2026-09-02', '2026-09-02'],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['shortlinks']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders existing shortlinks from database', () => {
    render(<ShortlinksPage />);

    expect(screen.getByText('Shortlink & Quick Launcher')).toBeInTheDocument();
    expect(screen.getByText('go/gh')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('go/cal')).toBeInTheDocument();
  });

  it('opens and cancels the New Shortlink modal', () => {
    render(<ShortlinksPage />);

    const newBtn = screen.getByRole('button', { name: /New Shortlink/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Create Personal Shortlink')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. gh, mail, cal, pr/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Create Personal Shortlink')).not.toBeInTheDocument();
  });

  it('submits a new shortlink with mutation call', () => {
    render(<ShortlinksPage />);

    const newBtn = screen.getByRole('button', { name: /New Shortlink/i });
    fireEvent.click(newBtn);

    fireEvent.change(screen.getByPlaceholderText(/e.g. gh, mail, cal, pr/i), {
      target: { value: 'docs' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. GitHub Dashboard/i), {
      target: { value: 'Project Docs' },
    });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/\.\.\./i), {
      target: { value: 'https://docs.google.com' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save Shortlink/i });
    fireEvent.click(saveBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shortlinks'),
      expect.arrayContaining(['docs', 'Project Docs', 'https://docs.google.com'])
    );
  });

  it('generates stateless public redirect link with QR code', async () => {
    render(<ShortlinksPage />);

    const destInput = screen.getByPlaceholderText(/https:\/\/example\.com\/very\/long\/url/i);
    fireEvent.change(destInput, { target: { value: 'https://news.ycombinator.com' } });

    const genBtn = screen.getByRole('button', { name: /Generate Shareable Link & QR/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText(/Your Shareable Link/i)).toBeInTheDocument();
      expect(screen.getByAltText(/QR Code/i)).toBeInTheDocument();
    });
  });
});
