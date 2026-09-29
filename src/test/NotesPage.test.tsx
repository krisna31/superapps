import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotesPage } from '../pages/NotesPage';
import * as DbContextModule from '../context/DbContext';

describe('NotesPage Component', () => {
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
        columns: ['id', 'title', 'content', 'category', 'isPinned', 'createdAt', 'updatedAt'],
        values: [
          ['n1', 'Architecture Plan', '# System Overview\n\nClient side first.', 'Work', 1, '2026-09-01', '2026-09-01'],
          ['n2', 'Shopping List', '1. Apples\n2. Oranges', 'Personal', 0, '2026-09-02', '2026-09-02'],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['notes']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders notes list and loads the first note into editor', () => {
    render(<NotesPage />);

    expect(screen.getByText('Encrypted Markdown Notes')).toBeInTheDocument();
    expect(screen.getByText('Architecture Plan')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('Note Title...');
    expect((titleInput as HTMLInputElement).value).toBe('Architecture Plan');
  });

  it('creates a new note on button click', () => {
    render(<NotesPage />);

    const newBtn = screen.getByRole('button', { name: /New Note/i });
    fireEvent.click(newBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notes'),
      expect.arrayContaining(['Untitled Note'])
    );
  });

  it('toggles markdown preview mode', () => {
    render(<NotesPage />);

    const previewToggle = screen.getByTitle('Switch to Preview');
    fireEvent.click(previewToggle);

    expect(screen.getByTitle('Switch to Edit')).toBeInTheDocument();
    expect(screen.getByText(/# System Overview/i)).toBeInTheDocument();
  });

  it('deletes active note after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<NotesPage />);

    const deleteBtn = screen.getByTitle('Delete Note');
    fireEvent.click(deleteBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM notes WHERE id = ?;'),
      ['n1']
    );
  });
});
