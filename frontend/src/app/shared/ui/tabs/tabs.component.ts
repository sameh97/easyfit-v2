import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
}

/**
 * Pill tab list of the detail panels (extracted from Members and Trainers). Renders only the
 * tablist; the owner renders the panel with id `{idPrefix}-tabpanel-{id}`, labelled by
 * `{idPrefix}-tab-{id}`. Arrow keys follow the reading direction; Home and End jump.
 */
@Component({
  selector: 'app-tabs',
  template: `
    <div role="tablist" [attr.aria-label]="label" class="flex gap-0.5 rounded-full bg-surface-muted p-1" (keydown)="onKeydown($event)">
      <button
        *ngFor="let tab of tabs; trackBy: trackById"
        type="button"
        role="tab"
        [id]="idPrefix + '-tab-' + tab.id"
        [attr.aria-selected]="tab.id === value"
        [attr.aria-controls]="idPrefix + '-tabpanel-' + tab.id"
        [attr.tabindex]="tab.id === value ? 0 : -1"
        (click)="select(tab.id)"
        class="flex-1 whitespace-nowrap rounded-full border-0 px-2 py-2 text-[13px] transition-colors"
        [ngClass]="tab.id === value ? 'bg-surface font-bold text-ink shadow-card' : 'bg-transparent font-semibold text-neutral hover:text-ink'"
      >
        {{ tab.label }}
      </button>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class TabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() value: string = '';
  @Input() label: string = '';
  @Input() idPrefix: string = 'tabs';
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  constructor(private host: ElementRef<HTMLElement>) {}

  select(id: string): void {
    if (id !== this.value) {
      this.value = id;
      this.valueChange.emit(id);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const rtl: boolean = getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const next: string = rtl ? 'ArrowLeft' : 'ArrowRight';
    const previous: string = rtl ? 'ArrowRight' : 'ArrowLeft';
    const count: number = this.tabs.length;
    const index: number = this.tabs.findIndex((tab: TabItem) => tab.id === this.value);
    let target: number = -1;
    if (event.key === next) {
      target = (index + 1) % count;
    } else if (event.key === previous) {
      target = (index - 1 + count) % count;
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = count - 1;
    }
    if (target >= 0 && count) {
      event.preventDefault();
      const id: string = this.tabs[target].id;
      this.select(id);
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${this.idPrefix}-tab-${id}`)?.focus());
    }
  }

  trackById(_index: number, tab: TabItem): string {
    return tab.id;
  }
}
