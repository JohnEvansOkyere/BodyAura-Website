/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      screens: {
        'xs': '475px',     // Extra small devices
        'sm': '640px',     // Small devices (Tailwind default)
        'md': '768px',     // Medium devices (Tailwind default)
        'lg': '1024px',    // Large devices (Tailwind default)
        'xl': '1280px',    // Extra large devices (Tailwind default)
        '2xl': '1536px',   // 2X large devices (Tailwind default)
        // Custom breakpoints for specific needs
        'mobile-sm': { 'raw': '(max-width: 374px)' },  // Very small phones
        'mobile-lg': { 'raw': '(min-width: 375px) and (max-width: 639px)' },  // Large phones
        'tablet': { 'raw': '(min-width: 640px) and (max-width: 1023px)' },   // Tablets
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },  // Touch devices
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      minHeight: {
        'screen-ios': '-webkit-fill-available',
      },
    },
  },
  plugins: [],
}