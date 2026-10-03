import { Component, Input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { DEFAULT_FIELD_MESSAGES, FieldMessages } from './field';

/** The translated message for a control's first error. Shown in place of the help text. */
@Component({
  selector: 'app-field-error',
  template: `
    <span *ngIf="messageKey" class="flex items-center gap-1 text-xs font-semibold text-danger">
      <app-icon name="alert-circle" [size]="13"></app-icon>
      {{ messageKey | translate: params }}
    </span>
  `,
  styles: [':host { display: block; }'],
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() messages: FieldMessages = {};

  private get firstError(): [string, unknown] | null {
    const errors: ValidationErrors | null = this.control?.errors ?? null;
    if (!errors) {
      return null;
    }
    const key: string | undefined = Object.keys(errors)[0];
    return key ? [key, errors[key]] : null;
  }

  get messageKey(): string | null {
    const error = this.firstError;
    if (!error) {
      return null;
    }
    return this.messages[error[0]] ?? DEFAULT_FIELD_MESSAGES[error[0]] ?? 'validation.invalid';
  }

  /** e.g. minlength → { requiredLength: 3 } */
  get params(): Record<string, unknown> {
    const detail: unknown = this.firstError?.[1];
    return typeof detail === 'object' && detail !== null ? (detail as Record<string, unknown>) : {};
  }
}
