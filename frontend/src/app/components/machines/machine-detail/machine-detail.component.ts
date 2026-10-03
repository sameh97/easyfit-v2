import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatMoney } from 'src/app/common/money';
import { Machine } from 'src/app/model/machine';
import { LanguageService } from 'src/app/services/language.service';
import { MachineAlertGroup, MaintenanceAlert, MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { MachineActionsService } from '../machine-actions.service';
import { dayTime, JobView, MachineView } from '../machine-status';

/**
 * Machine detail panel (§5.5): photo, badge, Edit and Delete; the machine's open alerts with Done
 * and Clear all (this replaces the machine-notifications dialog, same endpoints); its maintenance
 * jobs (type, every N days, next run) linking to Maintenance; serial number, year, price, description.
 */
@Component({
  selector: 'app-machine-detail',
  templateUrl: './machine-detail.component.html',
  styles: [':host { display: flex; flex-direction: column; min-height: 0; }'],
})
export class MachineDetailComponent {
  @Input() view!: MachineView;
  /** This machine's open alerts (null when there are none). */
  @Input() alertGroup: MachineAlertGroup | null = null;
  @Output() deleted: EventEmitter<void> = new EventEmitter<void>();

  busyAlertId: number | null = null;
  clearing: boolean = false;

  constructor(
    private shellActions: ShellActionsService,
    private actions: MachineActionsService,
    private alerts: MaintenanceAlertsService,
    private menu: MenuService,
    private toast: ToastService,
    public language: LanguageService
  ) {}

  get photo(): string | null {
    return realPhotoUrl(this.view.machine.imgUrl);
  }

  get price(): string {
    return formatMoney(this.view.machine.price);
  }

  alertLabel(alert: MaintenanceAlert): string {
    return `${this.language.t(`maintenance.types.${alert.jobType}`)} · ${dayTime(alert.createdAt, this.language)}`;
  }

  every(view: JobView): string {
    return this.language.tCount('maintenance.row.every', Number(view.job.daysFrequency));
  }

  /** "Next run today, 06:00" · "Paused" · "No runs left". */
  nextLabel(view: JobView): string {
    if (!view.job.isActive) {
      return this.language.t('maintenance.row.paused');
    }
    return view.nextRun
      ? this.language.t('maintenance.row.nextRun', { when: dayTime(view.nextRun, this.language) })
      : this.language.t('maintenance.row.noRunsLeft');
  }

  edit(): void {
    this.shellActions
      .editMachine(this.view.machine)
      .subscribe((saved: Machine | undefined) => saved && this.actions.refreshMaintenance());
  }

  scheduleJob(): void {
    this.shellActions.scheduleMaintenance(this.view.machine.serialNumber).subscribe();
  }

  openMoreMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.delete(this.view.machine).subscribe((done: boolean) => done && this.deleted.emit());
      }
    });
  }

  done(alert: MaintenanceAlert): void {
    this.busyAlertId = alert.id;
    this.alerts.markDone(alert).subscribe(
      () => {
        this.busyAlertId = null;
        this.toast.success(this.language.t('machines.toast.alertDone'));
      },
      () => {
        this.busyAlertId = null;
        this.toast.error(this.language.t('shell.notifications.panel.toast.error'));
      }
    );
  }

  clearAll(): void {
    this.clearing = true;
    const name: string = this.view.machine.name;
    this.alerts.clearMachine(this.view.machine.serialNumber).subscribe(
      () => {
        this.clearing = false;
        this.toast.success(this.language.t('shell.notifications.panel.toast.done', { name }));
      },
      () => {
        this.clearing = false;
        this.toast.error(this.language.t('shell.notifications.panel.toast.error'));
      }
    );
  }

  trackByAlert(_index: number, alert: MaintenanceAlert): number {
    return alert.id;
  }

  trackByJob(_index: number, view: JobView): number {
    return view.job.id;
  }
}
