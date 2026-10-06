import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1c1917',
        'ink-soft': '#78716c',
        paper: '#faf8f5',
        surface: '#ffffff',
        line: '#e7e5e4',
        'line-soft': '#f5f5f4',
        accent: '#c1502e',
        'accent-ink': '#8a3a1f',
        'accent-tint': '#f8e3dc',
        'accent-light': '#fdf0e8',
        herb: '#3d8b5a',
        'herb-tint': '#d8f0df',
        amber: '#b07d1a',
        'amber-tint': '#f7eacc',
        steel: '#2b5f78',
        'steel-tint': '#d8e8ef',
        danger: '#b52b2b',
        'danger-tint': '#f5dada',
        muted: '#78716c'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px',
        xl: '20px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(34,32,29,0.06)',
        DEFAULT: '0 6px 20px rgba(34,32,29,0.08)',
        lg: '0 20px 50px rgba(34,32,29,0.18)'
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease',
        'pop-in': 'popIn 0.18s ease',
        'slide-up': 'slideUp 0.25s ease'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'none' }
        }
      }
    },
  },
  plugins: [],
};

export default config;