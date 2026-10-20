/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        primary: {
          DEFAULT: '#ab2f00',
          container: '#d53e02',
          fixed: '#ffdbd1',
          'fixed-dim': '#ffb59f',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#fffbff',
        surface: {
          DEFAULT: '#f7f9ff',
          bright: '#f7f9ff',
          dim: '#d5dae4',
          container: '#e9eef8',
          'container-low': '#eef4fe',
          'container-high': '#e3e8f2',
          'container-highest': '#dde3ec',
          'container-lowest': '#ffffff',
          variant: '#dde3ec',
          tint: '#af3100',
        },
        'on-surface': '#161c23',
        'on-surface-variant': '#5b4139',
        secondary: {
          DEFAULT: '#006c49',
          container: '#6cf8bb',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#00714d',
        tertiary: {
          DEFAULT: '#a73400',
          container: '#cd4811',
          fixed: '#ffdbd0',
          'fixed-dim': '#ffb59d',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'on-tertiary-fixed': '#390c00',
        'on-background': '#161c23',
        outline: {
          DEFAULT: '#8f7067',
          variant: '#e4beb4',
        },
      },
    },
  },
  plugins: [],
};
