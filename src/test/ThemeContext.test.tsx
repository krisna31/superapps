import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const ThemeTester: React.FC = () => {
  const { theme, setTheme, cycleTheme, themes } = useTheme();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="theme-count">{themes.length}</span>
      <button onClick={() => setTheme('oled')}>Set OLED</button>
      <button onClick={() => cycleTheme()}>Cycle Theme</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default cyber theme and allows setting OLED', () => {
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('cyber');
    expect(screen.getByTestId('theme-count').textContent).toBe('4');

    fireEvent.click(screen.getByText('Set OLED'));
    expect(screen.getByTestId('current-theme').textContent).toBe('oled');
    expect(document.documentElement.getAttribute('data-theme')).toBe('oled');
    expect(localStorage.getItem('superapps_active_theme_v1')).toBe('oled');
  });

  it('cycles across themes sequentially', () => {
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    // Initial is cyber
    expect(screen.getByTestId('current-theme').textContent).toBe('cyber');

    // Cycle to oled
    fireEvent.click(screen.getByText('Cycle Theme'));
    expect(screen.getByTestId('current-theme').textContent).toBe('oled');

    // Cycle to nord
    fireEvent.click(screen.getByText('Cycle Theme'));
    expect(screen.getByTestId('current-theme').textContent).toBe('nord');

    // Cycle to emerald
    fireEvent.click(screen.getByText('Cycle Theme'));
    expect(screen.getByTestId('current-theme').textContent).toBe('emerald');

    // Cycle back to cyber
    fireEvent.click(screen.getByText('Cycle Theme'));
    expect(screen.getByTestId('current-theme').textContent).toBe('cyber');
  });
});
