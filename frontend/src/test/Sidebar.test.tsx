import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders all grouped navigation categories and app items', () => {
    renderComponent();

    // Group headers
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Productivity Suite')).toBeInTheDocument();
    expect(screen.getByText('Connect & Share')).toBeInTheDocument();
    expect(screen.getByText('Tools & Finance')).toBeInTheDocument();
    expect(screen.getByText('System & Security')).toBeInTheDocument();

    // App items
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

  it('filters apps dynamically using the filter input', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Filter apps/i);
    fireEvent.change(searchInput, { target: { value: 'Snippets' } });

    expect(screen.getByText('Snippets Vault')).toBeInTheDocument();
    expect(screen.queryByText('Shortlinks & Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    // Clear filter
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Shortlinks & Hub')).toBeInTheDocument();
  });

  it('collapses and expands navigation groups when clicking group headers', () => {
    renderComponent();

    expect(screen.getByText('Kanban & Tasks')).toBeInTheDocument();

    // Collapse Productivity Suite
    const productivityHeader = screen.getByText('Productivity Suite');
    fireEvent.click(productivityHeader);
    expect(screen.queryByText('Kanban & Tasks')).not.toBeInTheDocument();

    // Expand Productivity Suite again
    fireEvent.click(productivityHeader);
    expect(screen.getByText('Kanban & Tasks')).toBeInTheDocument();
  });
});
