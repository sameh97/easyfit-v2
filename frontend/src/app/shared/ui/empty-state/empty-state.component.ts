import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconName } from '../icon/icons';

export type EmptyStateTone = 'neutral' | 'accent' | 'danger';

const TILE_TONES: Record<EmptyStateTone, string> = {
  neutral: 'bg-surface-muted text-ink-2',
  accent: 'bg-accent-soft text-accent',
  danger: 'bg-[#FDE8E4] text-danger',
};

/** Icon, a short line and (projected) main action. Also used for error states. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3 px-4 text-center" [ngClass]="compact ? 'py-4' : 'py-10'">
      <span class="flex h-11 w-11 items-center justify-center rounded-tile" [ngClass]="tileClass">
        <app-icon [name]="icon" [size]="20"></app-icon>
      </span>
      <div class="flex max-w-xs flex-col gap-1">
        <p class="text-[15px] font-bold text-ink">{{ title }}</p>
        <p *ngIf="message" class="text-[13px] text-ink-3">{{ message }}</p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class EmptyStateComponent {
  @Input() icon: IconName = 'inbox';
  @Input() title: string = '';
  @Input() message: string | null = null;
  @Input() tone: EmptyStateTone = 'neutral';
  @Input() compact: boolean = false;

  get tileClass(): string {
    return TILE_TONES[this.tone];
  }
}
