import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';

/** Pastel [background, foreground] pairs, picked by `id % 6` (redesign.md §7.2). */
export const AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['#E8ECFE', '#2F4BF0'],
  ['#FDE8E4', '#B4351F'],
  ['#E4F5EC', '#17693F'],
  ['#FDF1D8', '#7A4F00'],
  ['#EFE7FD', '#6D3BD8'],
  ['#E2F3F7', '#0E6A80'],
];

export type AvatarTone = 'pastel' | 'dark';

export function initialsOf(name: string): string {
  const parts: string[] = name.trim().split(/\s+/).filter((part: string) => part.length > 0);
  if (parts.length === 0) {
    return '';
  }
  const first: string = parts[0].charAt(0);
  const last: string = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

/** Round avatar: the photo when there is one, otherwise initials on a pastel (or dark) circle. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-extrabold"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.fontSize.px]="fontSize"
      [style.background]="showImage ? null : background"
      [style.color]="foreground"
      [attr.aria-hidden]="decorative ? 'true' : null"
      [attr.role]="decorative ? null : 'img'"
      [attr.aria-label]="decorative ? null : name"
    >
      <img
        *ngIf="showImage; else initialsTpl"
        [src]="imageUrl"
        alt=""
        class="h-full w-full object-cover"
        (error)="onImageError()"
      />
      <ng-template #initialsTpl>{{ initials }}</ng-template>
    </span>
  `,
  styles: [':host { display: inline-flex; }'],
})
export class AvatarComponent implements OnChanges {
  @Input() name: string = '';
  /** Used to pick the pastel pair. */
  @Input() id: number = 0;
  @Input() imageUrl: string | null = null;
  @Input() size: number = 40;
  @Input() tone: AvatarTone = 'pastel';
  /** Hide from assistive tech when the name is already shown next to it. */
  @Input() decorative: boolean = true;

  private imageFailed: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.imageFailed = false;
  }

  get showImage(): boolean {
    return !!this.imageUrl && !this.imageFailed;
  }

  get initials(): string {
    return initialsOf(this.name);
  }

  get fontSize(): number {
    return Math.round(this.size * 0.35);
  }

  get background(): string {
    return this.tone === 'dark' ? '#1B1C20' : this.pair[0];
  }

  get foreground(): string {
    return this.tone === 'dark' ? '#FFFFFF' : this.pair[1];
  }

  private get pair(): readonly [string, string] {
    const index: number = Math.abs(Math.trunc(this.id)) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[index];
  }

  onImageError(): void {
    this.imageFailed = true;
    this.cdr.markForCheck();
  }
}
