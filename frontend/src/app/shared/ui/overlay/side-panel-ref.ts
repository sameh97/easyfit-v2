import { InjectionToken } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

/** Data passed to a component opened with SidePanelService. */
export const SIDE_PANEL_DATA = new InjectionToken<unknown>('SIDE_PANEL_DATA');

/** Forms implement this so the panel can ask "Discard changes?" before closing. */
export interface CloseGuard {
  /** True when there are unsaved changes. */
  isDirty(): boolean;
}

export function isCloseGuard(value: unknown): value is CloseGuard {
  return typeof value === 'object' && value !== null && typeof (value as CloseGuard).isDirty === 'function';
}

/** Handle to an open form side panel. Inject it in the panel's component. */
export class SidePanelRef<R = unknown> {
  /** Set by SidePanelService when the component implements CloseGuard. */
  guard: CloseGuard | null = null;

  private readonly closedSubject = new Subject<R | undefined>();
  private closed: boolean = false;

  /** Emits once with the result (undefined when cancelled), then completes. */
  readonly afterClosed$: Observable<R | undefined> = this.closedSubject.asObservable();

  constructor(
    private readonly overlayRef: OverlayRef,
    private readonly returnFocusTo: HTMLElement | null,
    private readonly confirmDiscard: () => Observable<boolean>,
    private readonly onDispose: () => void
  ) {}

  /** Closes right away (after a successful save, for example). */
  close(result?: R): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.onDispose();
    this.overlayRef.dispose();
    this.closedSubject.next(result);
    this.closedSubject.complete();
    const target: HTMLElement | null = this.returnFocusTo;
    if (target && document.body.contains(target)) {
      setTimeout(() => target.focus());
    }
  }

  /** Esc, backdrop, close button and Cancel: asks first when there are unsaved changes. */
  requestClose(): void {
    if (this.closed) {
      return;
    }
    if (!this.guard || !this.guard.isDirty()) {
      this.close();
      return;
    }
    this.confirmDiscard()
      .pipe(take(1))
      .subscribe((discard: boolean) => {
        if (discard) {
          this.close();
        }
      });
  }
}
