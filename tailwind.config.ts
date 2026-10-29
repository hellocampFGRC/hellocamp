import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        solar: "#F59E0B",
        vivo: "#2563EB",
        natureza: "#16A34A",
        coral: "#F43F5E",
        offwhite: "#F8FAFC",
        base: "#0F172A",
      },
      borderRadius: {
        '4xl': '2rem', // Para os blocos modulares super arredondados do novo design
        '5xl': '3rem',
      }
    },
  },
  plugins: [],
};
export default config;