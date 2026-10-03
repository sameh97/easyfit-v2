import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LanguageService, TextDir } from 'src/app/services/language.service';
import { ConfirmDialogService } from './confirm-dialog.service';
import { isCloseGuard, SidePanelRef, SIDE_PANEL_DATA } from './side-panel-ref';

export interface SidePanelOptions<D> {
  data?: D;
  /** Accessible name of the dialog, e.g. "Add member". */
  ariaLabel: string;
}

/**
 * Create/edit side panel (§7.4): 480px, slides in from the inline-end side (left in Hebrew),
 * backdrop, full-screen below md, focus trapped, Esc closes, focus returns to the trigger,
 * and "Discard changes?" when the component reports unsaved changes (CloseGuard).
 * The component lays itself out with <app-panel-layout>.
 */
@Injectable({
  providedIn: 'root',
})
export class SidePanelService {
  constructor(
    private overlay: Overlay,
    private injector: Injector,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  open<C, D = unknown, R = unknown>(component: ComponentType<C>, options: SidePanelOptions<D>): SidePanelRef<R> {
    const returnFocusTo: HTMLElement | null =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const overlayRef: OverlayRef = this.overlay.create(
      new OverlayConfig({
        hasBackdrop: true,
        backdropClass: 'studio-backdrop',
        panelClass: ['studio', 'studio-side-panel'],
        direction: this.language.dir,
        scrollStrategy: this.overlay.scrollStrategies.block(),
      })
    );

    const subscriptions: Subscription[] = [];
    let focusTrap: FocusTrap | null = null;
    const ref = new SidePanelRef<R>(
      overlayRef,
      returnFocusTo,
      () => this.confirmDiscard(),
      () => {
        focusTrap?.destroy();
        subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
      }
    );

    const injector: Injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: SidePanelRef, useValue: ref },
        { provide: SIDE_PANEL_DATA, useValue: options.data },
      ],
    });
    const instance: C = overlayRef.attach(new ComponentPortal(component, null, injector)).instance;
    if (isCloseGuard(instance)) {
      ref.guard = instance;
    }

    const pane: HTMLElement = overlayRef.overlayElement;
    pane.setAttribute('role', 'dialog');
    pane.setAttribute('aria-modal', 'true');
    pane.setAttribute('aria-label', options.ariaLabel);
    focusTrap = this.focusTrapFactory.create(pane);
    focusTrap.focusInitialElementWhenReady();

    subscriptions.push(overlayRef.backdropClick().subscribe(() => ref.requestClose()));
    subscriptions.push(
      overlayRef
        .keydownEvents()
        .pipe(filter((event: KeyboardEvent) => event.key === 'Escape'))
        .subscribe((event: KeyboardEvent) => {
          event.preventDefault();
          ref.requestClose();
        })
    );
    // Switching language while the panel is open moves it to the other side.
    subscriptions.push(this.language.dir$.subscribe((dir: TextDir) => overlayRef.setDirection(dir)));

    return ref;
  }

  private confirmDiscard(): Observable<boolean> {
    return this.confirmDialog.confirm({
      title: this.language.t('common.panel.discardTitle'),
      message: this.language.t('common.panel.discardBody'),
      confirmLabel: this.language.t('common.panel.discard'),
      cancelLabel: this.language.t('common.panel.keepEditing'),
      tone: 'danger',
    });
  }
}
