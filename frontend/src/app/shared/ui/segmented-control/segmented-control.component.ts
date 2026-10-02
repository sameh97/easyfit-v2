import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
}

/**
 * Pill-shaped segmented control (radio group semantics).
 * Arrow keys move between options, as with native radios.
 */
@Component({
  selector: 'app-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="radiogroup"
      [attr.aria-label]="label"
      class="inline-flex gap-0.5 rounded-full bg-surface-muted p-1"
      (keydown)="onKeydown($event)"
    >
      <button
        #segment
        *ngFor="let option of options; let i = index"
        type="button"
        role="radio"
        [attr.aria-checked]="option.value === value"
        [attr.tabindex]="option.value === value ? 0 : -1"
        (click)="select(option.value)"
        class="whitespace-nowrap rounded-full border-0 px-3.5 py-1.5 text-[13px] leading-tight transition-colors duration-150"
        [ngClass]="
          option.value === value
            ? 'bg-surface font-bold text-ink shadow-card'
            : 'bg-transparent font-semibold text-ink-3 hover:text-ink'
        "
      >
        {{ option.label }}
      </button>
    </div>
  `,
  styles: [':host { display: inline-flex; max-width: 100%; overflow-x: auto; }'],
})
export class SegmentedControlComponent {
  @Input() options: SegmentOption[] = [];
  @Input() value: string = '';
  @Input() label: string = '';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  @ViewChildren('segment') private segments!: QueryList<ElementRef<HTMLButtonElement>>;

  select(value: string): void {
    if (value !== this.value) {
      this.value = value;
      this.valueChange.emit(value);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const step: number | undefined = keys[event.key];
    if (step === undefined || this.options.length === 0) {
      return;
    }
    event.preventDefault();
    const current: number = this.options.findIndex((option: SegmentOption) => option.value === this.value);
    const next: number = (current + step + this.options.length) % this.options.length;
    this.select(this.options[next].value);
    this.segments.toArray()[next]?.nativeElement.focus();
  }
}
