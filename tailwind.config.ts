import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single, consistent accent — a calm, academic indigo.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.15rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,23,28,0.04), 0 4px 16px rgba(23,23,28,0.05)",
        lift: "0 2px 4px rgba(23,23,28,0.04), 0 12px 32px rgba(23,23,28,0.09)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseline: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-in-fast": "fade-in-fast 0.25s ease-out both",
        pulseline: "pulseline 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
