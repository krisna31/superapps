import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { SnippetsPage } from '../pages/SnippetsPage';
import * as DbContextModule from '../context/DbContext';
import { soundService } from '../services/soundService';

describe('SnippetsPage Component', () => {
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
        columns: ['id', 'title', 'description', 'language', 'code', 'tags', 'isPinned', 'createdAt', 'updatedAt'],
        values: [
          [
            's1',
            'PostgreSQL Docker Compose',
            'Spin up local db with pgvector',
            'yaml',
            'version: "3.8"\nservices:\n  db:\n    image: pgvector/pgvector:pg16',
            JSON.stringify(['docker', 'database']),
            1,
            '2026-09-29T10:00:00Z',
            '2026-09-29T10:00:00Z',
          ],
          [
            's2',
            'Tailwind Grid Helper',
            'Responsive 6-column auto grid',
            'css',
            '.grid-responsive { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }',
            JSON.stringify(['css', 'tailwind']),
            0,
            '2026-09-28T10:00:00Z',
            '2026-09-28T10:00:00Z',
          ],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['snippets']),
      clearDatabase: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <HashRouter>
        <SnippetsPage />
      </HashRouter>
    );

  it('renders snippets list with code and language badge', () => {
    renderComponent();

    expect(screen.getByText('Encrypted Snippets Vault')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL Docker Compose')).toBeInTheDocument();
    expect(screen.getByText('Tailwind Grid Helper')).toBeInTheDocument();
    expect(screen.getByText(/version: "3.8"/i)).toBeInTheDocument();
  });

  it('opens New Snippet modal and creates snippet', () => {
    renderComponent();

    const newBtn = screen.getByRole('button', { name: /New Snippet/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Create New Snippet')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/e.g. Docker Compose PostgreSQL with pgvector/i);
    fireEvent.change(titleInput, { target: { value: 'Rust Tokio Async Main' } });

    const codeArea = screen.getByPlaceholderText(/Paste or write your code/i);
    fireEvent.change(codeArea, { target: { value: '#[tokio::main]\nasync fn main() {}' } });

    const submitBtn = screen.getByRole('button', { name: /^Create Snippet$/i });
    fireEvent.click(submitBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO snippets'),
      expect.arrayContaining(['Rust Tokio Async Main'])
    );
  });

  it('copies code to clipboard and triggers acoustic chime', () => {
    const playSuccessSpy = vi.spyOn(soundService, 'playSuccess');
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    renderComponent();

    const copyBtns = screen.getAllByTitle('Copy code to clipboard');
    fireEvent.click(copyBtns[0]);

    expect(clipboardSpy).toHaveBeenCalledWith(expect.stringContaining('version: "3.8"'));
    expect(playSuccessSpy).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('toggles pinned status', () => {
    renderComponent();

    const unpinBtn = screen.getByTitle('Unpin snippet');
    fireEvent.click(unpinBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE snippets SET isPinned = ?, updatedAt = ? WHERE id = ?;'),
      [0, expect.any(String), 's1']
    );
  });

  it('deletes snippet after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderComponent();

    const deleteBtns = screen.getAllByTitle('Delete snippet');
    fireEvent.click(deleteBtns[0]);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM snippets WHERE id = ?;'),
      ['s1']
    );
  });

  it('handles malformed/unquoted tags without crashing', () => {
    mockRunQuery.mockReturnValueOnce({
      columns: ['id', 'title', 'description', 'language', 'code', 'tags', 'isPinned', 'createdAt', 'updatedAt'],
      values: [
        [
          's_corrupted',
          'Corrupted Snippet',
          'Desc',
          'shell',
          'echo "hello"',
          '{not-valid-json',
          0,
          '2026-09-29T10:00:00Z',
          '2026-09-29T10:00:00Z',
        ],
      ],
    });

    renderComponent();
    expect(screen.getByText('Corrupted Snippet')).toBeInTheDocument();
  });
});
