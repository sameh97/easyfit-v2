import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LanguageService } from 'src/app/services/language.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogContext,
  ConfirmOptions,
  CONFIRM_DIALOG_CONTEXT,
} from './confirm-dialog.component';

/** Studio confirm dialog (§7.4), used for delete, deactivate, discard and log out. */
@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  constructor(
    private overlay: Overlay,
    private injector: Injector,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private language: LanguageService
  ) {}

  /** Emits true (confirmed) or false (cancel, Esc, backdrop), then completes. */
  confirm(options: ConfirmOptions): Observable<boolean> {
    const result = new Subject<boolean>();
    const returnFocusTo: HTMLElement | null =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const overlayRef: OverlayRef = this.overlay.create(
      new OverlayConfig({
        hasBackdrop: true,
        backdropClass: 'studio-backdrop',
        panelClass: ['studio', 'studio-dialog'],
        direction: this.language.dir,
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      })
    );

    let focusTrap: FocusTrap | null = null;
    let done: boolean = false;
    const answer = (confirmed: boolean): void => {
      if (done) {
        return;
      }
      done = true;
      focusTrap?.destroy();
      overlayRef.dispose();
      result.next(confirmed);
      result.complete();
      if (returnFocusTo && document.body.contains(returnFocusTo)) {
        setTimeout(() => returnFocusTo.focus());
      }
    };

    const context: ConfirmDialogContext = { options, answer };
    const injector: Injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: CONFIRM_DIALOG_CONTEXT, useValue: context }],
    });
    overlayRef.attach(new ComponentPortal(ConfirmDialogComponent, null, injector));

    const pane: HTMLElement = overlayRef.overlayElement;
    pane.setAttribute('role', 'alertdialog');
    pane.setAttribute('aria-modal', 'true');
    pane.setAttribute('aria-labelledby', 'confirm-dialog-title');
    pane.setAttribute('aria-describedby', 'confirm-dialog-message');
    focusTrap = this.focusTrapFactory.create(pane);
    focusTrap.focusInitialElementWhenReady();

    overlayRef.backdropClick().subscribe(() => answer(false));
    overlayRef
      .keydownEvents()
      .pipe(filter((event: KeyboardEvent) => event.key === 'Escape'))
      .subscribe((event: KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        answer(false);
      });

    return result.asObservable();
  }
}
