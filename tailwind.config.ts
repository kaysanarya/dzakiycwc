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
        studio: {
          bg: "#09090b",
          card: "#121215",
          subcard: "#18181b",
          elevated: "#222226",
          border: "#27272a",
          "border-default": "#3f3f46",
          text: "#ffffff",
          muted: "#a1a1aa",
          dim: "#71717a",
          accent: "#ffffff",
          "accent-hover": "#ffffff",
          "accent-subtle": "rgba(255, 255, 255, 0.1)",
        },
        accent: {
          DEFAULT: "#ffffff",
          hover: "#ffffff",
          subtle: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "-apple-system", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        studio: "0 1px 3px rgba(0,0,0,0.4)",
        "studio-float": "0 8px 24px rgba(0,0,0,0.6)",
      },
      transitionTimingFunction: {
        studio: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
