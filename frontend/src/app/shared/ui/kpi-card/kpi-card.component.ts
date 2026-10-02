import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PillStatus } from '../status-pill/status-pill.component';

/** Dashboard KPI: label, big number, optional chip, caption. */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card padding="sm" class="flex h-full flex-col gap-2">
      <span class="text-sm font-semibold text-ink-3">{{ label }}</span>
      <div class="flex flex-wrap items-baseline gap-2.5">
        <span class="text-[34px] font-extrabold leading-none tracking-kpi text-ink">{{ value }}</span>
        <app-status-pill *ngIf="chip" [status]="chipStatus" [label]="chip"></app-status-pill>
      </div>
      <span *ngIf="caption" class="text-[13px] text-ink-3">{{ caption }}</span>
    </app-card>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() chip: string | null = null;
  @Input() chipStatus: PillStatus = 'neutral';
  @Input() caption: string | null = null;
}
