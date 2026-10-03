import { Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeHe from '@angular/common/locales/he';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { DateFormatName, DateInput, formatLocalDate } from '../shared/i18n/date-formats';
import { pluralForm } from '../shared/i18n/plural-form';

/** Angular's built-in locale data covers `en`; Hebrew month and day names need `he`. */
registerLocaleData(localeHe, 'he');

export type Lang = 'en' | 'he';
export type TextDir = 'ltr' | 'rtl';

export const LANGUAGES: readonly Lang[] = ['en', 'he'];

/** How each language names itself in the switcher (never translated). */
export const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', he: 'עברית' };

const STORAGE_KEY = 'easyfit.lang';
const DEFAULT_LANG: Lang = 'en';

export type TranslateParams = Record<string, string | number>;

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'he';
}

/**
 * The UI language (redesign.md §7.8). Remembered in localStorage, English by default.
 * Switching sets `<html lang dir>` immediately and loads the translation file; no reload.
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly langSubject = new BehaviorSubject<Lang>(this.readStored());

  readonly lang$: Observable<Lang> = this.langSubject.pipe(distinctUntilChanged());
  readonly dir$: Observable<TextDir> = this.lang$.pipe(map((lang: Lang) => dirOf(lang)));

  constructor(private translate: TranslateService) {}

  get current(): Lang {
    return this.langSubject.value;
  }

  get dir(): TextDir {
    return dirOf(this.current);
  }

  /** Translate in TypeScript code. Templates use the `translate` pipe instead. */
  t(key: string, params?: TranslateParams): string {
    return String(this.translate.instant(key, params));
  }

  /** Counted string: picks `key.one|two|other` and passes `count` along. */
  tCount(key: string, count: number, params: TranslateParams = {}): string {
    return this.t(`${key}.${pluralForm(count, this.current)}`, { ...params, count });
  }

  date(value: DateInput, format: DateFormatName = 'date'): string {
    return formatLocalDate(value, format, this.current);
  }

  /** Runs before the first render (APP_INITIALIZER) so nothing flashes in the wrong language. */
  init(): Promise<void> {
    this.translate.setDefaultLang(DEFAULT_LANG);
    return this.apply(this.current);
  }

  use(lang: Lang): Promise<void> {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage can be unavailable (private mode); the choice just won't persist.
    }
    return this.apply(lang);
  }

  private apply(lang: Lang): Promise<void> {
    const html: HTMLElement = document.documentElement;
    html.lang = lang;
    html.dir = dirOf(lang);
    return new Promise<void>((resolve: () => void) => {
      // Emit after the strings are in, so instant() calls made on change see the new language.
      this.translate.use(lang).subscribe({
        complete: () => {
          this.langSubject.next(lang);
          resolve();
        },
        error: () => {
          this.langSubject.next(lang);
          resolve();
        },
      });
    });
  }

  private readStored(): Lang {
    try {
      const stored: string | null = window.localStorage.getItem(STORAGE_KEY);
      return isLang(stored) ? stored : DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  }
}

export function dirOf(lang: Lang): TextDir {
  return lang === 'he' ? 'rtl' : 'ltr';
}
