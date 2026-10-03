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
          bg: "#0e0f10",
          card: "#151618",
          subcard: "#1c1d20",
          elevated: "#24262a",
          border: "#26282b",
          "border-default": "#35383d",
          text: "#f2efe9",
          muted: "#a8a49c",
          dim: "#757169",
          accent: "#c88d48",
          "accent-hover": "#db9e56",
          "accent-subtle": "rgba(200, 141, 72, 0.12)",
        },
        accent: {
          DEFAULT: "#c88d48",
          hover: "#db9e56",
          subtle: "rgba(200, 141, 72, 0.12)",
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
