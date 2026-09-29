import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackupCenterPage } from '../pages/BackupCenterPage';
import * as DbContextModule from '../context/DbContext';

describe('BackupCenterPage Component', () => {
  const mockExportBinary = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
  const mockImportBinary = vi.fn();
  const mockRunQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(DbContextModule, 'useDb').mockReturnValue({
      isReady: true,
      error: null,
      refreshSignal: 0,
      triggerRefresh: vi.fn(),
      runQuery: mockRunQuery.mockReturnValue({
        columns: ['name'],
        values: [['shortlinks'], ['notes'], ['expenses']],
      }),
      runMutation: vi.fn(),
      exportBinary: mockExportBinary,
      importBinary: mockImportBinary,
      getTables: vi.fn().mockReturnValue(['shortlinks', 'notes', 'expenses']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders encrypted export, import, and SQL console sections', () => {
    render(<BackupCenterPage />);

    expect(screen.getByText(/Backup, Encrypted Migration & SQL Lab/i)).toBeInTheDocument();
    expect(screen.getByText(/Password-Protected Export \(\.vault\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Password-Protected Import \(\.vault\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive In-Browser SQLite Console/i)).toBeInTheDocument();
  });

  it('executes custom SQL query and renders table results', () => {
    render(<BackupCenterPage />);

    const runBtn = screen.getByRole('button', { name: /Run SQL Query/i });
    fireEvent.click(runBtn);

    expect(mockRunQuery).toHaveBeenCalled();
    expect(screen.getAllByText('shortlinks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('notes').length).toBeGreaterThanOrEqual(1);
  });
});
