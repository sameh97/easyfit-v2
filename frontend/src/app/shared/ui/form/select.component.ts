import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_BOX, FIELD_BOX_ERROR, FIELD_BOX_OK, FIELD_PAD, FIELD_HELP, FIELD_LABEL } from './field-shell';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

/** Native <select> in a Studio pill, with a chevron at the inline end. */
@Component({
    selector: 'app-select',
    template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" [class]="labelClass">{{ label }}@if (required) {
        <span class="text-danger" aria-hidden="true"> *</span>
      }</label>
      <div [class]="boxClass" class="relative">
        <select
          [id]="id"
          [formControl]="control"
          [attr.aria-required]="required ? 'true' : null"
          [attr.aria-invalid]="invalid ? 'true' : null"
          [attr.aria-describedby]="invalid ? id + '-error' : help ? id + '-help' : null"
          class="h-full min-w-0 flex-grow cursor-pointer appearance-none border-0 bg-transparent p-0 pe-6 text-[15px] font-medium text-ink outline-none"
          >
          @if (placeholder) {
            <option [ngValue]="null" disabled>{{ placeholder }}</option>
          }
          @for (option of options; track option) {
            <option [ngValue]="option.value">{{ option.label }}</option>
          }
        </select>
        <app-icon name="chevron-down" [size]="16" class="pointer-events-none absolute end-4 text-ink-3"></app-icon>
      </div>
      @if (invalid) {
        <app-field-error [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      } @else {
        @if (help) {
          <span [id]="id + '-help'" [class]="helpClass">{{ help }}</span>
        }
      }
    </div>
    `,
    styles: [':host { display: block; min-width: 0; }'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelectComponent {
  @Input() control!: UntypedFormControl;
  @Input() label: string = '';
  @Input() options: SelectOption[] = [];
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('select');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;

  get invalid(): boolean {
    return showsError(this.control);
  }

  get boxClass(): string {
    return `${FIELD_BOX} ${FIELD_PAD} ${this.invalid ? FIELD_BOX_ERROR : FIELD_BOX_OK}`;
  }
}
