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
        ink: '#22201d',
        'ink-soft': '#4a453e',
        paper: '#f5f2ea',
        surface: '#ffffff',
        line: '#e5ddc9',
        'line-soft': '#ece6d6',
        accent: '#c1502e',
        'accent-ink': '#7c3319',
        'accent-tint': '#f3ddd2',
        herb: '#4c7a5a',
        'herb-tint': '#dfeee2',
        amber: '#c9891a',
        'amber-tint': '#f7e9cd',
        steel: '#2f5d73',
        'steel-tint': '#dbe8ec',
        danger: '#b23a3a',
        'danger-tint': '#f4dcd8',
        muted: '#8a8272'
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