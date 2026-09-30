import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

describe('Superapps Main Application Component', () => {
  it('renders application shell, brand logo, and navigation links', async () => {
    render(<App />);

    // Brand title
    const brandElements = screen.getAllByText(/Superapps/i);
    expect(brandElements.length).toBeGreaterThan(0);

    // Nav & module elements (use getAllByText as they appear in sidebar and dashboard)
    expect(screen.getAllByText('Tasks (Kanban)').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Notes Vault').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Daily Habits').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Expenses & Budget').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Snippets Vault').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('SwissKnife Dev Tools').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Dropzone File Sharing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('URL Shortlinks').length).toBeGreaterThanOrEqual(1);

    // Domain display in sidebar footer
    expect(screen.getByText('apps.k31.my.id')).toBeInTheDocument();
  });
});
