/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'text-glow': 'textGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        textGlow: {
          '0%': { textShadow: '0 0 20px rgba(56, 189, 248, 0)' },
          '100%': { textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};