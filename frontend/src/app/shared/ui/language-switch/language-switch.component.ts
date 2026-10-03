import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Lang, LANGUAGES, LANGUAGE_NAMES, LanguageService } from 'src/app/services/language.service';

/** "English / עברית" pill (§7.8). Each name is shown in its own language. */
@Component({
  selector: 'app-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3" [ngClass]="labelled ? 'studio w-full px-4 pb-2 pt-3' : ''">
    <span *ngIf="labelled" class="text-sm font-bold text-ink-2" aria-hidden="true">{{ 'common.language.label' | translate }}</span>
    <div role="group" [attr.aria-label]="'common.language.label' | translate" class="inline-flex gap-0.5 rounded-full bg-surface-muted p-1">
      <button
        *ngFor="let option of languages"
        type="button"
        [attr.lang]="option"
        [attr.aria-pressed]="option === (lang$ | async)"
        (click)="language.use(option)"
        class="h-9 rounded-full border-0 px-3.5 text-[13px] transition-colors"
        [ngClass]="option === (lang$ | async) ? 'bg-surface font-bold text-ink shadow-card' : 'bg-transparent font-semibold text-ink-3 hover:text-ink'"
      >
        {{ names[option] }}
      </button>
    </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class LanguageSwitchComponent {
  /** Adds a "Language" label and Studio base styles, for use inside legacy pages (Profile). */
  @Input() labelled: boolean = false;

  readonly languages: readonly Lang[] = LANGUAGES;
  readonly names: Record<Lang, string> = LANGUAGE_NAMES;
  readonly lang$: Observable<Lang> = this.language.lang$;

  constructor(public language: LanguageService) {}
}
