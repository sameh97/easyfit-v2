import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { LanguageService } from 'src/app/services/language.service';

export interface WeekStripDay {
  /** Local midnight of the day. */
  date: Date;
  count: number;
}

const DAY_MS: number = 24 * 60 * 60 * 1000;

/** Sunday (local midnight) of the week that contains `date`. Weeks run Sunday to Saturday (§5.4). */
export function startOfWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Whole days from local midnight of `from` to local midnight of `to` (DST-safe). */
export function dayDiff(from: Date, to: Date): number {
  const a: number = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b: number = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

/**
 * Seven day pills, Sunday to Saturday (§5.4): day name, date and a count. The selected day is
 * dark; today's count is in the accent colour. Arrow keys move one day (also across the week
 * edge: the owner then shows the next week), Home and End jump to the ends of the week.
 */
@Component({
  selector: 'app-week-strip',
  template: `
    <div role="tablist" [attr.aria-label]="label" class="grid grid-cols-7 gap-1.5 sm:gap-2" (keydown)="onKeydown($event)">
      <button
        *ngFor="let day of days; trackBy: trackByTime"
        type="button"
        role="tab"
        [id]="idPrefix + '-' + day.date.getTime()"
        [attr.aria-selected]="isSelected(day)"
        [attr.aria-controls]="panelId"
        [attr.aria-label]="ariaLabel(day)"
        [attr.tabindex]="isSelected(day) ? 0 : -1"
        (click)="pick(day.date)"
        class="flex h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-1 transition-colors duration-150 sm:h-[92px] sm:gap-1.5"
        [ngClass]="isSelected(day) ? 'border-0 bg-ink text-white' : 'border border-solid border-line bg-surface text-ink hover:border-line-strong'"
      >
        <span class="text-xs font-bold uppercase tracking-[1px] opacity-75 rtl:text-[13px] rtl:normal-case rtl:tracking-normal">{{ day.date | localDate: 'weekday' }}</span>
        <span class="text-xl font-extrabold leading-none tracking-[-0.5px] sm:text-2xl rtl:tracking-normal">{{ day.date.getDate() }}</span>
        <span class="text-xs font-bold" [ngClass]="countClass(day)">
          <span class="hidden sm:inline">{{ countLabel(day) }}</span><span class="sm:hidden" aria-hidden="true">{{ day.count || '·' }}</span>
        </span>
      </button>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class WeekStripComponent {
  @Input() days: WeekStripDay[] = [];
  @Input() selected: Date | null = null;
  @Input() today: Date = new Date();
  @Input() label: string = '';
  /** Counted translation key for the line under the date (e.g. classes.page.dayCount). */
  @Input() countKey: string = '';
  /** Id of the element showing the selected day's content. */
  @Input() panelId: string | null = null;
  @Input() idPrefix: string = 'day';
  @Output() selectedChange: EventEmitter<Date> = new EventEmitter<Date>();

  constructor(private language: LanguageService, private host: ElementRef<HTMLElement>) {}

  isSelected(day: WeekStripDay): boolean {
    return !!this.selected && sameDay(day.date, this.selected);
  }

  countLabel(day: WeekStripDay): string {
    return this.countKey ? this.language.tCount(this.countKey, day.count) : String(day.count);
  }

  ariaLabel(day: WeekStripDay): string {
    const today: string = sameDay(day.date, this.today) ? `${this.language.t('common.weekStrip.today')}, ` : '';
    return `${today}${this.language.date(day.date, 'longDay')}, ${this.countLabel(day)}`;
  }

  countClass(day: WeekStripDay): string {
    if (this.isSelected(day)) {
      return 'text-[#C9CEFF]';
    }
    return sameDay(day.date, this.today) ? 'text-accent' : 'text-ink-3';
  }

  pick(date: Date): void {
    this.selectedChange.emit(date);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.selected || !this.days.length) {
      return;
    }
    const rtl: boolean = getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const forward: string = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward: string = rtl ? 'ArrowRight' : 'ArrowLeft';
    let target: Date | null = null;
    if (event.key === forward) {
      target = addDays(this.selected, 1);
    } else if (event.key === backward) {
      target = addDays(this.selected, -1);
    } else if (event.key === 'Home') {
      target = this.days[0].date;
    } else if (event.key === 'End') {
      target = this.days[this.days.length - 1].date;
    }
    if (target) {
      event.preventDefault();
      const id: string = `${this.idPrefix}-${target.getTime()}`;
      this.pick(target);
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.focus());
    }
  }

  trackByTime(_index: number, day: WeekStripDay): number {
    return day.date.getTime();
  }
}
