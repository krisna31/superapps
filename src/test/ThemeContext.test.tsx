import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme, THEME_MANIFEST } from '@/context/ThemeContext';
import { ThemeArchetype } from '@/types';

const TestThemeConsumer: React.FC = () => {
  const { 
    archetype, 
    setArchetype, 
    archetypeMetadata, 
    allArchetypes,
    polarity,
    resolvedPolarity,
    setPolarity,
    togglePolarity,
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  } = useTheme();

  return (
    <div>
      <div data-testid="current-archetype">{archetype}</div>
      <div data-testid="archetype-name">{archetypeMetadata.name}</div>
      <div data-testid="archetype-count">{allArchetypes.length}</div>
      <div data-testid="current-polarity">{polarity}</div>
      <div data-testid="resolved-polarity">{resolvedPolarity}</div>
      <div data-testid="legacy-theme">{theme}</div>
      <div data-testid="legacy-resolved">{resolvedTheme}</div>

      <button data-testid="set-valkyrie" onClick={() => setArchetype('honkai-valkyrie')}>
        Set Valkyrie
      </button>
      <button data-testid="set-urban" onClick={() => setArchetype('zenless-urban')}>
        Set Urban
      </button>
      <button data-testid="set-werkbund" onClick={() => setArchetype('werkbund-brutalist')}>
        Set Werkbund
      </button>
      <button data-testid="set-crt" onClick={() => setArchetype('retro-amber-crt')}>
        Set CRT
      </button>
      <button data-testid="set-material" onClick={() => setArchetype('android-material')}>
        Set Material
      </button>
      <button data-testid="set-monolith" onClick={() => setArchetype('pure-monolith')}>
        Set Monolith
      </button>
      <button data-testid="set-light" onClick={() => setPolarity('light')}>
        Set Light
      </button>
      <button data-testid="toggle-polarity" onClick={() => togglePolarity()}>
        Toggle Polarity
      </button>
      <button data-testid="legacy-set-dark" onClick={() => setTheme('dark')}>
        Legacy Set Dark
      </button>
      <button data-testid="legacy-toggle" onClick={() => toggleTheme()}>
        Legacy Toggle
      </button>
    </div>
  );
};

describe('ThemeContext Multi-Theme Architecture', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme-archetype');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provides all 7 verified design archetypes in the manifest', () => {
    expect(THEME_MANIFEST).toHaveLength(7);
    const expectedIds: ThemeArchetype[] = [
      'ios-system',
      'android-material',
      'honkai-valkyrie',
      'zenless-urban',
      'werkbund-brutalist',
      'retro-amber-crt',
      'pure-monolith',
    ];
    const actualIds = THEME_MANIFEST.map((t) => t.id);
    expect(actualIds).toEqual(expectedIds);

    // Verify each archetype has complete metadata
    THEME_MANIFEST.forEach((t) => {
      expect(t.name).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.lineage).toBeTruthy();
      expect(t.badge).toBeTruthy();
      expect(t.previewColors.canvas).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.previewColors.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.previewColors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(t.fontSample.display).toBeTruthy();
      expect(t.fontSample.family).toBeTruthy();
    });
  });

  it('initializes with default ios-system archetype and dark polarity when storage is clean', () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-archetype').textContent).toBe('ios-system');
    expect(screen.getByTestId('archetype-name').textContent).toBe('Apple HIG iOS');
    expect(screen.getByTestId('current-polarity').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-polarity').textContent).toBe('dark');

    // DOM documentElement reflection
    expect(document.documentElement.getAttribute('data-theme-archetype')).toBe('ios-system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-ios-system')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('allows switching to Hyperion Valkyrie archetype and persists to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      screen.getByTestId('set-valkyrie').click();
    });

    expect(screen.getByTestId('current-archetype').textContent).toBe('honkai-valkyrie');
    expect(screen.getByTestId('archetype-name').textContent).toBe('Hyperion Valkyrie');
    expect(localStorage.getItem('superapps_theme_archetype')).toBe('honkai-valkyrie');

    // DOM verification
    expect(document.documentElement.getAttribute('data-theme-archetype')).toBe('honkai-valkyrie');
    expect(document.documentElement.classList.contains('theme-honkai-valkyrie')).toBe(true);
    expect(document.documentElement.classList.contains('theme-ios-system')).toBe(false);
  });

  it('allows cycling through Werkbund Brutalist, Retro Amber CRT, and Pure Monolith', async () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    // Werkbund
    await act(async () => {
      screen.getByTestId('set-werkbund').click();
    });
    expect(screen.getByTestId('current-archetype').textContent).toBe('werkbund-brutalist');
    expect(document.documentElement.classList.contains('theme-werkbund-brutalist')).toBe(true);

    // CRT
    await act(async () => {
      screen.getByTestId('set-crt').click();
    });
    expect(screen.getByTestId('current-archetype').textContent).toBe('retro-amber-crt');
    expect(document.documentElement.classList.contains('theme-retro-amber-crt')).toBe(true);
    expect(document.documentElement.classList.contains('theme-werkbund-brutalist')).toBe(false);

    // Monolith
    await act(async () => {
      screen.getByTestId('set-monolith').click();
    });
    expect(screen.getByTestId('current-archetype').textContent).toBe('pure-monolith');
    expect(document.documentElement.classList.contains('theme-pure-monolith')).toBe(true);
  });

  it('switches polarity and updates DOM data-theme attribute and dark/light classes', async () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    // Initial dark
    expect(screen.getByTestId('current-polarity').textContent).toBe('dark');

    // Switch to light
    await act(async () => {
      screen.getByTestId('set-light').click();
    });

    expect(screen.getByTestId('current-polarity').textContent).toBe('light');
    expect(screen.getByTestId('resolved-polarity').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('superapps_theme_mode')).toBe('light');

    // Toggle back to dark
    await act(async () => {
      screen.getByTestId('toggle-polarity').click();
    });

    expect(screen.getByTestId('current-polarity').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-polarity').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('preserves backward compatibility with legacy theme and setTheme aliases', async () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('legacy-theme').textContent).toBe('dark');
    expect(screen.getByTestId('legacy-resolved').textContent).toBe('dark');

    await act(async () => {
      screen.getByTestId('legacy-toggle').click();
    });

    expect(screen.getByTestId('legacy-theme').textContent).toBe('light');
    expect(screen.getByTestId('legacy-resolved').textContent).toBe('light');
  });

  it('restores saved archetype and polarity from localStorage upon mount', () => {
    localStorage.setItem('superapps_theme_archetype', 'zenless-urban');
    localStorage.setItem('superapps_theme_mode', 'light');

    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-archetype').textContent).toBe('zenless-urban');
    expect(screen.getByTestId('archetype-name').textContent).toBe('New Eridu Urban');
    expect(screen.getByTestId('current-polarity').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme-archetype')).toBe('zenless-urban');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
