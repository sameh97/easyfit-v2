import { formatDate } from '@angular/common';
import { Lang } from 'src/app/services/language.service';

/** Named date formats used by Studio pages (redesign.md §7.8: `d MMM y`, 24h times). */
export type DateFormatName =
  | 'date' // 14 Mar 2027 · 14 במרץ 2027
  | 'time' // 17:30
  | 'dateTime' // 14 Mar 2027, 17:30
  | 'longDay' // Wednesday, 30 September
  | 'shortDay' // Wed, 30 Sep
  | 'monthShort' // Mar
  | 'monthLong'; // March

/** Hebrew puts ב before the month name, as in CLDR's own `d בMMM y`. */
const PATTERNS: Record<Lang, Record<DateFormatName, string>> = {
  en: {
    date: 'd MMM y',
    time: 'HH:mm',
    dateTime: 'd MMM y, HH:mm',
    longDay: 'EEEE, d MMMM',
    shortDay: 'EEE, d MMM',
    monthShort: 'MMM',
    monthLong: 'MMMM',
  },
  he: {
    date: 'd בMMM y',
    time: 'HH:mm',
    dateTime: 'd בMMM y, HH:mm',
    longDay: 'EEEE, d בMMMM',
    shortDay: 'EEE, d בMMM',
    monthShort: 'MMM',
    monthLong: 'MMMM',
  },
};

export type DateInput = Date | string | number;

/** Formats with the given language's month and day names (Gregorian calendar, Western digits). */
export function formatLocalDate(value: DateInput, format: DateFormatName, lang: Lang): string {
  return formatDate(value, PATTERNS[lang][format], lang);
}
