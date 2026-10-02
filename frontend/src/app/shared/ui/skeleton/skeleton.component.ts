import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

export type SkeletonShape = 'line' | 'block' | 'circle' | 'tile';

const SHAPES: Record<SkeletonShape, string> = {
  line: 'rounded-full',
  block: 'rounded-tile',
  circle: 'rounded-full',
  tile: 'rounded-tile',
};

/** Pulsing placeholder used while data loads. Size it with `width` / `height` (any CSS length). */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SkeletonComponent {
  @Input() shape: SkeletonShape = 'line';
  @Input() width: string = '100%';
  @Input() height: string = '12px';

  @HostBinding('attr.aria-hidden') readonly ariaHidden: string = 'true';

  @HostBinding('style.width')
  get hostWidth(): string {
    return this.width;
  }

  @HostBinding('style.height')
  get hostHeight(): string {
    return this.height;
  }

  @HostBinding('class')
  get hostClass(): string {
    return `block flex-shrink-0 animate-pulse bg-surface-muted ${SHAPES[this.shape]}`;
  }
}
