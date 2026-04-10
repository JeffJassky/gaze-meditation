/** @type {import('tailwindcss').Config} */

// Helper: produces a Tailwind color value that reads RGB channels from a
// CSS custom property and supports opacity modifiers (bg-surface/80 etc).
const rgb = (varName) => `rgb(var(--${varName}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./src-new/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Semantic surface/background tokens
        surface: {
          DEFAULT: rgb('surface-rgb'),
          secondary: rgb('surface-secondary-rgb'),
          tertiary: rgb('surface-tertiary-rgb'),
        },
        // Semantic text tokens
        content: {
          DEFAULT: rgb('text-primary-rgb'),
          secondary: rgb('text-secondary-rgb'),
          tertiary: rgb('text-tertiary-rgb'),
        },
        // Semantic border tokens
        edge: {
          DEFAULT: rgb('edge-rgb'),
          secondary: rgb('edge-secondary-rgb'),
        },
        // Accent (interactive highlights, CTAs)
        accent: {
          DEFAULT: rgb('accent-rgb'),
          muted: rgb('accent-muted-rgb'),
          text: rgb('accent-text-rgb'),
        },
        // Brand
        brand: {
          DEFAULT: rgb('brand-rgb'),
          dark: rgb('brand-dark-rgb'),
        },
        // Status semantics
        success: {
          DEFAULT: rgb('success-rgb'),
        },
        danger: {
          DEFAULT: rgb('danger-rgb'),
        },
        warning: {
          DEFAULT: rgb('warning-rgb'),
        },
        info: {
          DEFAULT: rgb('info-rgb'),
        },
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-small)',
        'theme-lg': 'var(--shadow-large)',
      },
    },
  },
  plugins: [],
}
