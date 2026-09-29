import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RedirectHandlerPage } from '../pages/RedirectHandlerPage';
import { encodeStatelessLink } from '../services/statelessLinkService';

describe('RedirectHandlerPage Component', () => {
  it('renders error state when destination parameter is missing', () => {
    render(
      <MemoryRouter initialEntries={['/r']}>
        <RedirectHandlerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Redirect Failed')).toBeInTheDocument();
    expect(screen.getByText(/No destination link data found/i)).toBeInTheDocument();
  });

  it('decodes compressed payload and displays redirect destination', () => {
    const encoded = encodeStatelessLink('https://example.com/target', 'Target Document');

    render(
      <MemoryRouter initialEntries={[`/r?d=${encoded}`]}>
        <RedirectHandlerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Target Document')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/target')).toBeInTheDocument();
    expect(screen.getByText(/Continue Now/i)).toBeInTheDocument();
  });
});
