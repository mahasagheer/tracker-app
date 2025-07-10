/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C6F36B', // main green
        dark: '#222B20',    // dark green/black
        light: '#EAFCD7',   // light green
        accent: '#F5F5F5',  // accent gray
        textblack: '#181818', // main heading text
      },
    },
  },
  plugins: [],
}
