import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropZonePage } from '../pages/DropZonePage';
import * as DbContextModule from '../context/DbContext';

describe('DropZonePage Component', () => {
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
        columns: ['id', 'name', 'size', 'url', 'expiryHours', 'uploadedAt'],
        values: [],
      }),
      runMutation: mockRunMutation,
      exportBinary: vi.fn(),
      importBinary: vi.fn(),
      getTables: vi.fn().mockReturnValue(['local_stash', 'ephemeral_uploads']),
      clearDatabase: vi.fn(),
    });
  });

  it('renders all three temporary file transfer tabs', () => {
    render(<DropZonePage />);

    expect(screen.getByText(/DropZone • Temporary File Transfer & Stash/i)).toBeInTheDocument();
    expect(screen.getByText(/P2P Direct WebRTC Transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Expiring Cloud Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Local SQLite Scratch Stash/i)).toBeInTheDocument();
  });

  it('switches to Ephemeral upload tab and displays upload form', () => {
    render(<DropZonePage />);

    const ephemeralTab = screen.getByText(/Auto-Expiring Cloud Upload/i);
    fireEvent.click(ephemeralTab);

    expect(screen.getByText(/Upload Temporary File \(Auto-Delete\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lifetime Before Permanent Deletion/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload & Get Auto-Expiring Link/i })).toBeInTheDocument();
  });

  it('switches to Local Scratch Stash tab', () => {
    render(<DropZonePage />);

    const stashTab = screen.getByText(/Local SQLite Scratch Stash/i);
    fireEvent.click(stashTab);

    expect(screen.getByText(/In-Browser Encrypted Stash/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload to Local Stash/i)).toBeInTheDocument();
  });
});
