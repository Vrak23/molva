import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "420px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        muted: "var(--muted)",
      },
      fontFamily: {
        mono: ["'Roboto Condensed'", "var(--font-roboto-condensed)", "sans-serif"],
        sans: ["'Roboto Condensed'", "var(--font-roboto-condensed)", "sans-serif"],
        serif: ["'Roboto Condensed'", "var(--font-roboto-condensed)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
