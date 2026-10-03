import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { pluralForm } from './plural-form';

/** `{{ 'common.relative.inDays' | plural: days | translate: { count: days } }}` */
@Pipe({
  name: 'plural',
  pure: false,
})
export class PluralPipe implements PipeTransform, OnDestroy {
  private lang: Lang;
  private readonly subscription: Subscription;

  constructor(language: LanguageService) {
    this.lang = language.current;
    this.subscription = language.lang$.subscribe((lang: Lang) => (this.lang = lang));
  }

  transform(key: string, count: number): string {
    return `${key}.${pluralForm(count, this.lang)}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
