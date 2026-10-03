import { Injectable, Injector } from '@angular/core';
import { ConnectedPosition, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Observable, Subject } from 'rxjs';
import { LanguageService } from 'src/app/services/language.service';
import { MenuComponent, MenuContext, MenuItem, MENU_CONTEXT } from './menu.component';

/** Below the trigger, aligned to its inline end; flips above when there's no room. */
const POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
];

/**
 * Small popup menu anchored to a button (row actions, Renew, filters).
 * Emits the chosen item id, or null when dismissed, then completes. Focus returns to the trigger.
 */
@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private overlay: Overlay, private injector: Injector, private language: LanguageService) {}

  open(trigger: HTMLElement, items: MenuItem[], ariaLabel: string): Observable<string | null> {
    const result = new Subject<string | null>();
    const overlayRef: OverlayRef = this.overlay.create(
      new OverlayConfig({
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
        panelClass: ['studio', 'studio-menu'],
        direction: this.language.dir,
        scrollStrategy: this.overlay.scrollStrategies.reposition(),
        positionStrategy: this.overlay.position().flexibleConnectedTo(trigger).withPositions(POSITIONS).withPush(true),
      })
    );

    let done: boolean = false;
    const choose = (id: string | null, returnFocus: boolean): void => {
      if (done) {
        return;
      }
      done = true;
      overlayRef.dispose();
      trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) {
        trigger.focus();
      }
      result.next(id);
      result.complete();
    };

    const context: MenuContext = { items, ariaLabel, choose };
    overlayRef.attach(
      new ComponentPortal(
        MenuComponent,
        null,
        Injector.create({ parent: this.injector, providers: [{ provide: MENU_CONTEXT, useValue: context }] })
      )
    );
    trigger.setAttribute('aria-expanded', 'true');
    overlayRef.backdropClick().subscribe(() => choose(null, false));
    return result.asObservable();
  }
}
