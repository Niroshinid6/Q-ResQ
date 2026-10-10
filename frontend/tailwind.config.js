/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          p1: '#dc2626',   // Red — Critical
          p2: '#f97316',   // Orange — Serious
          p3: '#16a34a',   // Green — Non-urgent
        },
      },
    },
  },
  plugins: [],
}
