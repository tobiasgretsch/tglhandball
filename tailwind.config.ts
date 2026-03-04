import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#da251c",
        "primary-light": "#e64752",
        accent: "#004f9f",
        background: "#F8F9FA",
        text: "#1A1A1A",
        muted: "#6B7280",
      },
    },
  },
  plugins: [],
};
export default config;
