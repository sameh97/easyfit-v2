import { Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_LABEL } from './field-shell';

export interface SegmentedFieldOption<T> {
  value: T;
  label: string;
}

/** A form control drawn as a segmented pill (radio group), e.g. gender. Arrow keys follow the reading direction. */
@Component({
  selector: 'app-segmented-field',
  template: `
    <div class="flex flex-col gap-1.5">
      <span [id]="id + '-label'" [class]="labelClass">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></span>
      <div
        role="radiogroup"
        [attr.aria-labelledby]="id + '-label'"
        [attr.aria-required]="required ? 'true' : null"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="invalid ? id + '-error' : null"
        [attr.tabindex]="control.value === null || control.value === '' ? 0 : -1"
        class="inline-flex gap-0.5 self-start rounded-full bg-surface-muted p-1"
        [ngClass]="invalid ? 'ring-[3px] ring-danger-ring' : ''"
        (keydown)="onKeydown($event)"
        (focusout)="onFocusOut($event)"
      >
        <button
          #segment
          *ngFor="let option of options"
          type="button"
          role="radio"
          [attr.aria-checked]="option.value === control.value"
          [attr.tabindex]="option.value === control.value ? 0 : -1"
          [disabled]="control.disabled"
          (click)="select(option.value)"
          class="whitespace-nowrap rounded-full border-0 px-[22px] py-[9px] text-sm transition-colors duration-150"
          [ngClass]="option.value === control.value ? 'bg-surface font-bold text-ink shadow-card' : 'bg-transparent font-semibold text-neutral hover:text-ink'"
        >
          {{ option.label }}
        </button>
      </div>
      <app-field-error *ngIf="invalid" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class SegmentedFieldComponent<T> {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() options: SegmentedFieldOption<T>[] = [];
  @Input() required: boolean = false;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('segmented');
  readonly labelClass: string = FIELD_LABEL;

  @ViewChildren('segment') private segments!: QueryList<ElementRef<HTMLButtonElement>>;

  constructor(private host: ElementRef<HTMLElement>) {}

  get invalid(): boolean {
    return showsError(this.control);
  }

  select(value: T): void {
    this.control.setValue(value);
    this.control.markAsDirty();
  }

  onKeydown(event: KeyboardEvent): void {
    const rtl: boolean = getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward: string = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward: string = rtl ? 'ArrowRight' : 'ArrowLeft';
    const steps: Record<string, number> = { [forward]: 1, ArrowDown: 1, [backward]: -1, ArrowUp: -1 };
    const step: number | undefined = steps[event.key];
    if (step === undefined || !this.options.length) {
      return;
    }
    event.preventDefault();
    const current: number = this.options.findIndex((option: SegmentedFieldOption<T>) => option.value === this.control.value);
    const next: number = current < 0 ? 0 : (current + step + this.options.length) % this.options.length;
    this.select(this.options[next].value);
    setTimeout(() => this.segments.toArray()[next]?.nativeElement.focus());
  }

  /** Counts as blurred once focus leaves the whole group. */
  onFocusOut(event: FocusEvent): void {
    const next: EventTarget | null = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
      this.control.markAsTouched();
    }
  }
}
