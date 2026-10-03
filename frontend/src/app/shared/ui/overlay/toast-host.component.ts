import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Toast, ToastService } from './toast.service';

/** Bottom-centre stack of dark pill toasts. Lives once in AppComponent so toasts survive navigation. */
@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="studio pointer-events-none fixed inset-x-0 bottom-6 z-[1100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="false"
      [attr.aria-label]="'common.toast.region' | translate"
    >
      <div
        *ngFor="let toast of toasts$ | async; trackBy: trackById"
        class="studio-toast pointer-events-auto flex max-w-full items-center gap-3 rounded-[18px] bg-ink py-3 pe-3 ps-4 text-sm font-semibold text-white shadow-overlay"
        [attr.role]="toast.tone === 'error' ? 'alert' : null"
      >
        <span
          class="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-white"
          [ngClass]="toast.tone === 'success' ? 'bg-[#2E9E62]' : 'bg-danger-dot'"
          aria-hidden="true"
        >
          <app-icon [name]="toast.tone === 'success' ? 'check' : 'alert-circle'" [size]="15" [strokeWidth]="2.5"></app-icon>
        </span>
        <span class="min-w-0">{{ toast.message }}</span>
        <button
          *ngIf="toast.action"
          type="button"
          class="h-8 flex-shrink-0 rounded-full border-0 bg-white bg-opacity-10 px-3 text-[13px] font-bold text-white hover:bg-opacity-20"
          (click)="toasts.runAction(toast)"
        >
          {{ toast.action.label }}
        </button>
        <button
          type="button"
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-0 bg-white bg-opacity-10 p-0 text-white hover:bg-opacity-20"
          [attr.aria-label]="'common.actions.dismiss' | translate"
          (click)="toasts.dismiss(toast.id)"
        >
          <app-icon name="x" [size]="15"></app-icon>
        </button>
      </div>
    </div>
  `,
})
export class ToastHostComponent {
  readonly toasts$: Observable<Toast[]> = this.toasts.toasts$;

  constructor(public toasts: ToastService) {}

  trackById(_index: number, toast: Toast): number {
    return toast.id;
  }
}
