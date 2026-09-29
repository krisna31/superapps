import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import * as DbContextModule from '../context/DbContext';

describe('Sidebar Component', () => {
  const mockRunQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(DbContextModule, 'useDb').mockReturnValue({
      isReady: true,
      error: null,
      refreshSignal: 0,
      triggerRefresh: vi.fn(),
      runQuery: mockRunQuery.mockReturnValue({
        columns: ['count'],
        values: [[4]],
      }),
      runMutation: vi.fn(),
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['tasks', 'snippets']),
      clearDatabase: vi.fn(),
    });
  });

  const renderComponent = () =>
    render(
      <HashRouter>
        <Sidebar />
      </HashRouter>
    );

  it('renders all navigation items including Kanban & Tasks and Snippets Vault', () => {
    renderComponent();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Kanban & Tasks')).toBeInTheDocument();
    expect(screen.getByText('Snippets Vault')).toBeInTheDocument();
    expect(screen.getByText('Shortlinks & Hub')).toBeInTheDocument();
    expect(screen.getByText('Swiss Knife')).toBeInTheDocument();
    expect(screen.getByText('Local-First')).toBeInTheDocument();
  });

  it('displays pending task count metric badge next to Kanban & Tasks', () => {
    renderComponent();

    const badge = screen.getByText('4');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('a')).toHaveAttribute('href', '#/app/tasks');
  });
});
