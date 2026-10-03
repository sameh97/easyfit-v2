import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconName } from '../icon/icons';

export type IconButtonVariant = 'ghost' | 'outline' | 'soft' | 'accent';
export type IconButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'border-0 bg-transparent text-ink-3 hover:bg-surface-muted hover:text-ink',
  outline: 'border border-solid border-line bg-surface text-ink hover:bg-surface-subtle',
  soft: 'border-0 bg-surface-muted text-ink hover:bg-line',
  /** An outline button whose popup is open (e.g. the bell). */
  accent: 'border border-solid border-accent bg-accent-soft text-accent',
};

const SIZES: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 rounded-[10px]',
  md: 'h-11 w-11 rounded-full',
  /** Panel close buttons. */
  lg: 'h-10 w-10 rounded-full',
};

/** Icon-only button. `label` is required and becomes the aria-label. */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[appIconButton], a[appIconButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-icon [name]="icon" [size]="resolvedIconSize"></app-icon>
    <ng-content></ng-content>
  `,
})
export class IconButtonComponent {
  @Input() icon!: IconName;
  @Input() label!: string;
  @Input() variant: IconButtonVariant = 'ghost';
  @Input() size: IconButtonSize = 'sm';
  @Input() iconSize: number | null = null;

  get resolvedIconSize(): number {
    return this.iconSize ?? (this.size === 'sm' ? 18 : 19);
  }

  @HostBinding('attr.aria-label')
  get ariaLabel(): string {
    return this.label;
  }

  @HostBinding('attr.title')
  get title(): string {
    return this.label;
  }

  @HostBinding('class')
  get hostClass(): string {
    return (
      'relative inline-flex flex-shrink-0 items-center justify-center p-0 transition-colors duration-150 ' +
      `${VARIANTS[this.variant]} ${SIZES[this.size]}`
    );
  }
}
