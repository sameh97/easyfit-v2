import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Page title + subtitle, with the page's primary actions on the right.
 * `<app-page-header title="Members" subtitle="…"><ng-container actions>…</ng-container></app-page-header>`
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div class="flex min-w-0 flex-col gap-1.5">
        <h1 class="text-[28px] font-extrabold leading-[1.1] tracking-title text-ink sm:text-[32px]">{{ title }}</h1>
        <p *ngIf="subtitle" class="text-base text-ink-3" dir="auto">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap gap-2.5">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string | null = null;
}
