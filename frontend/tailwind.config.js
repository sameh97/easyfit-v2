// "Studio" design tokens (redesign.md §7.2).
// The accent lives in ONE place: change ACCENT/ACCENT_SOFT to re-theme the app.
const ACCENT = '#2F4BF0';
const ACCENT_SOFT = '#E2E6FD';

// Logical-direction utilities (ms-, pe-, start-, text-start, border-s, rounded-e…) are built into
// Tailwind 3.3+; Studio code uses only these for horizontal direction (redesign.md §7.10, Phase 2).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
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
          row: '#FFF8EB',
        },
        // bg/text = the "danger-soft" pill (Expired), §5.2
        danger: { DEFAULT: '#B4351F', dot: '#D9362B', bg: '#FBE4DF', text: '#A6321D', ring: 'rgba(180,53,31,0.12)' },
        neutral: { DEFAULT: '#55585F', bg: '#ECEBE6', dot: '#C9C6BD' },
      },
      fontFamily: {
        // Plus Jakarta Sans has no Hebrew letters; Rubik covers them (§7.8).
        sans: ['"Plus Jakarta Sans"', 'Rubik', 'system-ui', 'sans-serif'],
      },
      // Preflight gives every element this border colour, so `border` alone draws a Studio line.
      borderColor: (theme) => ({ DEFAULT: theme('colors.line.DEFAULT') }),
      borderRadius: {
        tile: '12px',
        card: '20px',
        panel: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,28,32,.05), 0 6px 20px rgba(27,28,32,.05)',
        overlay: '0 20px 50px rgba(27,28,32,.16)',
      },
      // Negative heading tracking is set to 0 in Hebrew through these variables (styles.css).
      letterSpacing: {
        title: 'var(--ef-tracking-title)',
        card: 'var(--ef-tracking-card)',
        kpi: 'var(--ef-tracking-kpi)',
        logo: '-0.8px',
        label: '1.4px',
      },
    },
  },
};
