import { ChangeDetectionStrategy, Component, EventEmitter, Input, Optional, Output } from '@angular/core';
import { SidePanelRef } from './side-panel-ref';

/**
 * Layout for a form side panel: header (title, "Fields marked * are required", close),
 * a scrolling body and a sticky footer for Cancel + the primary action.
 * `<app-panel-layout title="Add member"><div panelBody>…</div><ng-container panelFooter>…</ng-container></app-panel-layout>`
 */
@Component({
  selector: 'app-panel-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-3 border-b border-solid border-line-soft pb-4 pe-5 ps-6 pt-5">
      <div class="flex min-w-0 flex-col gap-0.5">
        <h2 class="truncate text-[22px] font-extrabold tracking-card text-ink" dir="auto">{{ title }}</h2>
        <p *ngIf="showRequiredNote" class="text-[13px] text-ink-3">
          {{ 'common.panel.requiredNotePrefix' | translate }}<span class="text-danger" aria-hidden="true">*</span>{{ 'common.panel.requiredNoteSuffix' | translate }}
        </p>
      </div>
      <button
        type="button"
        appIconButton
        icon="x"
        variant="soft"
        size="lg"
        [label]="'common.actions.close' | translate"
        (click)="onClose()"
      ></button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-5">
      <ng-content select="[panelBody]"></ng-content>
    </div>
    <div class="flex items-center justify-end gap-2.5 border-t border-solid border-line-soft bg-surface-subtle px-6 py-4">
      <ng-content select="[panelFooter]"></ng-content>
    </div>
  `,
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; }'],
})
export class PanelLayoutComponent {
  @Input() title: string = '';
  @Input() showRequiredNote: boolean = true;
  /** Emitted when there is no SidePanelRef to close (e.g. the layout is used inline). */
  @Output() closeClick: EventEmitter<void> = new EventEmitter<void>();

  constructor(@Optional() private ref: SidePanelRef | null) {}

  onClose(): void {
    if (this.ref) {
      this.ref.requestClose();
    } else {
      this.closeClick.emit();
    }
  }
}
