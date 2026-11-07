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
        xs: '4px',
        sm: '8px',
        DEFAULT: '10px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
        full: '9999px',
        pill: '9999px',
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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', '"SF Pro"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      transitionDuration: {
        fast: '150ms',
        interactive: '200ms',
        panel: '240ms',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      }
    },
  },
  plugins: [],
}
