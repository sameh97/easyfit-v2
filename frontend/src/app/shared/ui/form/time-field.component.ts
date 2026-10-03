import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_BOX, FIELD_BOX_ERROR, FIELD_BOX_OK, FIELD_HELP, FIELD_INPUT, FIELD_LABEL } from './field-shell';

const TIME_PATTERN: RegExp = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Suggestions in the list: every 30 minutes. */
const STEP_MINUTES: number = 30;

/** `timeFormat` unless the value is a 24-hour "HH:mm" (empty is left to `required`). */
export function timeValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'string' && TIME_PATTERN.test(value) ? null : { timeFormat: true };
}

/** "9" → "09:00", "930" → "09:30", "17.5" → "17:05", "7:3" → "07:03". Unreadable input is returned as typed. */
export function normalizeTime(raw: string): string {
  const text: string = raw.trim();
  let hours: string;
  let minutes: string;
  const separated: RegExpMatchArray | null = text.match(/^(\d{1,2})\s*[:.]\s*(\d{1,2})$/);
  if (separated) {
    [hours, minutes] = [separated[1], separated[2]];
  } else if (/^\d{1,2}$/.test(text)) {
    [hours, minutes] = [text, '0'];
  } else if (/^\d{3,4}$/.test(text)) {
    [hours, minutes] = [text.slice(0, text.length - 2), text.slice(-2)];
  } else {
    return text;
  }
  const normalized: string = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  return TIME_PATTERN.test(normalized) ? normalized : text;
}

/** Hours and minutes of a Date as "HH:mm". */
export function timeOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** A local Date on `day` at "HH:mm", or null when either part is missing or invalid. */
export function combineDateAndTime(day: Date | null, time: string | null): Date | null {
  if (!day || !time || !TIME_PATTERN.test(time)) {
    return null;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
}

const SUGGESTIONS: readonly string[] = Array.from({ length: (24 * 60) / STEP_MINUTES }, (_unused: unknown, i: number) =>
  timeOf(new Date(2000, 0, 1, 0, i * STEP_MINUTES))
);

/**
 * 24-hour time input (§5.4): typed ("1730", "17.30" and "17:30" all become 17:30 on blur) or picked
 * from a list of half hours. Always left to right. The control holds "HH:mm" or ''.
 * Pair it with `timeValidator` so malformed input shows `validation.timeFormat`.
 */
@Component({
  selector: 'app-time-field',
  template: `
    <div class="flex flex-col gap-1.5" (focusout)="onFocusOut($event)">
      <label [for]="id" [class]="labelClass">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></label>
      <div class="relative">
        <div [class]="boxClass">
          <input
            #input
            [id]="id"
            type="text"
            inputmode="numeric"
            dir="ltr"
            autocomplete="off"
            placeholder="HH:MM"
            role="combobox"
            aria-autocomplete="none"
            [attr.aria-expanded]="open"
            [attr.aria-controls]="id + '-list'"
            [attr.aria-activedescendant]="open && active >= 0 ? id + '-opt-' + active : null"
            [formControl]="control"
            [attr.aria-required]="required ? 'true' : null"
            [attr.aria-invalid]="invalid ? 'true' : null"
            [attr.aria-describedby]="invalid ? id + '-error' : help ? id + '-help' : null"
            [class]="inputClass"
            (blur)="normalize()"
            (keydown)="onKeydown($event)"
          />
          <button
            type="button"
            tabindex="-1"
            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink-3 hover:bg-surface-muted hover:text-ink"
            [attr.aria-label]="'common.form.pickTime' | translate"
            (click)="toggle()"
          >
            <app-icon name="clock" [size]="17"></app-icon>
          </button>
        </div>
        <ul
          *ngIf="open"
          #list
          [id]="id + '-list'"
          role="listbox"
          [attr.aria-label]="label"
          dir="ltr"
          class="absolute start-0 top-full z-10 mb-0 mt-1.5 max-h-60 w-40 list-none overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-overlay"
        >
          <li
            *ngFor="let time of suggestions; let i = index"
            [id]="id + '-opt-' + i"
            role="option"
            [attr.aria-selected]="time === control.value"
            (mousedown)="$event.preventDefault()"
            (click)="pick(time)"
            class="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-ink"
            [ngClass]="i === active ? 'bg-accent-soft text-accent' : time === control.value ? 'bg-surface-subtle' : 'hover:bg-surface-subtle'"
          >
            {{ time }}
          </li>
        </ul>
      </div>
      <app-field-error *ngIf="invalid; else helpTpl" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      <ng-template #helpTpl><span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span></ng-template>
    </div>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class TimeFieldComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('time');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;
  readonly inputClass: string = `${FIELD_INPUT} rtl:text-end`;
  readonly suggestions: readonly string[] = SUGGESTIONS;
  open: boolean = false;
  active: number = -1;

  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;
  @ViewChild('list') private list?: ElementRef<HTMLUListElement>;

  constructor(private host: ElementRef<HTMLElement>) {}

  get invalid(): boolean {
    return showsError(this.control);
  }

  get boxClass(): string {
    return `${FIELD_BOX} pe-1.5 ps-4 ${this.invalid ? FIELD_BOX_ERROR : FIELD_BOX_OK}`;
  }

  normalize(): void {
    const value: unknown = this.control.value;
    if (typeof value === 'string' && value) {
      const normalized: string = normalizeTime(value);
      if (normalized !== value) {
        this.control.setValue(normalized);
      }
    }
  }

  toggle(): void {
    if (this.open) {
      this.close();
    } else {
      this.openList();
      this.input?.nativeElement.focus();
    }
  }

  pick(time: string): void {
    this.control.setValue(time);
    this.control.markAsDirty();
    this.close();
    this.input?.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open) {
        this.openList();
        return;
      }
      const step: number = event.key === 'ArrowDown' ? 1 : -1;
      this.active = (this.active + step + this.suggestions.length) % this.suggestions.length;
      this.scrollToActive();
    } else if (event.key === 'Enter' && this.open && this.active >= 0) {
      event.preventDefault();
      this.pick(this.suggestions[this.active]);
    } else if (event.key === 'Escape' && this.open) {
      // Close the list only, not the side panel around the field.
      event.stopPropagation();
      this.close();
    }
  }

  /** Counts as blurred once focus leaves the field and its list. */
  onFocusOut(event: FocusEvent): void {
    const next: EventTarget | null = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
      this.close();
      this.control.markAsTouched();
    }
  }

  private openList(): void {
    this.normalize();
    this.open = true;
    this.active = this.nearestSuggestion();
    setTimeout(() => this.scrollToActive());
  }

  private close(): void {
    this.open = false;
    this.active = -1;
  }

  /** The current value, or the half hour just before it, so the list opens where the user is. */
  private nearestSuggestion(): number {
    const value: unknown = this.control.value;
    if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
      return this.suggestions.indexOf('08:00');
    }
    const [hours, minutes] = value.split(':').map(Number);
    return Math.floor((hours * 60 + minutes) / STEP_MINUTES);
  }

  private scrollToActive(): void {
    const option: HTMLElement | null | undefined = this.list?.nativeElement.querySelector<HTMLElement>(`#${this.id}-opt-${this.active}`);
    option?.scrollIntoView({ block: 'nearest' });
  }
}
