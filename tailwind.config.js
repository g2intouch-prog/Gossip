/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        gossip: {
          dark: '#0a0516',
          panel: '#130d22',
          border: '#2c1e4c',
          purple: '#8b5cf6',
          pink: '#ec4899',
          amber: '#f59e0b',
          glow: 'rgba(139, 92, 246, 0.15)',
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
