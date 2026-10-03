import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { ShellStateService } from 'src/app/services/shell-state.service';

/** Example questions (translation keys) shown as disabled chips until the assistant ships. */
const EXAMPLE_QUESTIONS: readonly string[] = [
  'shell.ai.examples.expiring',
  'shell.ai.examples.sales',
  'shell.ai.examples.maintenance',
  'shell.ai.examples.classes',
];

/**
 * EasyFit AI panel — UI shell only in Phase 1 (no backend).
 * Sits on the inline-end side. Docks as a third column on ≥ xl, slides over the page below xl, full-screen on phones.
 */
@Component({
  selector: 'app-ai-panel',
  templateUrl: './ai-panel.component.html',
  styles: [':host { display: contents; }'],
})
export class AiPanelComponent implements OnInit, OnDestroy {
  /** True on ≥ xl: the panel takes a column instead of overlaying the page. */
  @Input() docked: boolean = false;
  @Input() phone: boolean = false;

  open: boolean = false;
  draft: string = '';
  readonly examples: readonly string[] = EXAMPLE_QUESTIONS;

  private returnFocusTo: HTMLElement | null = null;
  private subscriptions: Subscription[] = [];

  @ViewChild('closeButton', { read: ElementRef }) private closeButton?: ElementRef<HTMLElement>;

  constructor(private shell: ShellStateService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.shell.aiPanelOpen$.subscribe((open: boolean) => (open ? this.onOpen() : this.onClose()))
    );
    this.subscriptions.push(this.shell.aiDraft$.subscribe((draft: string) => (this.draft = draft)));
  }

  private onOpen(): void {
    if (!this.open) {
      this.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.open = true;
    setTimeout(() => this.closeButton?.nativeElement.focus());
  }

  private onClose(): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    const target: HTMLElement | null = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target && document.body.contains(target)) {
      setTimeout(() => target.focus());
    }
  }

  close(): void {
    this.shell.closeAiPanel();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
    }
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
