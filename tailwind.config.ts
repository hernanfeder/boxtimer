import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-navy": "#1E3A5F",
        "brand-green": "#166534",
        "brand-red": "#991B1B",
      },
    },
  },
  plugins: [],
};
export default config;
