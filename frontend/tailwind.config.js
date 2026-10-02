// "Studio" design tokens (redesign.md §7.2).
// The accent lives in ONE place: change ACCENT/ACCENT_SOFT to re-theme the app.
const ACCENT = '#2F4BF0';
const ACCENT_SOFT = '#E2E6FD';

module.exports = {
  mode: 'jit',
  // Utilities are generated ONLY from Studio code. Legacy templates use Bootstrap helpers
  // (p-3, mt-4, text-danger…) whose names collide with Tailwind's; scanning them would let
  // Tailwind restyle legacy pages. Add new Studio folders here as pages are redesigned.
  purge: [
    './src/app/shared/ui/**/*.{html,ts}',
    './src/app/components/nav/**/*.{html,ts}',
    './src/app/components/shell/**/*.{html,ts}',
    './src/app/components/home/**/*.{html,ts}',
    './src/app/components/login/**/*.{html,ts}',
  ],
  // Bootstrap 4 ships !important helpers with the same names (p-5 = 3rem, bg-white, text-warning…)
  // and body.mat-typography styles h1/h2/p at higher specificity than a utility. Making utilities
  // !important lets Studio markup win; it only affects classes generated from the paths above.
  important: true,
  darkMode: false,
  theme: {
    extend: {
      colors: {
        canvas: '#F5F4F0',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAF9F6',
          muted: '#F1F0EC',
          track: '#EFEEE9',
        },
        line: {
          DEFAULT: '#E7E5DF',
          soft: '#EFEEE9',
          strong: '#D9D6CE',
        },
        ink: {
          DEFAULT: '#1B1C20',
          2: '#44464C',
          3: '#6B6E76',
          4: '#8A8D94',
        },
        accent: {
          DEFAULT: ACCENT,
          soft: ACCENT_SOFT,
        },
        success: { DEFAULT: '#17693F', bg: '#E3F4EA' },
        warning: {
          DEFAULT: '#7A4F00',
          bg: '#FDEFD6',
          text: '#8A5A00',
          bar: '#E39A1C',
        },
        danger: { DEFAULT: '#B4351F', dot: '#D9362B' },
        neutral: { DEFAULT: '#55585F', bg: '#ECEBE6', dot: '#C9C6BD' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        tile: '12px',
        card: '20px',
        panel: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,28,32,.05), 0 6px 20px rgba(27,28,32,.05)',
        overlay: '0 20px 50px rgba(27,28,32,.16)',
      },
      letterSpacing: {
        title: '-1.2px',
        card: '-0.3px',
        kpi: '-1px',
        logo: '-0.8px',
        label: '1.4px',
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
