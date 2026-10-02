const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{html,ts}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        brand: colors.lime,
        ink: colors.blueGray,
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
      },
    },
  },
  corePlugins: {
    // Existing pages still rely on Bootstrap's reboot and Angular Material's
    // base styles; Tailwind's preflight would override them.
    preflight: false,
  },
  plugins: [],
};
