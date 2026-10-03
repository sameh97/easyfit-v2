import { ChangeDetectionStrategy, Component, Inject, InjectionToken } from '@angular/core';

export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  /** Delete, deactivate and discard use danger (§7.4). */
  tone?: ConfirmTone;
}

export interface ConfirmDialogContext {
  options: ConfirmOptions;
  answer: (confirmed: boolean) => void;
}

export const CONFIRM_DIALOG_CONTEXT = new InjectionToken<ConfirmDialogContext>('CONFIRM_DIALOG_CONTEXT');

/** Small centred Studio modal: title, one sentence, Cancel + a (destructive) action. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 p-6 pb-5">
      <h2 id="confirm-dialog-title" class="text-lg font-extrabold tracking-card text-ink">{{ context.options.title }}</h2>
      <p id="confirm-dialog-message" class="text-sm leading-relaxed text-ink-3">{{ context.options.message }}</p>
    </div>
    <div class="flex flex-wrap justify-end gap-2.5 px-6 pb-6">
      <button appButton variant="secondary" cdkFocusInitial type="button" (click)="context.answer(false)">
        {{ context.options.cancelLabel || ('common.actions.cancel' | translate) }}
      </button>
      <button
        appButton
        type="button"
        [variant]="context.options.tone === 'primary' ? 'primary' : 'danger'"
        (click)="context.answer(true)"
      >
        {{ context.options.confirmLabel }}
      </button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(@Inject(CONFIRM_DIALOG_CONTEXT) public context: ConfirmDialogContext) {}
}
