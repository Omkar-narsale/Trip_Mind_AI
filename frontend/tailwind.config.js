/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060911',
          900: '#0a0f1d',
          850: '#0f172a',
          800: '#162238',
          700: '#1e2e4a',
        },
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#89cbff',
          400: '#52acff',
          500: '#2b8aff',
          600: '#1467f5',
          700: '#0f51e0',
          800: '#1341b5',
          900: '#153a8e',
          950: '#112557',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        'glow-brand': '0 0 30px -5px rgba(43, 138, 255, 0.35)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}
