import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        canvas: "#f5f7f3",
        moss: { 50: "#effbf3", 100: "#dcf6e5", 500: "#2f9b60", 600: "#237b4b", 700: "#1c623d" },
        sand: "#e9eee8"
      },
      boxShadow: { card: "0 1px 2px rgba(19,35,25,.04), 0 12px 32px rgba(31,55,39,.06)" },
      borderRadius: { xl: "1rem", "2xl": "1.35rem" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
};

export default config;
