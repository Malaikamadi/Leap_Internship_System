/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9eb',
          300: '#94bedc',
          400: '#5e9dc8',
          500: '#387eb4',
          600: '#266396',
          700: '#1e4f7a',
          800: '#183c5e',
          900: '#002B49', // Limkokwing Sierra Leone Signature Navy
          950: '#001a2e',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f9fb',
          subtle: '#f1f5f9',
        },
        border: {
          DEFAULT: '#e2e8f0',
          dark: '#cbd5e1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 43 73 / 0.04)',
        card: '0 1px 3px 0 rgb(0 43 73 / 0.06), 0 1px 2px -1px rgb(0 43 73 / 0.04)',
        dropdown: '0 10px 25px -5px rgb(0 43 73 / 0.10), 0 4px 10px -4px rgb(0 43 73 / 0.05)',
      },
    },
  },
  plugins: [],
};
