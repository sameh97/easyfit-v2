import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
  /** Text above the bar (e.g. "₪38k"). */
  valueLabel: string;
  /** The highlighted bar (current month) uses the accent; others use accent-soft. */
  highlight: boolean;
}

/**
 * Brand-coloured vertical bar chart drawn with plain elements (no Chart.js).
 * Screen readers get a visually-hidden table with the same values.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full items-end gap-1.5 sm:gap-3.5" [style.minHeight.px]="height + 56" aria-hidden="true">
      <div *ngFor="let bar of bars" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
        <span
          class="whitespace-nowrap text-[11px] font-bold sm:text-xs"
          [ngClass]="bar.highlight ? 'text-ink' : 'hidden text-ink-4 sm:inline'"
          >{{ bar.valueLabel }}</span
        >
        <div
          class="w-full rounded-tile transition-all duration-300"
          [ngClass]="bar.highlight ? 'bg-accent' : 'bg-accent-soft'"
          [style.height.px]="barHeight(bar.value)"
        ></div>
        <span class="text-xs font-semibold text-ink-3 sm:text-[13px]">{{ bar.label }}</span>
      </div>
    </div>
    <table class="sr-only">
      <caption>{{ caption }}</caption>
      <thead>
        <tr><th scope="col">{{ 'common.chart.month' | translate }}</th><th scope="col">{{ 'common.chart.value' | translate }}</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let bar of bars">
          <th scope="row">{{ bar.label }}</th>
          <td>{{ bar.valueLabel }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [':host { display: block; }'],
})
export class BarChartComponent {
  @Input() bars: BarDatum[] = [];
  /** Height in px of the tallest bar. */
  @Input() height: number = 170;
  @Input() caption: string = '';

  barHeight(value: number): number {
    const max: number = this.bars.reduce((m: number, bar: BarDatum) => Math.max(m, bar.value), 0);
    if (max <= 0) {
      return 4;
    }
    // Keep a visible stub for zero / tiny months.
    return Math.max(4, Math.round((value / max) * this.height));
  }
}
