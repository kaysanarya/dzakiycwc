import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-navy":   "#03195b",
        "royal-blue":  "#0b2cb1",
        "vivid-blue":  "#1951fc",
        "bright-blue": "#3781fc",
        "ice-blue":    "#cbe9fd",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      animation: {
        "liquid-float": "liquidFloat 9s ease-in-out infinite",
        "luxury-shimmer": "luxuryShimmer 4s infinite",
        "orb-drift": "orbDrift 22s ease-in-out infinite",
      },
      keyframes: {
        liquidFloat: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%":      { transform: "translateY(-10px) scale(1.015)" },
        },
        luxuryShimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        orbDrift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.6" },
          "33%":      { transform: "translate(20px, -30px) scale(1.08)", opacity: "0.8" },
          "66%":      { transform: "translate(-15px, 15px) scale(0.94)", opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
