import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        k10: {
          primary: '#1a1a2e',
          secondary: '#16213e',
          accent: '#4f46e5',
          gold: '#f5a623',
          dark: '#0f0f23',
          light: '#f8f9ff',
          blue: '#4f46e5',
          green: '#10b981',
          red: '#ef4444',
          purple: '#7c3aed',
          violet: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
