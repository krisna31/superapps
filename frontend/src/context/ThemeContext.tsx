import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundService } from '../services/soundService';

export type AppTheme = 'cyber' | 'oled' | 'nord' | 'emerald';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  badgeColor: string;
  previewBg: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'cyber',
    name: 'Cyber Midnight',
    description: 'Electric indigo, deep cobalt, and vibrant purple highlights',
    badgeColor: 'bg-blue-500',
    previewBg: 'from-blue-600 to-indigo-900',
  },
  {
    id: 'oled',
    name: 'OLED Stealth',
    description: 'Pure pitch-black #000000 with neon lime & cyan contrast',
    badgeColor: 'bg-emerald-400',
    previewBg: 'from-zinc-950 to-black',
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    description: 'Arctic Scandinavian slate with crisp arctic blue accents',
    badgeColor: 'bg-sky-400',
    previewBg: 'from-slate-800 to-cyan-950',
  },
  {
    id: 'emerald',
    name: 'Matrix Terminal',
    description: 'Cyberpunk phosphor green & telemetry amber accents',
    badgeColor: 'bg-teal-400',
    previewBg: 'from-emerald-950 to-teal-900',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
  themes: ThemeConfig[];
}

const THEME_STORAGE_KEY = 'superapps_active_theme_v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && (saved === 'cyber' || saved === 'oled' || saved === 'nord' || saved === 'emerald')) {
        return saved as AppTheme;
      }
    } catch {
      // Ignore
    }
    return 'cyber';
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.remove('theme-cyber', 'theme-oled', 'theme-nord', 'theme-emerald');
      document.documentElement.classList.add(`theme-${theme}`);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    soundService.playClick();
  };

  const cycleTheme = () => {
    const ids: AppTheme[] = ['cyber', 'oled', 'nord', 'emerald'];
    const currIndex = ids.indexOf(theme);
    const nextTheme = ids[(currIndex + 1) % ids.length];
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

const defaultThemeContext: ThemeContextType = {
  theme: 'cyber',
  setTheme: () => {},
  cycleTheme: () => {},
  themes: THEMES,
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  return ctx || defaultThemeContext;
};
