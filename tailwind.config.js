/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1D9E75',
        'primary-light': '#9FE1CB',
        'primary-lighter': '#E1F5EE',
        'primary-bg': '#f0fdf8',
        'primary-dark': '#065F46',
      },
    },
  },
  plugins: [],
}
