import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Trainer } from 'src/app/model/trainer';
import { LanguageService } from 'src/app/services/language.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { fullName } from '../members-components/member-status';

/** Activate/deactivate and delete trainers through the existing endpoints, with confirm + toasts. */
@Injectable({
  providedIn: 'root',
})
export class TrainerActionsService {
  constructor(
    private trainers: TrainersService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** Deactivating asks first (§7.4); activating doesn't. */
  setActive(trainer: Trainer, active: boolean): Observable<Trainer | null> {
    const name: string = fullName(trainer);
    const confirmed$: Observable<boolean> = active
      ? of(true)
      : this.confirmDialog.confirm({
          title: this.language.t('trainers.confirm.deactivateTitle', { name }),
          message: this.language.t('trainers.confirm.deactivateBody'),
          confirmLabel: this.language.t('trainers.actions.deactivate'),
          tone: 'danger',
        });
    return confirmed$.pipe(
      switchMap((ok: boolean) => {
        if (!ok) {
          return of(null);
        }
        return this.trainers.update({ ...trainer, isActive: active }).pipe(
          tap(() => this.toast.success(this.language.t(active ? 'trainers.toast.activated' : 'trainers.toast.deactivated', { name }))),
          catchError(() => {
            this.toast.error(this.language.t('trainers.toast.saveError', { name }));
            return of(null);
          })
        );
      })
    );
  }

  /** Emits true when the trainer was deleted. */
  delete(trainer: Trainer): Observable<boolean> {
    const name: string = fullName(trainer);
    return this.confirmDialog
      .confirm({
        title: this.language.t('trainers.confirm.deleteTitle', { name }),
        message: this.language.t('trainers.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.trainers.delete(trainer.id).pipe(
            map(() => {
              this.toast.success(this.language.t('trainers.toast.deleted', { name }));
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('trainers.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }
}
