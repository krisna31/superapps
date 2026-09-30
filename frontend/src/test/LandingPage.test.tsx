import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';

describe('LandingPage Component', () => {
  it('renders title, hero text, and client-side badge', () => {
    render(
      <HashRouter>
        <LandingPage />
      </HashRouter>
    );

    expect(screen.getByText(/Your Private Daily Superapp Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/Hosted Purely on GitHub Pages/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Client-Side • Zero-Knowledge Encryption • SQLite WASM/i)).toBeInTheDocument();
  });

  it('renders all 6 daily mini-apps in the showcase catalog', () => {
    render(
      <HashRouter>
        <LandingPage />
      </HashRouter>
    );

    expect(screen.getByText(/Shortlink & Launcher/i)).toBeInTheDocument();
    expect(screen.getByText(/DropZone & P2P Transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted Notes Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Expense & Budget Flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Dev Swiss Knife/i)).toBeInTheDocument();
    expect(screen.getByText(/Focus & Habit Tracker/i)).toBeInTheDocument();
  });

  it('renders primary launch buttons pointing to /app', () => {
    render(
      <HashRouter>
        <LandingPage />
      </HashRouter>
    );

    const openVaultBtn = screen.getByRole('link', { name: /Open Superapps Vault/i });
    expect(openVaultBtn).toHaveAttribute('href', '#/app');

    const backupLink = screen.getByRole('link', { name: /Encrypted Backup & Import/i });
    expect(backupLink).toHaveAttribute('href', '#/app/backup');
  });
});
