import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, InjectionToken } from '@angular/core';
import { IconName } from '../icon/icons';

export interface MenuItem {
  id: string;
  label: string;
  icon?: IconName;
  /** Destructive items (Delete) are red. */
  tone?: 'danger';
  /** Set (true/false) on every item to make a single-choice menu (menuitemradio). */
  checked?: boolean;
  disabled?: boolean;
}

export interface MenuContext {
  items: MenuItem[];
  ariaLabel: string;
  choose: (id: string | null, returnFocus: boolean) => void;
}

export const MENU_CONTEXT = new InjectionToken<MenuContext>('MENU_CONTEXT');

/** Popup menu body rendered by MenuService. ↑↓ Home End move, Enter picks, Esc closes, Tab leaves. */
@Component({
  selector: 'app-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="menu" [attr.aria-label]="context.ariaLabel" class="flex min-w-[200px] flex-col py-1.5" (keydown)="onKeydown($event)">
      <button
        *ngFor="let item of context.items"
        type="button"
        [attr.role]="item.checked === undefined ? 'menuitem' : 'menuitemradio'"
        [attr.aria-checked]="item.checked === undefined ? null : item.checked"
        [disabled]="item.disabled"
        tabindex="-1"
        (click)="context.choose(item.id, true)"
        class="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-2.5 text-start text-sm font-semibold outline-none hover:bg-surface-subtle focus:bg-surface-subtle disabled:opacity-50"
        [ngClass]="item.tone === 'danger' ? 'text-danger' : 'text-ink-2 hover:text-ink'"
      >
        <span *ngIf="item.checked !== undefined" class="flex w-4 justify-center text-accent">
          <app-icon *ngIf="item.checked" name="check" [size]="15"></app-icon>
        </span>
        <app-icon *ngIf="item.icon" [name]="item.icon" [size]="17"></app-icon>
        <span class="whitespace-nowrap">{{ item.label }}</span>
      </button>
    </div>
  `,
})
export class MenuComponent implements AfterViewInit {
  constructor(@Inject(MENU_CONTEXT) public context: MenuContext, private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const items: HTMLElement[] = this.focusable();
    const checked: number = this.context.items.findIndex((item: MenuItem) => item.checked);
    (items[checked] ?? items[0])?.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    const items: HTMLElement[] = this.focusable();
    const index: number = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number): void => {
      event.preventDefault();
      items[(to + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return move(index + 1);
      case 'ArrowUp':
        return move(index - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(items.length - 1);
      case 'Tab':
        this.context.choose(null, false);
        return;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.context.choose(null, true);
        return;
    }
  }

  private focusable(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])'));
  }
}
