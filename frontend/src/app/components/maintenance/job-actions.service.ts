import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { LanguageService } from 'src/app/services/language.service';
import { jobTypeOf, MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { MaintenanceStatusService } from 'src/app/services/maintenance-status.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

/**
 * Maintenance job actions through the existing endpoints, with confirm + toasts: activate /
 * deactivate (PUT /api/update-schedule), delete, and Mark done (clears the machine's alerts).
 * Each refreshes the status, so badges and groups move right away.
 */
@Injectable({
  providedIn: 'root',
})
export class JobActionsService {
  constructor(
    private scheduler: SchedulerService,
    private alerts: MaintenanceAlertsService,
    private status: MaintenanceStatusService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** "Clean · Treadmill Pro" */
  label(job: ScheduledJob, machineName: string | null): string {
    const type: string = this.language.t(`maintenance.types.${jobTypeOf(job.jobID)}`);
    return machineName ? `${type} · ${machineName}` : type;
  }

  /** Deactivating asks first (§7.4); activating doesn't. */
  setActive(job: ScheduledJob, active: boolean, machineName: string | null): Observable<ScheduledJob | null> {
    const name: string = this.label(job, machineName);
    const confirmed$: Observable<boolean> = active
      ? of(true)
      : this.confirmDialog.confirm({
          title: this.language.t('maintenance.confirm.deactivateTitle', { name }),
          message: this.language.t('maintenance.confirm.deactivateBody'),
          confirmLabel: this.language.t('maintenance.actions.deactivate'),
          tone: 'danger',
        });
    return confirmed$.pipe(
      switchMap((ok: boolean) => {
        if (!ok) {
          return of(null);
        }
        return this.scheduler.update({ ...job, isActive: active }).pipe(
          tap(() => {
            this.toast.success(this.language.t(active ? 'maintenance.toast.activated' : 'maintenance.toast.deactivated', { name }));
            this.status.reload();
          }),
          catchError(() => {
            this.toast.error(this.language.t('maintenance.toast.saveError', { name }));
            return of(null);
          })
        );
      })
    );
  }

  /** Emits true when the job was deleted. */
  delete(job: ScheduledJob, machineName: string | null): Observable<boolean> {
    const name: string = this.label(job, machineName);
    return this.confirmDialog
      .confirm({
        title: this.language.t('maintenance.confirm.deleteTitle', { name }),
        message: this.language.t('maintenance.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.scheduler.delete(job.id).pipe(
            map(() => {
              this.toast.success(this.language.t('maintenance.toast.deleted', { name }));
              this.status.reload();
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('maintenance.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }

  /** Mark done (§5.6): clears the machine's open alerts (DELETE /api/machine-notifications). */
  markDone(serialNumber: string, machineName: string | null): Observable<boolean> {
    const name: string = machineName ?? serialNumber;
    return this.alerts.clearMachine(serialNumber).pipe(
      map(() => {
        this.toast.success(this.language.t('shell.notifications.panel.toast.done', { name }));
        return true;
      }),
      catchError(() => {
        this.toast.error(this.language.t('shell.notifications.panel.toast.error'));
        return of(false);
      })
    );
  }
}
