import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IconName } from '../icon/icons';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_BOX, FIELD_BOX_ERROR, FIELD_BOX_OK, FIELD_PAD, FIELD_HELP, FIELD_INPUT, FIELD_LABEL } from './field-shell';

export type TextFieldType = 'text' | 'email' | 'tel' | 'password' | 'number';

/**
 * Studio text input: label above (red * when required), pill box, help text below that the
 * error replaces after blur or submit. Phone and email fields pass `ltr` (§7.8).
 */
@Component({
  selector: 'app-text-field',
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" [class]="labelClass">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></label>
      <div [class]="boxClass">
        <app-icon *ngIf="icon" [name]="icon" [size]="17" class="text-ink-3"></app-icon>
        <input
          [id]="id"
          [type]="type"
          [formControl]="control"
          [attr.name]="name"
          [attr.placeholder]="placeholder"
          [attr.autocomplete]="autocomplete"
          [attr.inputmode]="inputmode"
          [attr.dir]="ltr ? 'ltr' : null"
          [attr.aria-required]="required ? 'true' : null"
          [attr.aria-invalid]="invalid ? 'true' : null"
          [attr.aria-describedby]="describedBy"
          [class]="inputClass"
        />
      </div>
      <app-field-error *ngIf="invalid; else helpTpl" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      <ng-template #helpTpl><span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span></ng-template>
    </div>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class TextFieldComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() type: TextFieldType = 'text';
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() name: string | null = null;
  @Input() autocomplete: string | null = null;
  @Input() inputmode: string | null = null;
  @Input() icon: IconName | null = null;
  /** Phone numbers, emails, codes: typed and shown left to right even in Hebrew. */
  @Input() ltr: boolean = false;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('text');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;

  get invalid(): boolean {
    return showsError(this.control);
  }

  get describedBy(): string | null {
    return this.invalid ? `${this.id}-error` : this.help ? `${this.id}-help` : null;
  }

  get boxClass(): string {
    return `${FIELD_BOX} ${FIELD_PAD} ${this.invalid ? FIELD_BOX_ERROR : FIELD_BOX_OK}`;
  }

  /** An LTR input in a Hebrew page still lines up with the other fields (right). */
  get inputClass(): string {
    return this.ltr ? `${FIELD_INPUT} rtl:text-end` : FIELD_INPUT;
  }
}
