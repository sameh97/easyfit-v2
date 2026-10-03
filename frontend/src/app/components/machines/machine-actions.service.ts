import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Machine } from 'src/app/model/machine';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LanguageService } from 'src/app/services/language.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { MaintenanceStatusService } from 'src/app/services/maintenance-status.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

/** Deletes machines through the existing endpoint, with confirm + toasts. */
@Injectable({
  providedIn: 'root',
})
export class MachineActionsService {
  constructor(
    private machines: MachinesService,
    private scheduler: SchedulerService,
    private alerts: MaintenanceAlertsService,
    private status: MaintenanceStatusService,
    private auth: AuthenticationService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** Emits true when the machine was deleted. The backend also deletes its jobs and alerts. */
  delete(machine: Machine): Observable<boolean> {
    const name: string = machine.name;
    return this.confirmDialog
      .confirm({
        title: this.language.t('machines.confirm.deleteTitle', { name }),
        message: this.language.t('machines.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.machines.delete(machine.serialNumber, this.auth.getGymId()).pipe(
            map(() => {
              this.toast.success(this.language.t('machines.toast.deleted', { name }));
              this.refreshMaintenance();
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('machines.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }

  /** Jobs, alerts and the due/overdue status after a change that touched them on the server. */
  refreshMaintenance(): void {
    this.scheduler.getAll().pipe(take(1)).subscribe({ error: () => undefined });
    this.alerts.reload();
    this.status.reload();
  }
}
