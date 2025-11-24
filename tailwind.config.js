/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1.5rem",
        screens: {
          "2xl": "1200px",
        },
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      colors: {
        background: "hsl(222 47% 8%)",
        foreground: "hsl(210 40% 98%)",
        card: "hsl(222 47% 11%)",
        "card-foreground": "hsl(210 40% 98%)",
        muted: "hsl(215 20% 20%)",
        "muted-foreground": "hsl(215 20% 80%)",
        primary: "hsl(221 83% 53%)",
        "primary-foreground": "hsl(210 40% 98%)",
        accent: "hsl(267 83% 60%)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
