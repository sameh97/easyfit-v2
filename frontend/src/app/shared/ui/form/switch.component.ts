import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { newFieldId } from './field';
import { FIELD_HELP } from './field-shell';

/** On/off switch (role="switch") bound to a boolean control, with its label and help text beside it. */
@Component({
  selector: 'app-switch',
  template: `
    <div class="flex items-center justify-between gap-4 rounded-2xl bg-surface-subtle px-4 py-3">
      <span class="flex min-w-0 flex-col gap-0.5">
        <span [id]="id + '-label'" class="text-sm font-bold text-ink">{{ label }}</span>
        <span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span>
      </span>
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="on"
        [attr.aria-labelledby]="id + '-label'"
        [attr.aria-describedby]="help ? id + '-help' : null"
        [disabled]="control.disabled"
        (click)="toggle()"
        class="relative h-7 w-12 flex-shrink-0 rounded-full border-0 p-0 transition-colors duration-150"
        [ngClass]="on ? 'bg-accent' : 'bg-line-strong'"
      >
        <span
          class="absolute top-1 h-5 w-5 rounded-full bg-surface shadow-card transition-all duration-150"
          [ngClass]="on ? 'start-6' : 'start-1'"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class SwitchComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() help: string | null = null;

  readonly id: string = newFieldId('switch');
  readonly helpClass: string = FIELD_HELP;

  get on(): boolean {
    return this.control.value === true;
  }

  toggle(): void {
    this.control.setValue(!this.on);
    this.control.markAsDirty();
  }
}
