/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      animation: {
        'slide-up': 'slideUp 0.32s cubic-bezier(0.34,1.48,0.64,1)',
        'fade-in': 'fadeIn 0.2s ease',
        'toast-in': 'toastIn 0.3s ease',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        toastIn: { from: { opacity: 0, transform: 'translateX(-50%) translateY(12px)' }, to: { opacity: 1, transform: 'translateX(-50%) translateY(0)' } },
      },
    },
  },
  plugins: [],
};
