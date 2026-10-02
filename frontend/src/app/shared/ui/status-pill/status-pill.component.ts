import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type PillStatus = 'active' | 'expiring' | 'inactive' | 'neutral';

const TONES: Record<PillStatus, string> = {
  active: 'bg-success-bg text-success',
  expiring: 'bg-warning-bg text-warning',
  inactive: 'bg-neutral-bg text-neutral',
  neutral: 'bg-neutral-bg text-ink-2',
};

const DEFAULT_LABELS: Record<PillStatus, string> = {
  active: 'Active',
  expiring: 'Expiring',
  inactive: 'Inactive',
  neutral: '',
};

/** Small rounded status chip. `label` overrides the default text for `status`. */
@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text }}`,
})
export class StatusPillComponent {
  @Input() status: PillStatus = 'neutral';
  @Input() label: string | null = null;

  get text(): string {
    return this.label ?? DEFAULT_LABELS[this.status];
  }

  @HostBinding('class')
  get hostClass(): string {
    return `inline-flex items-center whitespace-nowrap rounded-full px-2 py-[3px] text-xs font-bold leading-tight ${TONES[this.status]}`;
  }
}
