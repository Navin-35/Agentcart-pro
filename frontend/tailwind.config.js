/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        card: '#ffffff',
        'card-inner': '#f1f5f9',
        razorpay: {
          50: '#f0f6fe',
          100: '#ebf3ff',
          200: '#d5e6fe',
          300: '#afd2fc',
          400: '#7eb5fa',
          500: '#528ff0',
          blue: '#0c83ff',
          600: '#0c83ff',
          700: '#0062d2',
          800: '#0052b0',
          900: '#0c2340',
          dark: '#02042b',
          navy: '#0b192c',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'rzp': '0 4px 20px -2px rgba(12, 131, 255, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'rzp-card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'rzp-hover': '0 10px 25px -5px rgba(12, 131, 255, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'rzp-modal': '0 25px 50px -12px rgba(12, 35, 64, 0.25)',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(12, 131, 255, 0.3)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 5px rgba(12, 131, 255, 0.1)' },
        }
      }
    },
  },
  plugins: [],
}
