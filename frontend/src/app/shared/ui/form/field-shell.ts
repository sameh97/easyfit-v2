/** Pill box shared by Studio inputs (46px, fully rounded, label above). */
export const FIELD_BOX =
  'flex h-[46px] items-center gap-2 rounded-full border border-solid bg-surface transition-colors duration-150';
/** Horizontal padding of the pill (the date field trims its end for the calendar button). */
export const FIELD_PAD = 'px-4';
export const FIELD_BOX_OK =
  'border-line-strong focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft';
export const FIELD_BOX_ERROR = 'border-danger ring-[3px] ring-danger-ring';
/** The bare input inside the box; the box draws the focus ring. */
export const FIELD_INPUT =
  'h-full min-w-0 flex-grow border-0 bg-transparent p-0 text-[15px] font-medium text-ink placeholder-ink-3 outline-none';
export const FIELD_LABEL = 'text-[13px] font-bold text-ink-2';
export const FIELD_HELP = 'text-xs text-ink-3';
