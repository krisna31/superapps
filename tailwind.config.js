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
        accent: {
          DEFAULT: 'var(--accent-primary)',
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          tint: 'var(--accent-tint)',
          secondary: 'var(--accent-secondary)',
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
        brand: {
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#C6C6C8',
          500: 'var(--accent-primary)',
          600: 'var(--accent-hover)',
          700: '#0040A8',
        },
        dark: {
          bg: 'var(--bg-canvas)',
          card: 'var(--bg-surface)',
          cardHover: 'var(--bg-subtle)',
          border: 'var(--border-default)',
          muted: 'var(--text-muted)',
        }
      },
      borderRadius: {
        none: '0px',
        xs: 'var(--radius-xs, 4px)',
        sm: 'var(--radius-sm, 8px)',
        DEFAULT: 'var(--radius-md, 10px)',
        md: 'var(--radius-md, 10px)',
        lg: 'var(--radius-lg, 14px)',
        xl: 'var(--radius-xl, 20px)',
        '2xl': 'var(--radius-xl, 24px)',
        full: 'var(--radius-pill, 9999px)',
        pill: 'var(--radius-pill, 9999px)',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 12px 28px rgba(0, 0, 0, 0.12)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.16)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
      transitionDuration: {
        fast: 'var(--duration-fast, 150ms)',
        interactive: 'var(--duration-interactive, 200ms)',
        panel: 'var(--duration-panel, 240ms)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease-main, cubic-bezier(0.25, 0.1, 0.25, 1))',
        ios: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      }
    },
  },
  plugins: [],
}
