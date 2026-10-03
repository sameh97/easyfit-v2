import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_HELP, FIELD_LABEL } from './field-shell';

/** Multi-line Studio input (rounded box instead of a pill). */
@Component({
  selector: 'app-text-area',
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" [class]="labelClass">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></label>
      <textarea
        [id]="id"
        [rows]="rows"
        [formControl]="control"
        [attr.placeholder]="placeholder"
        [attr.aria-required]="required ? 'true' : null"
        [attr.aria-invalid]="invalid ? 'true' : null"
        [attr.aria-describedby]="invalid ? id + '-error' : help ? id + '-help' : null"
        class="block w-full resize-y rounded-[20px] border border-solid bg-surface px-4 py-3 text-[15px] font-medium text-ink placeholder-ink-3 outline-none transition-colors"
        [ngClass]="invalid ? 'border-danger ring-[3px] ring-danger-ring' : 'border-line-strong focus:border-accent focus:ring-[3px] focus:ring-accent-soft'"
      ></textarea>
      <app-field-error *ngIf="invalid; else helpTpl" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      <ng-template #helpTpl><span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span></ng-template>
    </div>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class TextAreaComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() rows: number = 3;
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('textarea');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;

  get invalid(): boolean {
    return showsError(this.control);
  }
}
