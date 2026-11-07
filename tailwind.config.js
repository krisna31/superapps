/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        subtle: 'var(--bg-subtle)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        signal: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          tint: 'var(--accent-tint)',
          secondary: 'var(--accent-secondary)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          danger: 'var(--status-danger)',
          info: 'var(--status-info)',
        },
        // Unified backwards-compatible semantic mapping to Werkbund Grid tokens
        brand: {
          50: '#F7F7F5',
          100: '#EBEBE8',
          200: '#D4D4D0',
          500: 'var(--accent-primary)',
          600: 'var(--accent-hover)',
          700: '#0022AA',
        },
        dark: {
          bg: 'var(--bg-canvas)',
          card: 'var(--bg-surface)',
          cardHover: 'var(--bg-subtle)',
          border: 'var(--border-strong)',
          muted: 'var(--text-muted)',
        }
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      borderRadius: {
        none: '0px',
        xs: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        full: '2px',
      },
      boxShadow: {
        none: 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: 'none',
        lg: 'none',
        xl: 'none',
        '2xl': 'none',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['"Public Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionDuration: {
        fast: '110ms',
        panel: '150ms',
      },
      transitionTimingFunction: {
        werkbund: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
