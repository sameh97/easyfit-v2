import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconName } from '../icon/icons';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold leading-none whitespace-nowrap ' +
  'transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'border-0 bg-accent text-white hover:bg-opacity-90 hover:text-white',
  secondary: 'border border-solid border-line-strong bg-surface text-ink hover:bg-surface-subtle hover:text-ink',
  dark: 'border-0 bg-ink text-white hover:bg-ink-2 hover:text-white',
  ghost: 'border-0 bg-transparent text-ink-2 hover:bg-surface-muted hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
};

/**
 * Studio button. Put it on a real <button> or <a> so semantics stay native:
 * `<button appButton variant="primary" icon="plus">Add member</button>`
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appButton], a[appButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-icon *ngIf="icon" [name]="icon" [size]="size === 'sm' ? 14 : 18"></app-icon>
    <ng-content></ng-content>
    <app-icon *ngIf="iconRight" [name]="iconRight" [size]="size === 'sm' ? 14 : 18"></app-icon>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'secondary';
  @Input() size: ButtonSize = 'md';
  @Input() icon: IconName | null = null;
  @Input() iconRight: IconName | null = null;
  @Input() block: boolean = false;

  @HostBinding('class')
  get hostClass(): string {
    return `${BASE} ${VARIANTS[this.variant]} ${SIZES[this.size]}${this.block ? ' w-full' : ''}`;
  }
}
