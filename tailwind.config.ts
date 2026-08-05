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
          blue: '#1A56FF',
          purple: '#6C47FF',
          'purple-light': '#EEF0FF',
          surface: '#F5F7FA',
          dark: '#1A1A2E',
          gray: '#6B7280',
          border: '#E5E7EB',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
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
      },
    },
  },
  plugins: [],
}
export default config
