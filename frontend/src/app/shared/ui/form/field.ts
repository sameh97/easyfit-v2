import { AbstractControl, FormGroup } from '@angular/forms';

/** Error key → translation key, to override the default message for one field. */
export type FieldMessages = Readonly<Record<string, string>>;

/** Default translation key per validator error (validators live in FormInputComponent). */
export const DEFAULT_FIELD_MESSAGES: FieldMessages = {
  required: 'validation.required',
  empty: 'validation.required',
  email: 'validation.email',
  minlength: 'validation.minlength',
  nameNotValid: 'validation.name',
  phoneNotValid: 'validation.phone',
  birthDayNotValid: 'validation.birthDayFuture',
  ageUnder: 'validation.ageUnder',
  dateNotValid: 'validation.dateInFuture',
  dateShouldBeInPresent: 'validation.dateInFuture',
  matDatepickerParse: 'validation.dateFormat',
  timeFormat: 'validation.timeFormat',
  maxlength: 'validation.maxlength',
  machineNameNotValid: 'validation.machineName',
  serialNumberNotValid: 'validation.serialNumber',
  yearNotValid: 'validation.year',
  priceNotValid: 'validation.price',
  productNameNotValid: 'validation.productName',
  productCodeNotValid: 'validation.productCode',
  idNotValid: 'validation.israeliId',
};

let nextFieldId: number = 0;

/** Unique id for a field's input, label and messages. */
export function newFieldId(prefix: string = 'field'): string {
  nextFieldId += 1;
  return `${prefix}-${nextFieldId}`;
}

/** Errors show after the field was left (blur) or the form was submitted (markAllAsTouched). */
export function showsError(control: AbstractControl | null): boolean {
  return !!control && control.invalid && control.touched;
}

/**
 * Submit helper: shows every error, then moves focus to the first invalid field in `root`.
 * Returns true when the form is valid.
 */
export function validateAndFocus(form: FormGroup, root: HTMLElement): boolean {
  form.markAllAsTouched();
  if (form.valid) {
    return true;
  }
  // Wait for the error state to render (aria-invalid) before looking for it.
  setTimeout(() => root.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  return false;
}

/** Local calendar date as YYYY-MM-DD, the format the legacy forms sent (<input type="date">). */
export function toIsoDate(date: Date | null | undefined): string | null {
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Reads a date from the API (ISO string or YYYY-MM-DD) as a local calendar date. */
export function fromApiDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date: Date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  // "2027-03-14" and "2027-03-14T00:00:00.000Z" are stored as UTC midnight: keep that calendar day.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(value)) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
