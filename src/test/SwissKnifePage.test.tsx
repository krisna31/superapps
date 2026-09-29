import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwissKnifePage } from '../pages/SwissKnifePage';

describe('SwissKnifePage Component', () => {
  it('renders all utility tabs', () => {
    render(<SwissKnifePage />);

    expect(screen.getByText('JSON Studio')).toBeInTheDocument();
    expect(screen.getByText('JWT Inspector')).toBeInTheDocument();
    expect(screen.getByText('Base64 / URL')).toBeInTheDocument();
    expect(screen.getByText('Crypto Hasher & UUID')).toBeInTheDocument();
    expect(screen.getByText('Regex Lab')).toBeInTheDocument();
    expect(screen.getByText('Password & Diceware')).toBeInTheDocument();
  });

  it('formats JSON when clicking Beautify button', () => {
    render(<SwissKnifePage />);

    const beautifyBtn = screen.getByRole('button', { name: /Beautify/i });
    fireEvent.click(beautifyBtn);

    const formattedArea = screen.getByPlaceholderText(/Click Beautify or Minify to see result/i);
    expect((formattedArea as HTMLTextAreaElement).value).toContain('{\n  "name": "Superapps"');
  });

  it('switches to Base64 tab and shows encoded text', () => {
    render(<SwissKnifePage />);

    const base64Tab = screen.getByText('Base64 / URL');
    fireEvent.click(base64Tab);

    expect(screen.getByText('Raw Text')).toBeInTheDocument();
    expect(screen.getByText('Base64 Encoded')).toBeInTheDocument();
  });

  it('switches to Password & Diceware tab and generates secrets', () => {
    render(<SwissKnifePage />);

    const passTab = screen.getByText('Password & Diceware');
    fireEvent.click(passTab);

    expect(screen.getByText('Generated Secret')).toBeInTheDocument();
    expect(screen.getByText('Random Password')).toBeInTheDocument();
    expect(screen.getByText('Diceware Passphrase')).toBeInTheDocument();
    expect(screen.getByText('Password Settings')).toBeInTheDocument();

    // Switch to Diceware mode
    const dicewareBtn = screen.getByRole('button', { name: /Diceware Passphrase/i });
    fireEvent.click(dicewareBtn);

    expect(screen.getByText('Diceware Settings')).toBeInTheDocument();

    // Regenerate
    const regenBtn = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenBtn);

    // Copy secret
    const copyBtn = screen.getByRole('button', { name: /Copy Secret/i });
    fireEvent.click(copyBtn);

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});
