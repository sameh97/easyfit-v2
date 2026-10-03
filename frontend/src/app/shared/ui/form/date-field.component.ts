import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Directionality } from '@angular/cdk/bidi';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { LanguageDirectionality } from 'src/app/shared/i18n/language-directionality';
import { StudioDateAdapter, STUDIO_DATE_FORMATS } from 'src/app/shared/i18n/studio-date-adapter';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_BOX, FIELD_BOX_ERROR, FIELD_BOX_OK, FIELD_HELP, FIELD_INPUT, FIELD_LABEL } from './field-shell';

/**
 * The one Studio date picker (§7.4): the Material datepicker in a pill with a calendar button
 * at the inline end. Shows `d MMM y` in the UI language (Hebrew month and day names) and reads
 * typed day-first dates (14/03/2027). The control holds a local-midnight Date (or null).
 */
@Component({
  selector: 'app-date-field',
  providers: [
    { provide: DateAdapter, useClass: StudioDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: STUDIO_DATE_FORMATS },
    { provide: Directionality, useClass: LanguageDirectionality },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="id" [class]="labelClass">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></label>
      <div [class]="boxClass">
        <input
          [id]="id"
          [formControl]="control"
          [matDatepicker]="picker"
          [min]="min"
          [max]="max"
          autocomplete="off"
          [attr.placeholder]="'common.form.datePlaceholder' | translate"
          [attr.aria-required]="required ? 'true' : null"
          [attr.aria-invalid]="invalid ? 'true' : null"
          [attr.aria-describedby]="invalid ? id + '-error' : help ? id + '-help' : null"
          [class]="inputClass"
        />
        <button
          type="button"
          class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink-3 hover:bg-surface-muted hover:text-ink"
          [attr.aria-label]="'common.form.openCalendar' | translate"
          (click)="picker.open()"
        >
          <app-icon name="calendar" [size]="17"></app-icon>
        </button>
        <mat-datepicker #picker panelClass="studio-datepicker" (closed)="control.markAsTouched()"></mat-datepicker>
      </div>
      <app-field-error *ngIf="invalid; else helpTpl" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      <ng-template #helpTpl><span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span></ng-template>
    </div>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class DateFieldComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() min: Date | null = null;
  @Input() max: Date | null = null;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('date');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;
  readonly inputClass: string = FIELD_INPUT;

  get invalid(): boolean {
    return showsError(this.control);
  }

  get boxClass(): string {
    return `${FIELD_BOX} pe-1.5 ps-4 ${this.invalid ? FIELD_BOX_ERROR : FIELD_BOX_OK}`;
  }
}
