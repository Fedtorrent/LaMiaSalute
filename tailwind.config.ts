import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./types.ts",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0057FF',
        secondary: '#4B96FF',
        accent: '#FF4B4B',
        background: '#F3F6F8',
        surface: '#FFFFFF',
        dark: {
          bg: '#111827',
          surface: '#1F2937',
          border: '#374151'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
} satisfies Config;
