import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldMessages, newFieldId, showsError } from './field';
import { FIELD_BOX, FIELD_BOX_ERROR, FIELD_BOX_OK, FIELD_HELP, FIELD_INPUT, FIELD_LABEL, FIELD_PAD } from './field-shell';

export interface MultiSelectOption {
  value: number;
  label: string;
  /** Second line in the list, also searched (e.g. a phone number, shown LTR). */
  caption?: string;
  imageUrl?: string | null;
}

/** Results shown at once; typing narrows them down. */
const MAX_RESULTS: number = 50;

/**
 * Searchable multi-select (§5.4, members of a class): a search pill that lists matching options,
 * and the picked ones as avatar chips below, each with a remove button. After `collapseAfter`
 * chips a "+N more" button shows the rest. The control holds the picked values (number[]).
 */
@Component({
  selector: 'app-multi-select',
  template: `
    <div class="relative flex flex-col gap-2.5" (focusout)="onFocusOut($event)">
      <label [for]="id" [class]="labelClass" [ngClass]="hideLabel ? 'sr-only' : ''">{{ label }}<span *ngIf="required" class="text-danger" aria-hidden="true"> *</span></label>
      <div [class]="boxClass">
        <app-icon name="search" [size]="17" class="text-ink-3"></app-icon>
        <input
          #input
          [id]="id"
          type="text"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          [attr.aria-expanded]="open"
          [attr.aria-controls]="id + '-list'"
          [attr.aria-activedescendant]="open && active >= 0 && results[active] ? id + '-opt-' + results[active].value : null"
          [attr.placeholder]="placeholder"
          [attr.aria-required]="required ? 'true' : null"
          [attr.aria-invalid]="invalid ? 'true' : null"
          [attr.aria-describedby]="invalid ? id + '-error' : help ? id + '-help' : null"
          [value]="query"
          [class]="inputClass"
          (input)="onInput(input.value)"
          (focus)="openList()"
          (click)="openList()"
          (keydown)="onKeydown($event)"
        />
      </div>

      <ul
        *ngIf="open"
        [id]="id + '-list'"
        role="listbox"
        aria-multiselectable="true"
        [attr.aria-label]="label"
        class="absolute inset-x-0 top-[78px] z-10 m-0 max-h-64 list-none overflow-y-auto rounded-2xl bg-surface p-1.5 shadow-overlay"
      >
        <li *ngIf="!results.length" class="px-3 py-2.5 text-sm text-ink-3" role="presentation">{{ 'common.multiSelect.noResults' | translate }}</li>
        <li
          *ngFor="let option of results; let i = index; trackBy: trackByValue"
          [id]="id + '-opt-' + option.value"
          role="option"
          aria-selected="false"
          (mousedown)="$event.preventDefault()"
          (click)="add(option)"
          class="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2"
          [ngClass]="i === active ? 'bg-accent-soft' : 'hover:bg-surface-subtle'"
        >
          <app-avatar [name]="option.label" [id]="option.value" [imageUrl]="option.imageUrl || null" [size]="30"></app-avatar>
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-semibold text-ink" dir="auto">{{ option.label }}</span>
            <span *ngIf="option.caption" class="truncate text-xs text-ink-3"><bdi dir="ltr">{{ option.caption }}</bdi></span>
          </span>
        </li>
        <li *ngIf="truncated" class="px-3 py-2 text-xs text-ink-3" role="presentation">{{ 'common.multiSelect.typeToNarrow' | translate }}</li>
      </ul>

      <ul *ngIf="picked.length" class="m-0 flex list-none flex-wrap gap-1.5 p-0" [attr.aria-label]="'common.multiSelect.selected' | translate: { label: label }">
        <li *ngFor="let option of visibleChips; trackBy: trackByValue" class="flex h-[34px] items-center gap-1.5 rounded-full bg-surface-muted px-1 text-[13px] font-bold text-ink">
          <app-avatar [name]="option.label" [id]="option.value" [imageUrl]="option.imageUrl || null" [size]="26"></app-avatar>
          <span class="max-w-[160px] truncate" dir="auto">{{ option.label }}</span>
          <button
            type="button"
            class="flex h-[26px] w-[26px] items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink-3 hover:bg-surface hover:text-ink"
            [attr.aria-label]="'common.multiSelect.remove' | translate: { name: option.label }"
            (click)="remove(option)"
          >
            <app-icon name="x" [size]="13"></app-icon>
          </button>
        </li>
        <li *ngIf="hiddenCount > 0">
          <button type="button" class="h-[34px] rounded-full border border-solid border-line-strong bg-surface px-3 text-[13px] font-bold text-ink hover:bg-surface-subtle" (click)="expanded = true">
            {{ 'common.multiSelect.more' | translate: { count: hiddenCount } }}
          </button>
        </li>
        <li *ngIf="expanded && picked.length > collapseAfter">
          <button type="button" class="h-[34px] rounded-full border-0 bg-transparent px-3 text-[13px] font-bold text-accent hover:underline" (click)="expanded = false">
            {{ 'common.multiSelect.less' | translate }}
          </button>
        </li>
      </ul>

      <app-field-error *ngIf="invalid; else helpTpl" [id]="id + '-error'" [control]="control" [messages]="messages"></app-field-error>
      <ng-template #helpTpl><span *ngIf="help" [id]="id + '-help'" [class]="helpClass">{{ help }}</span></ng-template>
    </div>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class MultiSelectComponent {
  @Input() control!: FormControl;
  @Input() label: string = '';
  /** The label stays for screen readers when a section title already names the field. */
  @Input() hideLabel: boolean = false;
  @Input() options: MultiSelectOption[] = [];
  @Input() required: boolean = false;
  @Input() help: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() collapseAfter: number = 6;
  @Input() messages: FieldMessages = {};

  readonly id: string = newFieldId('multi');
  readonly labelClass: string = FIELD_LABEL;
  readonly helpClass: string = FIELD_HELP;
  readonly inputClass: string = FIELD_INPUT;
  query: string = '';
  open: boolean = false;
  active: number = -1;
  expanded: boolean = false;
  results: MultiSelectOption[] = [];
  truncated: boolean = false;

  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;

  constructor(private host: ElementRef<HTMLElement>) {}

  get invalid(): boolean {
    return showsError(this.control);
  }

  get boxClass(): string {
    return `${FIELD_BOX} ${FIELD_PAD} ${this.invalid ? FIELD_BOX_ERROR : FIELD_BOX_OK}`;
  }

  private get values(): number[] {
    return Array.isArray(this.control.value) ? (this.control.value as number[]) : [];
  }

  /** Picked options in the order they were added. Values with no option (e.g. a deleted member) are skipped. */
  get picked(): MultiSelectOption[] {
    const byValue = new Map<number, MultiSelectOption>(this.options.map((option: MultiSelectOption) => [option.value, option]));
    return this.values
      .map((value: number) => byValue.get(value))
      .filter((option: MultiSelectOption | undefined): option is MultiSelectOption => !!option);
  }

  get visibleChips(): MultiSelectOption[] {
    const picked: MultiSelectOption[] = this.picked;
    return this.expanded ? picked : picked.slice(0, this.collapseAfter);
  }

  get hiddenCount(): number {
    return this.expanded ? 0 : Math.max(0, this.picked.length - this.collapseAfter);
  }

  onInput(value: string): void {
    this.query = value;
    this.open = true;
    this.refresh();
    this.active = this.results.length ? 0 : -1;
  }

  openList(): void {
    if (!this.open) {
      this.open = true;
      this.refresh();
      this.active = -1;
    }
  }

  add(option: MultiSelectOption): void {
    if (!this.values.includes(option.value)) {
      this.control.setValue([...this.values, option.value]);
      this.control.markAsDirty();
    }
    this.query = '';
    this.refresh();
    this.active = Math.min(this.active, this.results.length - 1);
    this.input?.nativeElement.focus();
  }

  remove(option: MultiSelectOption): void {
    this.control.setValue(this.values.filter((value: number) => value !== option.value));
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.refresh();
    this.input?.nativeElement.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openList();
      if (!this.results.length) {
        return;
      }
      const step: number = event.key === 'ArrowDown' ? 1 : -1;
      this.active = (this.active + step + this.results.length) % this.results.length;
      document.getElementById(`${this.id}-opt-${this.results[this.active].value}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      // Never submit the form from the search box.
      event.preventDefault();
      if (this.open && this.results[this.active]) {
        this.add(this.results[this.active]);
      }
    } else if (event.key === 'Escape' && this.open) {
      // Close the list only, not the side panel around the field.
      event.stopPropagation();
      this.open = false;
      this.active = -1;
    } else if (event.key === 'Backspace' && !this.query && this.picked.length) {
      this.remove(this.picked[this.picked.length - 1]);
    }
  }

  /** Counts as blurred once focus leaves the field, its list and its chips. */
  onFocusOut(event: FocusEvent): void {
    const next: EventTarget | null = event.relatedTarget;
    if (!(next instanceof Node) || !this.host.nativeElement.contains(next)) {
      this.open = false;
      this.active = -1;
      this.control.markAsTouched();
    }
  }

  trackByValue(_index: number, option: MultiSelectOption): number {
    return option.value;
  }

  /** Unpicked options matching every word of the query, in name or caption (digits match without dashes). */
  private refresh(): void {
    const picked = new Set<number>(this.values);
    const words: string[] = this.query.trim().toLowerCase().split(/\s+/).filter((word: string) => word.length > 0);
    const matches: MultiSelectOption[] = this.options.filter((option: MultiSelectOption) => {
      if (picked.has(option.value)) {
        return false;
      }
      const haystack: string = `${option.label} ${option.caption ?? ''}`.toLowerCase();
      const digits: string = (option.caption ?? '').replace(/\D/g, '');
      return words.every((word: string) => haystack.includes(word) || (/^\d{3,}$/.test(word.replace(/\D/g, '')) && digits.includes(word.replace(/\D/g, ''))));
    });
    this.truncated = matches.length > MAX_RESULTS;
    this.results = matches.slice(0, MAX_RESULTS);
  }
}
