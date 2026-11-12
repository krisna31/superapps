import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeMode, ThemePolarity, ThemeArchetype, ThemeMetadata } from '@/types';

export const THEME_MANIFEST: ThemeMetadata[] = [
  {
    id: 'ios-system',
    name: 'Apple HIG iOS',
    tagline: 'Apple Human Interface Guidelines & Frosted Vibrancy',
    lineage: 'Apple HIG / iOS 18 System Grouped',
    badge: 'Apple HIG',
    previewColors: {
      canvas: '#F2F2F7',
      surface: '#FFFFFF',
      accent: '#0055D6',
      secondary: '#5856D6',
    },
    fontSample: {
      display: 'SF Pro Display',
      family: 'SF Pro & SF Mono',
    },
  },
  {
    id: 'android-material',
    name: 'Android Material 3',
    tagline: 'Google Material You & Expressive Tonal Elevation',
    lineage: 'Google M3 / Expressive Material You',
    badge: 'Material 3',
    previewColors: {
      canvas: '#F8F9FA',
      surface: '#FFFFFF',
      accent: '#0056D2',
      secondary: '#00639B',
    },
    fontSample: {
      display: 'Roboto Flex',
      family: 'Roboto Flex & Mono',
    },
  },
  {
    id: 'honkai-valkyrie',
    name: 'Hyperion Valkyrie',
    tagline: 'Battleship Telemetry HUD & Tactical Mecha Bridge',
    lineage: 'Honkai Impact 3rd / Schicksal Bridge HUD',
    badge: 'Honkai HUD',
    previewColors: {
      canvas: '#F0F4F8',
      surface: '#121C2B',
      accent: '#00E5FF',
      secondary: '#FFB020',
    },
    fontSample: {
      display: 'Chakra Petch',
      family: 'Chakra Petch & IBM Plex',
    },
  },
  {
    id: 'zenless-urban',
    name: 'New Eridu Urban',
    tagline: 'Sixth Street Skate, Analog CRT & Cassette Punk',
    lineage: 'Zenless Zone Zero / Sixth Street Culture',
    badge: 'ZZZ Urban',
    previewColors: {
      canvas: '#F4F4F0',
      surface: '#1C1E24',
      accent: '#FFE600',
      secondary: '#00E5FF',
    },
    fontSample: {
      display: 'Syne',
      family: 'Syne & Plus Jakarta Sans',
    },
  },
  {
    id: 'werkbund-brutalist',
    name: 'Werkbund Grid',
    tagline: 'Bauhaus Architectural Blueprint & Massimo Vignelli Grid',
    lineage: 'Bauhaus / Vignelli NYC Transit / Swiss Blueprint',
    badge: 'Bauhaus Grid',
    previewColors: {
      canvas: '#F7F7F5',
      surface: '#171717',
      accent: '#0033EE',
      secondary: '#C93B00',
    },
    fontSample: {
      display: 'Bricolage Grotesque',
      family: 'Bricolage Grotesque & Public Sans',
    },
  },
  {
    id: 'retro-amber-crt',
    name: 'Retro Amber CRT',
    tagline: '1980s DEC VT220 Terminal & Continuous Stationery',
    lineage: 'DEC VT220 / Amber Phosphor Cathode Ray',
    badge: 'VT220 CRT',
    previewColors: {
      canvas: '#F5EFE6',
      surface: '#0C0E12',
      accent: '#FFB000',
      secondary: '#33FF77',
    },
    fontSample: {
      display: 'JetBrains Mono',
      family: 'JetBrains Mono & IBM Plex Mono',
    },
  },
  {
    id: 'pure-monolith',
    name: 'Pure Monolith',
    tagline: 'Swiss Stark Architecture, Zero-Radius Monochrome',
    lineage: 'Swiss International Typographic Style',
    badge: 'Pure Monolith',
    previewColors: {
      canvas: '#FFFFFF',
      surface: '#141414',
      accent: '#000000',
      secondary: '#FFFFFF',
    },
    fontSample: {
      display: 'Inter',
      family: 'Inter Variable & Space Mono',
    },
  },
];

