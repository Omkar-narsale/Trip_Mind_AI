/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFCFA',
          100: '#F6F6F2', // Primary background
          200: '#EFEFE8',
          300: '#E5E3DC',
          400: '#D5D3CA',
          500: '#B8B5AB',
        },
        forest: {
          50: '#F2F7F4',
          100: '#E1EFE7',
          200: '#C2DFCE',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#1B4332', // Deep natural green accent
          800: '#143326',
          900: '#0D2119',
        },
        travel: {
          dark: '#111110',      // Primary text
          body: '#424A4D',      // Secondary text
          muted: '#6C889D',     // Muted text
          card: '#FFFFFF',      // Clean card surface
          cardWarm: '#FAF9F6',  // Warm card surface
          border: '#E8E6DF',    // Subtle border
          sky: '#1D3557',       // Ocean/Muted blue
          sand: '#E9D8A6',
          terracotta: '#D97736'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px'
      },
      boxShadow: {
        'subtle': '0 2px 12px -2px rgba(17, 17, 16, 0.05)',
        'travel-card': '0 10px 30px -4px rgba(17, 17, 16, 0.06), 0 4px 12px -2px rgba(17, 17, 16, 0.03)',
        'travel-hover': '0 20px 40px -8px rgba(17, 17, 16, 0.12), 0 8px 16px -4px rgba(17, 17, 16, 0.04)',
        'hero-search': '0 24px 60px -12px rgba(17, 17, 16, 0.18)',
      }
    },
  },
  plugins: [],
}
