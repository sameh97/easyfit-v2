import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GroupTraining } from 'src/app/model/group-training';
import { GroupTrainingService } from 'src/app/services/group-training-service/group-training.service';
import { LanguageService } from 'src/app/services/language.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { classTitle } from './class-schedule';

/** Deletes classes through the existing endpoint, with confirm + toasts. */
@Injectable({
  providedIn: 'root',
})
export class ClassActionsService {
  constructor(
    private trainings: GroupTrainingService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** Emits true when the class was deleted. */
  delete(training: GroupTraining): Observable<boolean> {
    const name: string = classTitle(training.description);
    return this.confirmDialog
      .confirm({
        title: this.language.t('classes.confirm.deleteTitle', { name }),
        message: this.language.t('classes.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.trainings.delete(training.id).pipe(
            map(() => {
              this.toast.success(this.language.t('classes.toast.deleted', { name }));
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('classes.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }
}
