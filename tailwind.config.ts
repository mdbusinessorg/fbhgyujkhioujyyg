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
        ms: {
          blue: '#BC181C',
          purple: '#ECA61B',
          'purple-light': '#FFF0F0',
          surface: '#F5F7FA',
          dark: '#101010',
          gray: '#6B7280',
          border: '#E5E7EB',
          green: '#10B981',
          amber: '#ECA61B',
          red: '#EF4444',
        },
        k10: {
          primary: '#101010',
          secondary: '#ECA61B',
          accent: '#BC181C',
          green: '#10B981',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'ios': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'ios-sm': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'ios-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
export default config
