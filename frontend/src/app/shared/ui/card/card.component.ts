import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-[22px]',
  lg: 'p-6',
};

/** White surface, 20px radius, soft shadow, no border. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
})
export class CardComponent {
  @Input() padding: CardPadding = 'lg';

  @HostBinding('class')
  get hostClass(): string {
    return `block min-w-0 rounded-card bg-surface shadow-card ${PADDING[this.padding]}`;
  }
}
