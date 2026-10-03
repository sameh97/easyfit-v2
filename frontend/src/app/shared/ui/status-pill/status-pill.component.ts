import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type PillStatus = 'active' | 'expiring' | 'expired' | 'inactive' | 'neutral';

const TONES: Record<PillStatus, string> = {
  active: 'bg-success-bg text-success',
  expiring: 'bg-warning-bg text-warning',
  expired: 'bg-danger-bg text-danger-text',
  inactive: 'bg-neutral-bg text-neutral',
  neutral: 'bg-neutral-bg text-ink-2',
};

/** Translation keys for the default text of each status. */
const DEFAULT_LABEL_KEYS: Record<PillStatus, string | null> = {
  active: 'common.status.active',
  expiring: 'common.status.expiring',
  expired: 'common.status.expired',
  inactive: 'common.status.inactive',
  neutral: null,
};

/** Small rounded status chip. `label` overrides the default text for `status`. */
@Component({
  selector: 'app-status-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container *ngIf="label !== null; else byStatus">{{ label }}</ng-container
    ><ng-template #byStatus>{{ defaultKey ? (defaultKey | translate) : '' }}</ng-template>`,
})
export class StatusPillComponent {
  @Input() status: PillStatus = 'neutral';
  @Input() label: string | null = null;

  get defaultKey(): string | null {
    return DEFAULT_LABEL_KEYS[this.status];
  }

  @HostBinding('class')
  get hostClass(): string {
    return `inline-flex items-center whitespace-nowrap rounded-full px-2 py-[3px] text-xs font-bold leading-tight ${TONES[this.status]}`;
  }
}
