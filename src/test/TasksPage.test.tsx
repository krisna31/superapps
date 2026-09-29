import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { TasksPage } from '../pages/TasksPage';
import * as DbContextModule from '../context/DbContext';

describe('TasksPage Component', () => {
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
        columns: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'tags', 'checklist', 'createdAt', 'updatedAt'],
        values: [
          [
            't1',
            'Implement WebAuthn Fast Unlock',
            'Hardware biometrics with Touch ID and Windows Hello',
            'in_progress',
            'urgent',
            '2026-10-01',
            JSON.stringify(['security', 'biometrics']),
            JSON.stringify([{ id: 'c1', text: 'Register credential', completed: true }, { id: 'c2', text: 'Derive wrap key', completed: false }]),
            '2026-09-29T10:00:00Z',
            '2026-09-29T10:00:00Z',
          ],
          [
            't2',
            'Refactor SQLite VFS Debounce',
            'Optimize disk persistence flush',
            'backlog',
            'medium',
            '2026-10-15',
            JSON.stringify(['database']),
            JSON.stringify([]),
            '2026-09-29T09:00:00Z',
            '2026-09-29T09:00:00Z',
          ],
          [
            't3',
            'Design Acoustic Soundscapes',
            'Synthesize sine wave chords',
            'completed',
            'low',
            '',
            JSON.stringify(['audio']),
            JSON.stringify([]),
            '2026-09-28T12:00:00Z',
            '2026-09-28T12:00:00Z',
          ],
        ],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['tasks']),
      clearDatabase: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <HashRouter>
        <TasksPage />
      </HashRouter>
    );

  it('renders Kanban board with columns and tasks', () => {
    renderComponent();

    expect(screen.getByText('Kanban & Task Matrix')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();

    // Check task titles
    expect(screen.getByText('Implement WebAuthn Fast Unlock')).toBeInTheDocument();
    expect(screen.getByText('Refactor SQLite VFS Debounce')).toBeInTheDocument();
    expect(screen.getByText('Design Acoustic Soundscapes')).toBeInTheDocument();

    // Check priority badge
    expect(screen.getAllByText('Urgent').length).toBeGreaterThanOrEqual(1);
  });

  it('opens New Task modal and inserts a new task into SQLite', () => {
    renderComponent();

    const newTaskBtn = screen.getByRole('button', { name: /New Task/i });
    fireEvent.click(newTaskBtn);

    expect(screen.getByText('Create New Task')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/e.g. Implement WebAuthn biometric unlock/i);
    fireEvent.change(titleInput, { target: { value: 'Write E2E test suite' } });

    const submitBtn = screen.getByRole('button', { name: /^Create Task$/i });
    fireEvent.click(submitBtn);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Write E2E test suite'])
    );
  });

  it('moves task to another column', () => {
    renderComponent();

    // Find move right button on the in_progress task to move it to review
    const moveReviewBtns = screen.getAllByTitle('Move to review');
    fireEvent.click(moveReviewBtns[0]);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?;'),
      ['review', expect.any(String), 't1']
    );
  });

  it('toggles checklist item directly on card', () => {
    renderComponent();

    // Click on uncompleted checklist item "Derive wrap key"
    const checklistItem = screen.getByText('Derive wrap key');
    fireEvent.click(checklistItem);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tasks SET checklist = ?, updatedAt = ? WHERE id = ?;'),
      [
        expect.stringContaining('"completed":true'),
        expect.any(String),
        't1',
      ]
    );
  });

  it('deletes task after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderComponent();

    const deleteBtns = screen.getAllByTitle('Delete Task');
    fireEvent.click(deleteBtns[0]);

    expect(mockRunMutation).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM tasks WHERE id = ?;'),
      ['t2']
    );
  });
});
