/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#0B0F17',
          card: '#131B2A',
          border: '#1E293B',
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          green: '#10B981',
          blue: '#3B82F6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'spin 4s linear infinite',
      },
    },
  },
  plugins: [],
}
