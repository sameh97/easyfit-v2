import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertsState, JobType, MachineAlertGroup, MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { LanguageService } from 'src/app/services/language.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { dayDiff } from 'src/app/shared/ui/week-strip/week-strip.component';

/**
 * The bell panel (§5.10): open maintenance alerts grouped by machine, under the bell at the
 * inline end; a full-width sheet below md. View opens the machine's panel, Done clears that
 * machine's alerts, Clear all (with confirm) clears the gym's. Focus is trapped; Esc and a click
 * outside close it.
 */
@Component({
  selector: 'app-notifications-panel',
  templateUrl: './notifications-panel.component.html',
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  /** The bell: clicks on it toggle the panel, so they don't count as "outside". */
  @Input() anchor: HTMLElement | null = null;
  /** `true` when focus should go back to the bell. */
  @Output() closed: EventEmitter<boolean> = new EventEmitter<boolean>();

  groups: MachineAlertGroup[] = [];
  state: AlertsState = 'loading';
  busySerial: string | null = null;
  clearing: boolean = false;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private alerts: MaintenanceAlertsService,
    private confirmDialog: ConfirmDialogService,
    private toast: ToastService,
    private router: Router,
    private language: LanguageService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(this.alerts.groups$.subscribe((groups: MachineAlertGroup[]) => (this.groups = groups)));
    this.subscriptions.push(this.alerts.state$.subscribe((state: AlertsState) => (this.state = state)));
    this.alerts.reload();
  }

  get summary(): string {
    const alerts: string = this.language.tCount('shell.notifications.panel.alerts', this.alerts.count);
    const machines: string = this.language.tCount('shell.notifications.panel.onMachines', this.groups.length);
    return this.language.t('shell.notifications.panel.summary', { alerts, machines });
  }

  name(group: MachineAlertGroup): string {
    return group.machineName ?? this.language.t('shell.notifications.panel.unknownMachine');
  }

  /** "2 alerts · Clean due" — due when the newest alert fired today, overdue when it is older. */
  detail(group: MachineAlertGroup): string {
    const count: string = this.language.tCount('shell.notifications.panel.alerts', group.alerts.length);
    const types: JobType[] = group.jobTypes;
    const type: string = this.language.t(
      types.length > 1 ? 'shell.notifications.panel.types.both' : `shell.notifications.panel.types.${types[0]}`
    );
    const today: boolean = dayDiff(group.latestAt, new Date()) === 0;
    return `${count} · ${this.language.t(today ? 'shell.notifications.panel.due' : 'shell.notifications.panel.overdue', { type })}`;
  }

  /** "Today, 06:00" · "Yesterday, 06:00" · "Wed, 23 Sep". */
  time(group: MachineAlertGroup): string {
    const days: number = dayDiff(group.latestAt, new Date());
    const time: string = this.language.date(group.latestAt, 'time');
    if (days === 0) {
      return this.language.t('shell.notifications.panel.today', { time });
    }
    if (days === 1) {
      return this.language.t('shell.notifications.panel.yesterday', { time });
    }
    return this.language.date(group.latestAt, 'shortDay');
  }

  view(group: MachineAlertGroup): void {
    this.closed.emit(false);
    this.router.navigate(['/machines'], { queryParams: { machine: group.machineId } });
  }

  done(group: MachineAlertGroup): void {
    const name: string = this.name(group);
    this.busySerial = group.serialNumber;
    this.alerts.clearMachine(group.serialNumber).subscribe(
      () => {
        this.busySerial = null;
        this.toast.success(this.language.t('shell.notifications.panel.toast.done', { name }));
        this.focusTitle();
      },
      () => {
        this.busySerial = null;
        this.toast.error(this.language.t('shell.notifications.panel.toast.error'));
      }
    );
  }

  clearAll(): void {
    this.confirmDialog
      .confirm({
        title: this.language.t('shell.notifications.panel.confirm.title'),
        message: this.language.t('shell.notifications.panel.confirm.body'),
        confirmLabel: this.language.t('shell.notifications.panel.clearAll'),
        tone: 'danger',
      })
      .subscribe((ok: boolean) => {
        if (!ok) {
          return;
        }
        this.clearing = true;
        this.alerts.clearAll().subscribe(
          () => {
            this.clearing = false;
            this.toast.success(this.language.t('shell.notifications.panel.toast.clearedAll'));
            this.focusTitle();
          },
          () => {
            this.clearing = false;
            this.toast.error(this.language.t('shell.notifications.panel.toast.error'));
          }
        );
      });
  }

  retry(): void {
    this.alerts.reload();
  }

  openMaintenance(): void {
    this.closed.emit(false);
  }

  onEscape(event: Event): void {
    event.stopPropagation();
    this.closed.emit(true);
  }

  /** Clicks outside the panel close it; the bell and the confirm dialog (an overlay) don't count. */
  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent): void {
    const target: EventTarget | null = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    if (this.host.nativeElement.contains(target) || this.anchor?.contains(target) || target.closest('.cdk-overlay-container')) {
      return;
    }
    this.closed.emit(false);
  }

  trackBySerial(_index: number, group: MachineAlertGroup): string {
    return group.serialNumber;
  }

  /** The button that was clicked is gone; keep focus inside the panel. */
  private focusTitle(): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>('#notifications-panel-title')?.focus());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