const VALID_ARCHETYPES: ThemeArchetype[] = [
  'ios-system',
  'android-material',
  'honkai-valkyrie',
  'zenless-urban',
  'werkbund-brutalist',
  'retro-amber-crt',
  'pure-monolith',
];

export interface ThemeContextType {
  // Archetype
  archetype: ThemeArchetype;
  setArchetype: (archetype: ThemeArchetype) => void;
  archetypeMetadata: ThemeMetadata;
  allArchetypes: ThemeMetadata[];

  // Polarity
  polarity: ThemePolarity;
  resolvedPolarity: 'light' | 'dark';
  setPolarity: (polarity: ThemePolarity) => void;
  togglePolarity: () => void;

  // Backward compatibility aliases
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Archetype state
  const [archetype, setArchetypeState] = useState<ThemeArchetype>(() => {
    const saved = localStorage.getItem('superapps_theme_archetype');
    return (VALID_ARCHETYPES.includes(saved as ThemeArchetype) ? saved : 'ios-system') as ThemeArchetype;
  });

  // 2. Polarity state
  const [polarity, setPolarityState] = useState<ThemePolarity>(() => {
    const saved = localStorage.getItem('superapps_theme_mode') || 
                  localStorage.getItem('superapps_theme') || 
                  localStorage.getItem('ui-theme-mode');
    return (saved as ThemePolarity) || 'dark';
  });

  const [resolvedPolarity, setResolvedPolarity] = useState<'light' | 'dark'>('dark');

  // Compute active archetype metadata
  const archetypeMetadata = useMemo(() => {
    return THEME_MANIFEST.find((t) => t.id === archetype) || THEME_MANIFEST[0];
  }, [archetype]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (polarity === 'system') {
        isDark = mediaQuery.matches;
      } else {
        isDark = polarity === 'dark';
      }

      const mode: 'light' | 'dark' = isDark ? 'dark' : 'light';
      setResolvedPolarity(mode);

      // Set root data attributes
      root.setAttribute('data-theme-archetype', archetype);
      root.setAttribute('data-theme', mode);

      // Clean up previous archetype classes & add current
      VALID_ARCHETYPES.forEach((arch) => {
        root.classList.remove(`theme-${arch}`);
      });
      root.classList.add(`theme-${archetype}`);

      // Polarity classes
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    applyTheme();

    // Persist to localStorage
    localStorage.setItem('superapps_theme_archetype', archetype);
    localStorage.setItem('superapps_theme_mode', polarity);
    localStorage.setItem('superapps_theme', polarity);
    localStorage.setItem('ui-theme-mode', polarity);

    const listener = () => {
      if (polarity === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [archetype, polarity]);

  const setArchetype = (newArchetype: ThemeArchetype) => {
    setArchetypeState(newArchetype);
  };

  const setPolarity = (mode: ThemePolarity) => {
    setPolarityState(mode);
  };

  const togglePolarity = () => {
    setPolarityState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        archetype,
        setArchetype,
        archetypeMetadata,
        allArchetypes: THEME_MANIFEST,
        polarity,
        resolvedPolarity,
        setPolarity,
        togglePolarity,
        // Backward compatibility:
        theme: polarity,
        resolvedTheme: resolvedPolarity,
        setTheme: setPolarity,
        toggleTheme: togglePolarity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      archetype: 'ios-system' as ThemeArchetype,
      setArchetype: () => {},
      archetypeMetadata: THEME_MANIFEST[0],
      allArchetypes: THEME_MANIFEST,
      polarity: 'system' as ThemePolarity,
      resolvedPolarity: 'light' as 'light' | 'dark',
      setPolarity: () => {},
      togglePolarity: () => {},
      theme: 'system' as ThemeMode,
      resolvedTheme: 'light' as 'light' | 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
