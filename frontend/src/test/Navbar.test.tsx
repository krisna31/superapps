import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import * as AuthContextModule from '../context/AuthContext';
import * as DbContextModule from '../context/DbContext';
import * as CommandPaletteContextModule from '../context/CommandPaletteContext';
import * as ThemeContextModule from '../context/ThemeContext';

describe('Navbar Component', () => {
  const mockRunQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isConfigured: true,
      isUnlocked: true,
      vaultMeta: {
        isInitialized: true,
        salt: 'abc',
        verifierCipher: 'xyz',
        verifierIv: '123',
        autoLockMinutes: 15,
      },
      activeKey: null,
      setupVault: vi.fn(),
      unlockVault: vi.fn(),
      unlockWithBiometrics: vi.fn(),
      enableBiometrics: vi.fn(),
      disableBiometrics: vi.fn(),
      isBiometricEnrolled: true,
      lockVault: vi.fn(),
      resetVault: vi.fn(),
      updateAutoLock: vi.fn(),
      biometricsAvailable: true,
    });

    vi.spyOn(DbContextModule, 'useDb').mockReturnValue({
      isReady: true,
      error: null,
      refreshSignal: 0,
      triggerRefresh: vi.fn(),
      runQuery: mockRunQuery.mockReturnValue({
        columns: ['count', 'urgent'],
        values: [[5, 2]],
      }),
      runMutation: vi.fn(),
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['tasks']),
      clearDatabase: vi.fn(),
    });

    vi.spyOn(CommandPaletteContextModule, 'useCommandPalette').mockReturnValue({
      isOpen: false,
      openPalette: vi.fn(),
      closePalette: vi.fn(),
      togglePalette: vi.fn(),
    });

    vi.spyOn(ThemeContextModule, 'useTheme').mockReturnValue({
      theme: 'cyber',
      setTheme: vi.fn(),
      cycleTheme: vi.fn(),
      themes: [
        {
          id: 'cyber',
          name: 'Cyber Neon',
          description: 'Dark futuristic',
          badgeColor: 'bg-blue-500',
          previewBg: 'from-blue-600 to-indigo-900',
        },
      ],
    });
  });

  const renderComponent = () =>
    render(
      <HashRouter>
        <Navbar />
      </HashRouter>
    );

  it('renders task count metrics badge and quick new task button when unlocked', () => {
    renderComponent();

    // Check Tasks link and pending count badge
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check Quick New Task action button
    expect(screen.getByTitle(/Quick New Task/i)).toBeInTheDocument();
  });
});
