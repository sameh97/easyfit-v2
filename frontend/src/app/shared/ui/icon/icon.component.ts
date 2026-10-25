import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconName, IconShape, ICONS } from './icons';

/**
 * Inline Lucide-style SVG icon.
 * Decorative by default (aria-hidden); pass `label` when the icon carries meaning on its own.
 */
@Component({
    selector: 'app-icon',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="label ? null : 'true'"
      [attr.role]="label ? 'img' : null"
      [attr.aria-label]="label"
      focusable="false"
      >
      @for (shape of shapes; track shape) {
        <ng-container>
          @if (shape.kind === 'path') {
            <svg:path [attr.d]="asPath(shape).d"></svg:path>
            }
            @if (shape.kind === 'circle') {
              <svg:circle
                [attr.cx]="asCircle(shape).cx"
                [attr.cy]="asCircle(shape).cy"
                [attr.r]="asCircle(shape).r"
                ></svg:circle>
              }
              @if (shape.kind === 'rect') {
                <svg:rect
                  [attr.x]="asRect(shape).x"
                  [attr.y]="asRect(shape).y"
                  [attr.width]="asRect(shape).width"
                  [attr.height]="asRect(shape).height"
                  [attr.rx]="asRect(shape).rx"
                  ></svg:rect>
                }
              </ng-container>
            }
          </svg>
    `,
    styles: [':host { display: inline-flex; flex-shrink: 0; line-height: 0; }'],
    standalone: false
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() size: number = 20;
  @Input() strokeWidth: number = 2;
  @Input() label: string | null = null;

  get shapes(): readonly IconShape[] {
    return ICONS[this.name] ?? [];
  }

  asPath(shape: IconShape): Extract<IconShape, { kind: 'path' }> {
    return shape as Extract<IconShape, { kind: 'path' }>;
  }

  asCircle(shape: IconShape): Extract<IconShape, { kind: 'circle' }> {
    return shape as Extract<IconShape, { kind: 'circle' }>;
  }

  asRect(shape: IconShape): Extract<IconShape, { kind: 'rect' }> {
    return shape as Extract<IconShape, { kind: 'rect' }>;
  }
}
