/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090b10',
          900: '#0f131c',
          850: '#151b27',
          800: '#1b2234',
          700: '#273248',
          600: '#384766',
        },
        brand: {
          50: '#f0f7ff',
          500: '#0066ff',
          600: '#0052cc',
          400: '#3385ff',
          accent: '#00f2fe',
        },
        method: {
          get: '#10b981',
          post: '#f59e0b',
          put: '#3b82f6',
          delete: '#ef4444',
          patch: '#8b5cf6',
          options: '#06b6d4',
          head: '#ec4899',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
