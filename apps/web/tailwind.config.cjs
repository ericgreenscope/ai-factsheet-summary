/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Greenscope-inspired green palette
        'greenscope': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Modern neutral palette
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Accent colors for different states
        'success': {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          900: '#14532d',
        },
        'warning': {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          900: '#92400e',
        },
        'error': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          900: '#7f1d1d',
        },
        'info': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 50px -10px rgba(0, 0, 0, 0.1)',
        'greenscope': '0 4px 25px rgba(34, 197, 94, 0.15)',
      },
      backgroundImage: {
        'gradient-greenscope': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        'gradient-card': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
      }
    },
  },
  plugins: [],
}

