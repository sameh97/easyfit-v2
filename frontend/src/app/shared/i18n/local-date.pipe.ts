import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { DateFormatName, DateInput, formatLocalDate } from './date-formats';

/**
 * `{{ member.joinDate | localDate }}` → "14 Mar 2027" / "14 במרץ 2027".
 * The built-in `date` pipe is fixed to LOCALE_ID; this one follows the current language.
 * Impure, but memoised: it only re-formats when the value, format or language changes.
 */
@Pipe({
  name: 'localDate',
  pure: false,
})
export class LocalDatePipe implements PipeTransform, OnDestroy {
  private lang: Lang;
  private lastKey: string | null = null;
  private lastResult: string = '';
  private readonly subscription: Subscription;

  constructor(language: LanguageService) {
    this.lang = language.current;
    this.subscription = language.lang$.subscribe((lang: Lang) => (this.lang = lang));
  }

  transform(value: DateInput | null | undefined, format: DateFormatName = 'date'): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const key: string = `${value instanceof Date ? value.getTime() : value}|${format}|${this.lang}`;
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.lastResult = formatLocalDate(value, format, this.lang);
    }
    return this.lastResult;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
