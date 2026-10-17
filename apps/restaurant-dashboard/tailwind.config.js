/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#134b36',
          container: '#2e634c',
          fixed: '#b6efd1',
          'fixed-dim': '#9bd3b6',
        },
        'on-primary': '#ffffff',
        'on-primary-fixed': '#002114',
        secondary: {
          DEFAULT: '#964915',
          container: '#fe9a60',
          fixed: '#ffdbca',
          'fixed-dim': '#ffb68e',
        },
        'on-secondary': '#ffffff',
        'on-secondary-fixed': '#331200',
        tertiary: {
          DEFAULT: '#194660',
          container: '#345e79',
          fixed: '#c8e6ff',
          'fixed-dim': '#a2cceb',
        },
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff5f0',
        'surface-container': '#e9efea',
        'surface-container-high': '#e4eae4',
        'surface-container-highest': '#dee4df',
        'on-surface': '#171d1a',
        'on-surface-variant': '#404943',
        background: '#f5fbf6',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        brand: {
          50: '#f0fdf4',
          500: '#134b36',
          600: '#0e3828',
          700: '#09261b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
