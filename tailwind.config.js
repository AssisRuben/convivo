/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: "#0b1e3d",
        "navy-light": "#16305c",
        coral: "#e63946",
        "coral-light": "#ff5a67",
        mint: "#2ec4b6",
        "mint-light": "#7fe0d5",
        cream: "#fafaf7",
        card: "#ffffff",
      },
    },
  },
  plugins: [],
};
