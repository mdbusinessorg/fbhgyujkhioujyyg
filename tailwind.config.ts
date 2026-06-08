import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A74DA",
          50: "#EAF4FE",
          100: "#D5E9FD",
          200: "#AED3FB",
          300: "#7DB8F6",
          400: "#4895EE",
          500: "#0A74DA",
          600: "#085CAE",
          700: "#064583",
          800: "#042E57",
          900: "#02172C",
        },
        accent: {
          DEFAULT: "#00C48C",
          light: "#33D3A4",
          dark: "#009E70",
        },
        ink: "#1A1A2E",
        body: "#6B7280",
        surface: "#F0F8FF",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(10, 116, 218, 0.12)",
        card: "0 10px 40px -12px rgba(10, 116, 218, 0.25)",
        soft: "0 4px 24px rgba(26, 26, 46, 0.06)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #E8F4FD 0%, #C5E3F7 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
