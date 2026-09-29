import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { UserGuidePage } from '../pages/UserGuidePage';

describe('UserGuidePage Component', () => {
  it('renders user guide title and core topic sections', () => {
    render(
      <HashRouter>
        <UserGuidePage />
      </HashRouter>
    );

    expect(screen.getByText(/Superapps OS User Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Getting Started & Zero-Knowledge Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Shortlink Hub & Stateless Redirects/i)).toBeInTheDocument();
    expect(screen.getByText(/DropZone: P2P Transfer & Ephemeral Uploads/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted Markdown Notes Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Expense & Budget Flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Dev Swiss Knife Utilities/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted Backup \(\.vault\) & SQL Console/i)).toBeInTheDocument();
  });

  it('filters guide topics dynamically based on search query', () => {
    render(
      <HashRouter>
        <UserGuidePage />
      </HashRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search user guide/i);
    fireEvent.change(searchInput, { target: { value: 'WebRTC' } });

    expect(screen.getByText(/DropZone: P2P Transfer & Ephemeral Uploads/i)).toBeInTheDocument();
    expect(screen.queryByText(/Expense & Budget Flow/i)).not.toBeInTheDocument();
  });

  it('filters topics by category tab buttons', () => {
    render(
      <HashRouter>
        <UserGuidePage />
      </HashRouter>
    );

    const backupTab = screen.getByRole('button', { name: /Backups & Database/i });
    fireEvent.click(backupTab);

    expect(screen.getByText(/Encrypted Backup \(\.vault\) & SQL Console/i)).toBeInTheDocument();
    expect(screen.queryByText(/Encrypted Markdown Notes Vault/i)).not.toBeInTheDocument();
  });

  it('expands FAQ accordion item on click', () => {
    render(
      <HashRouter>
        <UserGuidePage />
      </HashRouter>
    );

    const faqButton = screen.getByText(/What happens if I forget my master password\?/i);
    expect(screen.queryByText(/Because Superapps OS uses zero-knowledge encryption/i)).not.toBeInTheDocument();

    fireEvent.click(faqButton);
    expect(screen.getByText(/Because Superapps OS uses zero-knowledge encryption/i)).toBeInTheDocument();
  });
});
