/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Zamrud AGIH360: tindakan utama
        brand: {
          50: '#ECFDF6', 100: '#D1FAE8', 200: '#A6F2D3', 300: '#6CE4B9', 400: '#33CD9A',
          500: '#10B483', 600: '#06926B', 700: '#077558', 800: '#0A5D48', 900: '#0A4C3C',
        },
        // Emas: aksen timbangan
        emas: { 300: '#FCD879', 400: '#F9C846', 500: '#EEAE1A', 600: '#CF8A0F' },
        navy: {
          50: '#EEF2F7', 100: '#DCE4EE', 200: '#B9C7DB', 300: '#8A9FBD', 400: '#5B7499',
          500: '#3A557D', 600: '#1E3A63', 700: '#15304F', 800: '#0F2643', 900: '#0B1F3A', 950: '#07152A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,31,58,.04), 0 4px 16px -4px rgba(11,31,58,.08)',
        pop: '0 12px 40px -8px rgba(11,31,58,.25)',
        glow: '0 0 0 1px rgba(16,180,131,.25), 0 8px 30px -6px rgba(16,180,131,.45)',
      },
      keyframes: {
        naik: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        ayun: { '0%,100%': { transform: 'rotate(-4deg)' }, '50%': { transform: 'rotate(4deg)' } },
      },
      animation: { naik: 'naik .35s ease-out both', ayun: 'ayun 4s ease-in-out infinite' },
    },
  },
  plugins: [],
}
