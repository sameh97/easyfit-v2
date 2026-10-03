import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { JobType } from 'src/app/services/maintenance-alerts.service';
import { LanguageService } from 'src/app/services/language.service';
import { MachineView } from './machine-status';

const PILL: string = 'inline-flex items-center justify-center whitespace-nowrap rounded-full px-[9px] py-[3px] text-xs font-bold';

/** Machine status badge (§5.5): Overdue / Due today (danger), Next: {date}, No jobs (neutral). */
@Component({
  selector: 'app-machine-badge',
  template: `<span [class]="cls">{{ label }}</span>`,
  styles: [':host { display: inline-flex; }'],
})
export class MachineBadgeComponent {
  @Input() view!: MachineView;

  constructor(private language: LanguageService) {}

  get label(): string {
    switch (this.view.badge) {
      case 'overdue':
        return this.language.t('machines.badge.overdue');
      case 'due':
        return this.language.t('machines.badge.due');
      case 'next':
        return this.language.t('machines.badge.next', { date: this.language.date(this.view.nextRun as Date, 'shortDay') });
      default:
        return this.language.t(this.view.jobs.length ? 'machines.badge.noUpcoming' : 'machines.badge.none');
    }
  }

  get cls(): string {
    const tone: string = this.view.badge === 'overdue' || this.view.badge === 'due' ? 'bg-danger-bg text-danger-text' : 'bg-neutral-bg text-neutral';
    return `${PILL} ${tone}`;
  }
}

/** Clean / Service pill (P3 mockups: teal and violet). `fixed` gives every pill the same width for lists. */
@Component({
  selector: 'app-job-type-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="cls">{{ 'maintenance.types.' + type | translate }}</span>`,
  styles: [':host { display: inline-flex; flex-shrink: 0; }'],
})
export class JobTypePillComponent {
  @Input() type: JobType = 'clean';
  @Input() fixed: boolean = false;

  get cls(): string {
    const tone: string = this.type === 'clean' ? 'bg-[#E2F3F7] text-[#0E6A80]' : 'bg-[#EFE7FD] text-[#6D3BD8]';
    return `${PILL} ${tone} ${this.fixed ? 'w-[72px]' : ''}`;
  }
}
