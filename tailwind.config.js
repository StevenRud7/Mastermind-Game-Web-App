/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#08090c',
          900: '#0f1117',
          800: '#181b24',
          700: '#22273a',
          600: '#2e3450',
          500: '#3d4566',
        },
        gold: {
          400: '#f0c060',
          500: '#e8a830',
          600: '#c8881a',
        },
      },
      animation: {
        'peg-drop': 'pegDrop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'row-lock': 'rowLock 0.4s ease forwards',
        'shake': 'shake 0.5s ease',
        'pulse-ring': 'pulseRing 1.5s ease infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'reveal': 'reveal 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        pegDrop: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        rowLock: {
          '0%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-8px)' },
          '80%': { transform: 'translateX(8px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(240,192,96,0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(240,192,96,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(240,192,96,0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          '0%': { transform: 'scale(0) rotateY(180deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}