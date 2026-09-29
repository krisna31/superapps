import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DbProvider } from '../context/DbContext';
import { ThemeProvider } from '../context/ThemeContext';
import { CommandPaletteProvider, useCommandPalette } from '../context/CommandPaletteContext';
import { CommandPaletteModal } from '../components/palette/CommandPaletteModal';

const TestTrigger = () => {
  const { openPalette } = useCommandPalette();
  return <button onClick={openPalette}>Open Palette Test</button>;
};

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <DbProvider>
            <CommandPaletteProvider>
              {ui}
              <CommandPaletteModal />
            </CommandPaletteProvider>
          </DbProvider>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

describe('CommandPaletteModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is closed by default and does not render search input', () => {
    renderWithProviders(<TestTrigger />);
    expect(screen.queryByPlaceholderText(/Type a command or search SQLite records/i)).not.toBeInTheDocument();
  });

  it('opens when trigger button is clicked and shows default actions', () => {
    renderWithProviders(<TestTrigger />);
    fireEvent.click(screen.getByText('Open Palette Test'));

    expect(screen.getByPlaceholderText(/Type a command or search SQLite records/i)).toBeInTheDocument();
    expect(screen.getByText('Create New Shortlink')).toBeInTheDocument();
    expect(screen.getByText('Create New Note')).toBeInTheDocument();
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByText('Create New Snippet')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('toggles open and closed via Ctrl+K hotkey', () => {
    renderWithProviders(<div />);
    expect(screen.queryByPlaceholderText(/Type a command or search SQLite records/i)).not.toBeInTheDocument();

    // Press Ctrl+K to open
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByPlaceholderText(/Type a command or search SQLite records/i)).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/Type a command or search SQLite records/i)).not.toBeInTheDocument();
  });

  it('filters actions when user types a query', () => {
    renderWithProviders(<TestTrigger />);
    fireEvent.click(screen.getByText('Open Palette Test'));

    const searchInput = screen.getByPlaceholderText(/Type a command or search SQLite records/i);
    fireEvent.change(searchInput, { target: { value: 'Note' } });

    expect(screen.getByText('Create New Note')).toBeInTheDocument();
    expect(screen.getByText('Go to Encrypted Notes')).toBeInTheDocument();
    expect(screen.queryByText('Log New Expense / Income')).not.toBeInTheDocument();
  });

  it('navigates selection with ArrowDown and ArrowUp', () => {
    renderWithProviders(<TestTrigger />);
    fireEvent.click(screen.getByText('Open Palette Test'));

    const modalContainer = screen.getByPlaceholderText(/Type a command or search SQLite records/i).closest('div')?.parentElement;
    expect(modalContainer).toBeInTheDocument();

    // Arrow down to move index
    fireEvent.keyDown(modalContainer!, { key: 'ArrowDown' });
    fireEvent.keyDown(modalContainer!, { key: 'ArrowUp' });
  });
});
