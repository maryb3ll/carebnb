/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)', // pink-500
          foreground: 'var(--color-primary-foreground)' // white
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', // gray-800
          foreground: 'var(--color-secondary-foreground)' // white
        },
        accent: {
          DEFAULT: 'var(--color-accent)', // red-600
          foreground: 'var(--color-accent-foreground)' // white
        },
        background: 'var(--color-background)', // gray-100
        foreground: 'var(--color-foreground)', // gray-800
        card: {
          DEFAULT: 'var(--color-card)', // white
          foreground: 'var(--color-card-foreground)' // gray-800
        },
        popover: {
          DEFAULT: 'var(--color-popover)', // white
          foreground: 'var(--color-popover-foreground)' // gray-800
        },
        muted: {
          DEFAULT: 'var(--color-muted)', // gray-200
          foreground: 'var(--color-muted-foreground)' // gray-500
        },
        border: 'var(--color-border)', // gray-800 with opacity
        input: 'var(--color-input)', // white
        ring: 'var(--color-ring)', // pink-500
        success: {
          DEFAULT: 'var(--color-success)', // green-600
          foreground: 'var(--color-success-foreground)' // white
        },
        warning: {
          DEFAULT: 'var(--color-warning)', // yellow-600
          foreground: 'var(--color-warning-foreground)' // white
        },
        error: {
          DEFAULT: 'var(--color-error)', // red-600
          foreground: 'var(--color-error-foreground)' // white
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', // red-600
          foreground: 'var(--color-destructive-foreground)' // white
        }
      },
      fontFamily: {
        heading: ['Source Serif Pro', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        caption: ['DM Sans', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace']
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2' }],
        'h2': ['1.875rem', { lineHeight: '1.25' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h4': ['1.25rem', { lineHeight: '1.4' }],
        'h5': ['1.125rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'caption': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.025em' }]
      },
      spacing: {
        '6': '0.375rem',
        '12': '0.75rem',
        '18': '1.125rem',
        '24': '1.5rem',
        '32': '2rem',
        '48': '3rem',
        '64': '4rem',
        '80': '5rem',
        '120': '7.5rem'
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '12px',
        'md': '12px',
        'lg': '18px',
        'xl': '24px'
      },
      boxShadow: {
        'organic-sm': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'organic': '0 3px 6px rgba(0, 0, 0, 0.12)',
        'organic-md': '0 6px 12px rgba(0, 0, 0, 0.12)',
        'organic-lg': '0 12px 24px rgba(0, 0, 0, 0.14)',
        'organic-xl': '0 20px 40px -8px rgba(0, 0, 0, 0.16)'
      },
      transitionDuration: {
        '250': '250ms'
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      },
      zIndex: {
        '100': '100',
        '200': '200',
        '400': '400'
      },
      ringWidth: {
        '3': '3px'
      },
      ringOffsetWidth: {
        '3': '3px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate')
  ]
}