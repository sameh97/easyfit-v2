// "Studio" design tokens (redesign.md §7.2).
// The accent lives in ONE place: change ACCENT/ACCENT_SOFT to re-theme the app.
const ACCENT = '#2F4BF0';
const ACCENT_SOFT = '#E2E6FD';

/**
 * Logical-direction utilities (redesign.md §7.10, Phase 2 step 1).
 * Tailwind 2 has no ms-/ps-/start- utilities, so this plugin builds them from the
 * theme scales with CSS logical properties. They follow `dir`, so one template works
 * in English (LTR) and Hebrew (RTL). Studio code must use these, never ml-/pl-/left-…
 *
 * @param {{
 *   matchUtilities: (utilities: Record<string, (value: string) => Record<string, string>>, options: { values: Record<string, string> }) => void,
 *   addUtilities: (utilities: Record<string, Record<string, string>>) => void,
 *   theme: (path: string) => Record<string, string>,
 * }} api
 */
function logicalUtilities({ matchUtilities, addUtilities, theme }) {
  /** @param {string} property */
  const one = (property) => (value) => ({ [property]: value });
  /** @param {string[]} properties */
  const many = (properties) => (value) => Object.fromEntries(properties.map((property) => [property, value]));

  matchUtilities(
    { ms: one('margin-inline-start'), me: one('margin-inline-end') },
    { values: theme('margin') }
  );
  matchUtilities(
    { ps: one('padding-inline-start'), pe: one('padding-inline-end') },
    { values: theme('padding') }
  );
  matchUtilities(
    { start: one('inset-inline-start'), end: one('inset-inline-end') },
    { values: theme('inset') }
  );
  matchUtilities(
    {
      'rounded-s': many(['border-start-start-radius', 'border-end-start-radius']),
      'rounded-e': many(['border-start-end-radius', 'border-end-end-radius']),
    },
    { values: theme('borderRadius') }
  );

  /** @type {Record<string, Record<string, string>>} */
  const fixed = {
    '.text-start': { 'text-align': 'start' },
    '.text-end': { 'text-align': 'end' },
  };
  for (const [key, width] of Object.entries(theme('borderWidth'))) {
    const suffix = key === 'DEFAULT' ? '' : `-${key}`;
    fixed[`.border-s${suffix}`] = { 'border-inline-start-width': width };
    fixed[`.border-e${suffix}`] = { 'border-inline-end-width': width };
  }
  addUtilities(fixed);
}

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
    './src/app/components/members-components/**/*.{html,ts}',
    './src/app/components/trainers-components/**/*.{html,ts}',
    './src/app/components/classes/**/*.{html,ts}',
    './src/app/components/machines/**/*.{html,ts}',
    './src/app/components/maintenance/**/*.{html,ts}',
    './src/app/components/products/**/*.{html,ts}',
    './src/app/components/catalogs/**/*.{html,ts}',
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
  corePlugins: {
    // Existing pages still rely on Bootstrap's reboot and Angular Material's
    // base styles; Tailwind's preflight would override them.
    preflight: false,
  },
  plugins: [logicalUtilities],
};
