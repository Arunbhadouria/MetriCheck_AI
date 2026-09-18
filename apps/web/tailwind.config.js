import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#071525',
          900: '#0B1F3A',
          800: '#162E52',
          700: '#1E3A8A'
        },
        saffron: {
          DEFAULT: '#FF9933',
          deep: '#C2410C'
        },
        indiaGreen: {
          DEFAULT: '#138808'
        },
        brandOrange: {
          DEFAULT: '#C2410C',
          hover: '#9A3412',
          light: '#FFF7ED'
        }
      },
      boxShadow: {
        gov: '0 1px 2px rgba(11, 31, 58, 0.06), 0 8px 24px rgba(11, 31, 58, 0.06)',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#c2410c",
          "primary-content": "#ffffff",
          "secondary": "#0f766e",
          "accent": "#1d4ed8",
          "neutral": "#0b1f3a",
          "base-100": "#ffffff",
          "base-200": "#f4f6f8",
          "base-300": "#e5eaf0",
          "base-content": "#0f172a",
          "info": "#0369a1",
          "success": "#15803d",
          "warning": "#c2410c",
          "error": "#b91c1c",
        },
        dark: {
          "primary": "#f59e0b",
          "primary-content": "#0f172a",
          "secondary": "#10b981",
          "accent": "#6366f1",
          "neutral": "#1e293b",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#f8fafc",
          "info": "#38bdf8",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        }
      }
    ],
    darkTheme: "dark",
  },
}
