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
          primary: '#0d1b2a',
          secondary: '#1b263b',
          accent: '#2cb67d',
          gold: '#f5a623',
          dark: '#0a1628',
          light: '#f8fffe',
          blue: '#4361ee',
          green: '#2cb67d',
          red: '#e94560',
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
