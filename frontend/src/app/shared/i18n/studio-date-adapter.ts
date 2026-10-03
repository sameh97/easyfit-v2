import { Injectable, OnDestroy } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { DateFormatName, formatLocalDate } from './date-formats';

/** Display format names this adapter formats itself; anything else goes to Intl. */
const OWN_FORMATS: readonly DateFormatName[] = ['date', 'dateTime', 'longDay', 'shortDay'];

/** Typed day-first dates: 14/03/2027, 14.3.2027, 14-03-2027. */
const NUMERIC_DATE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

/**
 * Material DateAdapter for Studio date fields (redesign.md §7.4: one date picker).
 * Follows the UI language at runtime (Hebrew month and day names in the calendar),
 * shows dates as `d MMM y`, and reads what people type: day-first numbers or the shown format.
 * Provide it on Studio components only, so legacy datepickers keep the default adapter.
 */
@Injectable()
export class StudioDateAdapter extends NativeDateAdapter implements OnDestroy {
  private lang: Lang;
  private readonly subscription: Subscription;

  constructor(language: LanguageService, platform: Platform) {
    super(language.current, platform);
    this.lang = language.current;
    this.subscription = language.lang$.subscribe((lang: Lang) => {
      this.lang = lang;
      this.setLocale(lang);
    });
  }

  getFirstDayOfWeek(): number {
    return 0; // Sunday, as in Israel
  }

  format(date: Date, displayFormat: object | string): string {
    if (typeof displayFormat === 'string' && (OWN_FORMATS as readonly string[]).includes(displayFormat)) {
      return formatLocalDate(date, displayFormat as DateFormatName, this.lang);
    }
    return super.format(date, displayFormat as object);
  }

  parse(value: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value);
    }
    const text: string = value.trim();
    if (!text) {
      return null;
    }
    const numeric: RegExpMatchArray | null = text.match(NUMERIC_DATE);
    if (numeric) {
      return this.build(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
    }
    return this.parseNamedMonth(text) ?? this.invalid();
  }

  /** "14 Mar 2027", "14 March 2027", "14 במרץ 2027", "3 באוק׳ 2026". */
  private parseNamedMonth(text: string): Date | null {
    const parts: string[] = text.replace(/,/g, ' ').split(/\s+/);
    if (parts.length !== 3 || !/^\d{1,2}$/.test(parts[0]) || !/^\d{4}$/.test(parts[2])) {
      return null;
    }
    const month: number = this.findMonth(parts[1]);
    return month < 0 ? null : this.build(Number(parts[2]), month, Number(parts[0]));
  }

  private findMonth(word: string): number {
    const normalise = (name: string): string => name.toLowerCase().replace(/[.׳']/g, '').replace(/^ב/, '');
    const target: string = normalise(word);
    for (const style of ['long', 'short'] as const) {
      const names: string[] = this.getMonthNames(style).map(normalise);
      const index: number = names.indexOf(target);
      if (index >= 0) {
        return index;
      }
    }
    return -1;
  }

  /** Local midnight; rejects overflow such as 31/02. */
  private build(year: number, month: number, day: number): Date {
    const date: Date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : this.invalid();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

export const STUDIO_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'date' },
  display: {
    dateInput: 'date',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
