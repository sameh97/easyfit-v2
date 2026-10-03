import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastTone = 'success' | 'error';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action: ToastAction | null;
}

/** Success toasts disappear after 4 s; errors stay until dismissed (§7.4). */
const SUCCESS_DURATION_MS = 4000;
/** Toasts beyond this are dropped, oldest first. */
const MAX_TOASTS = 3;

/** Studio toasts, shown bottom-centre by <app-toast-host>. Replaces the snackbar on redesigned pages. */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  private nextId: number = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  success(message: string, action: ToastAction | null = null): number {
    return this.show(message, 'success', action);
  }

  error(message: string, action: ToastAction | null = null): number {
    return this.show(message, 'error', action);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toastsSubject.next(this.toastsSubject.value.filter((toast: Toast) => toast.id !== id));
  }

  /** Runs the action, then closes the toast. */
  runAction(toast: Toast): void {
    this.dismiss(toast.id);
    toast.action?.run();
  }

  private show(message: string, tone: ToastTone, action: ToastAction | null): number {
    const toast: Toast = { id: this.nextId++, message, tone, action };
    const toasts: Toast[] = [...this.toastsSubject.value, toast];
    toasts.slice(0, Math.max(0, toasts.length - MAX_TOASTS)).forEach((old: Toast) => this.dismiss(old.id));
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    if (tone === 'success') {
      this.timers.set(
        toast.id,
        setTimeout(() => this.dismiss(toast.id), SUCCESS_DURATION_MS)
      );
    }
    return toast.id;
  }
}
