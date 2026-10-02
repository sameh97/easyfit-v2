import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/** What the command palette shows when it opens. */
export type PaletteMode = 'default' | 'sell-product';

const SIDEBAR_COLLAPSED_KEY = 'easyfit.sidebarCollapsed';

/**
 * UI state shared by the app shell (sidebar, command palette, AI panel).
 * Lives at root so it survives route changes; every page renders its own <app-nav>.
 */
@Injectable({
  providedIn: 'root',
})
export class ShellStateService {
  private readonly sidebarCollapsedSubject = new BehaviorSubject<boolean>(this.readCollapsed());
  private readonly paletteOpenSubject = new BehaviorSubject<boolean>(false);
  private readonly paletteModeSubject = new BehaviorSubject<PaletteMode>('default');
  private readonly aiPanelOpenSubject = new BehaviorSubject<boolean>(false);
  private readonly aiDraftSubject = new BehaviorSubject<string>('');

  readonly sidebarCollapsed$: Observable<boolean> = this.sidebarCollapsedSubject.pipe(distinctUntilChanged());
  readonly paletteOpen$: Observable<boolean> = this.paletteOpenSubject.pipe(distinctUntilChanged());
  readonly paletteMode$: Observable<PaletteMode> = this.paletteModeSubject.pipe(distinctUntilChanged());
  readonly aiPanelOpen$: Observable<boolean> = this.aiPanelOpenSubject.pipe(distinctUntilChanged());
  /** Prefilled question for the AI panel (e.g. from "Explain this"). */
  readonly aiDraft$: Observable<string> = this.aiDraftSubject.asObservable();

  /** ⌘ on macOS, Ctrl elsewhere — used for shortcut hints. */
  readonly modifierLabel: string = /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘' : 'Ctrl ';

  get sidebarCollapsed(): boolean {
    return this.sidebarCollapsedSubject.value;
  }

  get paletteOpen(): boolean {
    return this.paletteOpenSubject.value;
  }

  get aiPanelOpen(): boolean {
    return this.aiPanelOpenSubject.value;
  }

  toggleSidebar(): void {
    const next: boolean = !this.sidebarCollapsedSubject.value;
    this.sidebarCollapsedSubject.next(next);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
    } catch {
      // Storage can be unavailable (private mode); the state just won't persist.
    }
  }

  openPalette(mode: PaletteMode = 'default'): void {
    this.paletteModeSubject.next(mode);
    this.paletteOpenSubject.next(true);
  }

  closePalette(): void {
    this.paletteOpenSubject.next(false);
    this.paletteModeSubject.next('default');
  }

  togglePalette(): void {
    if (this.paletteOpen) {
      this.closePalette();
    } else {
      this.openPalette();
    }
  }

  openAiPanel(draft?: string): void {
    if (draft !== undefined) {
      this.aiDraftSubject.next(draft);
    }
    this.aiPanelOpenSubject.next(true);
  }

  closeAiPanel(): void {
    this.aiPanelOpenSubject.next(false);
  }

  toggleAiPanel(): void {
    if (this.aiPanelOpen) {
      this.closeAiPanel();
    } else {
      this.openAiPanel();
    }
  }

  private readCollapsed(): boolean {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
