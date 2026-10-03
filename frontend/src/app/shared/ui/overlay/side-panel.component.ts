import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

/** ≥ lg: a column next to the list. md–lg: floats at the inline-end side. < md: full-screen dialog. */
type DetailMode = 'inline' | 'float' | 'phone';

const LAYOUT: Record<DetailMode, string> = {
  inline: 'sticky top-4 h-[calc(100vh-2rem)] w-[420px] flex-shrink-0 rounded-panel shadow-card',
  float: 'fixed bottom-4 end-4 top-4 z-40 w-[420px] max-w-[calc(100vw-2rem)] rounded-panel shadow-overlay',
  phone: 'fixed inset-0 z-[60]',
};

/**
 * Detail side panel (§7.4): 420px, no backdrop, so the list stays usable next to it and
 * selecting another row just swaps the content. Esc or the close button emits `closed`,
 * and focus goes back to where it was when the panel opened.
 * Put it next to the list inside a flex row: `<div class="flex items-start gap-4">…</div>`.
 */
@Component({
  selector: 'app-side-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      *ngIf="open"
      #panel
      tabindex="-1"
      class="studio flex flex-col overflow-hidden bg-surface outline-none"
      [ngClass]="layoutClass"
      [attr.role]="mode === 'phone' ? 'dialog' : 'complementary'"
      [attr.aria-modal]="mode === 'phone' ? 'true' : null"
      [attr.aria-label]="label"
      [cdkTrapFocus]="mode === 'phone'"
      (keydown.escape)="onEscape($event)"
    >
      <div class="flex items-center justify-between gap-2 pe-4 ps-5 pt-3.5">
        <span class="text-[11px] font-bold uppercase tracking-label text-ink-4">{{ eyebrow }}</span>
        <div class="flex items-center gap-1">
          <ng-content select="[panelActions]"></ng-content>
          <button type="button" appIconButton icon="x" variant="soft" [label]="'common.actions.close' | translate" (click)="close()"></button>
        </div>
      </div>
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <ng-content></ng-content>
      </div>
    </aside>
  `,
  styles: [':host { display: contents; }'],
})
export class SidePanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() open: boolean = false;
  /** Accessible name, e.g. "Member details". */
  @Input() label: string = '';
  /** Small uppercase label at the top, e.g. "Member". */
  @Input() eyebrow: string = '';
  @Output() closed: EventEmitter<void> = new EventEmitter<void>();

  mode: DetailMode = 'inline';
  private returnFocusTo: HTMLElement | null = null;
  private subscription: Subscription | null = null;

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;

  constructor(private breakpointObserver: BreakpointObserver, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = this.breakpointObserver
      .observe(['(min-width: 768px)', '(min-width: 1024px)'])
      .subscribe(() => {
        this.mode = this.breakpointObserver.isMatched('(min-width: 1024px)')
          ? 'inline'
          : this.breakpointObserver.isMatched('(min-width: 768px)')
          ? 'float'
          : 'phone';
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes.open;
    if (change && change.currentValue && !change.previousValue) {
      this.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (this.mode === 'phone') {
        setTimeout(() => this.panel?.nativeElement.focus());
      }
    }
  }

  get layoutClass(): string {
    return LAYOUT[this.mode];
  }

  close(): void {
    this.closed.emit();
    const target: HTMLElement | null = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target && document.body.contains(target)) {
      setTimeout(() => target.focus());
    }
  }

  onEscape(event: Event): void {
    event.stopPropagation();
    this.close();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
