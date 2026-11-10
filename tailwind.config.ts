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
          blue: '#42A5F5',
          purple: '#8B7CF6',
          'purple-light': '#EEF2FF',
          surface: '#F0F2F5',
          dark: '#212121',
          gray: '#757575',
          border: '#E6E8EC',
          green: '#66BB6A',
          amber: '#F59E0B',
          red: '#EF5350',
        },
        k10: {
          primary: '#1A1A2E',
          secondary: '#6C47FF',
          accent: '#1A56FF',
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
        'lift': '0 12px 32px rgba(66, 165, 245, 0.18)',
        'card': '0 4px 20px rgba(33, 33, 33, 0.07)',
      },
    },
  },
  plugins: [],
}
export default config
