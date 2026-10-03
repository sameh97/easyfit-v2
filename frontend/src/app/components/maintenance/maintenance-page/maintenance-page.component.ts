import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Machine } from 'src/app/model/machine';
import { MaintenanceStatus } from 'src/app/model/maintenance-status';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { LanguageService } from 'src/app/services/language.service';
import { JobType, MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { MaintenanceStatusService, StatusState } from 'src/app/services/maintenance-status.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { dayDiff } from 'src/app/shared/ui/week-strip/week-strip.component';
import { dayTime, jobViews } from '../../machines/machine-status';
import { JobActionsService } from '../job-actions.service';
import { groupOf, JobGroup, JobRow, JOB_GROUPS, sortRows } from '../maintenance-groups';

type LoadState = 'loading' | 'ready' | 'error';
export type TypeFilter = 'all' | JobType;

const TYPE_FILTERS: readonly TypeFilter[] = ['all', 'clean', 'service'];
const SKELETON_ROWS: readonly number[] = [1, 2, 3, 4, 5];
const HOUR_MS: number = 60 * 60 * 1000;

export interface RowGroup {
  group: JobGroup;
  rows: JobRow[];
}

/**
 * Maintenance (redesign.md §5.6): jobs grouped Overdue / Today / This week / Later / Inactive by the
 * status endpoint, Mark done on rows with an open alert, Edit, Deactivate/Activate and Delete, a
 * Clean / Service filter and a machine search (?machine=<serial> prefills it).
 */
@Component({
  selector: 'app-maintenance-page',
  templateUrl: './maintenance-page.component.html',
})
export class MaintenancePageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  statusState: StatusState = 'loading';
  rows: JobRow[] = [];
  groups: RowGroup[] = [];
  typeFilter: TypeFilter = 'all';
  query: string = '';
  busySerial: string | null = null;
  readonly typeFilters: readonly TypeFilter[] = TYPE_FILTERS;
  readonly skeletonRows: readonly number[] = SKELETON_ROWS;

  private jobs: ScheduledJob[] | null = null;
  private machines: Machine[] = [];
  private status: MaintenanceStatus | null = null;
  private jobsSubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private scheduler: SchedulerService,
    private machinesService: MachinesService,
    private statusService: MaintenanceStatusService,
    private alerts: MaintenanceAlertsService,
    private actions: JobActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    private route: ActivatedRoute,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.statusService.reload();
    this.subscriptions.push(
      this.machinesService.getAll().subscribe(
        (machines: Machine[] | null) => {
          this.machines = machines ?? [];
          this.rebuild();
        },
        () => undefined
      )
    );
    this.subscriptions.push(
      combineLatest([this.statusService.status$, this.statusService.state$]).subscribe(([status, state]: [MaintenanceStatus | null, StatusState]) => {
        this.status = status;
        this.statusState = state;
        this.rebuild();
      })
    );
    // A job fired: jobs may have changed elsewhere, reload them with the status.
    this.subscriptions.push(this.alerts.arrived$.subscribe(() => this.scheduler.getAll().pipe(take(1)).subscribe({ error: () => undefined })));
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const machine: string | null = params.get('machine');
        if (machine) {
          this.query = machine;
          this.regroup();
        }
      })
    );
    this.subscriptions.push(this.language.lang$.subscribe(() => this.regroup()));
  }

  load(): void {
    this.state = 'loading';
    this.jobsSubscription?.unsubscribe();
    this.jobsSubscription = this.scheduler.getAll().subscribe(
      (jobs: ScheduledJob[] | null) => {
        this.jobs = jobs ?? [];
        this.state = 'ready';
        this.rebuild();
      },
      () => (this.state = 'error')
    );
  }

  retry(): void {
    if (this.state === 'error') {
      this.load();
    }
    this.statusService.reload();
  }

  /** Rows wait for the status: without it a job's group isn't known. */
  get loading(): boolean {
    return this.state === 'loading' || (this.state === 'ready' && !this.status && this.statusState === 'loading');
  }

  get statusError(): boolean {
    return this.state === 'ready' && !this.status && this.statusState === 'error';
  }

  private rebuild(): void {
    if (!this.jobs || !this.status) {
      return;
    }
    const machines = new Map<string, Machine>(this.machines.map((machine: Machine) => [String(machine.serialNumber), machine]));
    const now: Date = new Date();
    this.rows = jobViews(this.jobs, this.status).map((view) => ({
      ...view,
      group: groupOf(view, now),
      machine: machines.get(view.job.machineSerialNumber) ?? null,
    }));
    this.regroup();
  }

  // ---- Filters -------------------------------------------------------------------

  get counts(): Record<TypeFilter, number> {
    const clean: number = this.rows.filter((row: JobRow) => row.type === 'clean').length;
    return { all: this.rows.length, clean, service: this.rows.length - clean };
  }

  /** "14 jobs on 12 machines · 3 need attention" — attention = the sidebar badge. */
  get subtitle(): string {
    const machines: number = new Set<string>(this.rows.map((row: JobRow) => row.job.machineSerialNumber)).size;
    const base: string = this.language.t('maintenance.page.summary', {
      jobs: this.language.tCount('maintenance.page.jobs', this.rows.length),
      machines: this.language.tCount('maintenance.page.onMachines', machines),
    });
    const due: number = this.status?.due.total ?? 0;
    return due ? `${base} · ${this.language.tCount('machines.page.attention', due)}` : base;
  }

  setTypeFilter(filter: TypeFilter): void {
    this.typeFilter = filter;
    this.regroup();
  }

  onSearch(value: string): void {
    this.query = value;
    this.regroup();
  }

  get filtering(): boolean {
    return this.typeFilter !== 'all' || this.query.trim() !== '';
  }

  private regroup(): void {
    const q: string = this.query.trim().toLowerCase();
    const visible: JobRow[] = this.rows.filter(
      (row: JobRow) =>
        (this.typeFilter === 'all' || row.type === this.typeFilter) &&
        (!q || row.job.machineSerialNumber.toLowerCase().includes(q) || (row.machine?.name ?? '').toLowerCase().includes(q))
    );
    this.groups = JOB_GROUPS.map((group: JobGroup) => ({ group, rows: sortRows(visible.filter((row: JobRow) => row.group === group)) })).filter(
      (entry: RowGroup) => entry.rows.length > 0
    );
  }

  // ---- Rows ------------------------------------------------------------------------

  machineName(row: JobRow): string {
    return row.machine?.name ?? this.language.t('shell.notifications.panel.unknownMachine');
  }

  every(row: JobRow): string {
    return this.language.tCount('maintenance.row.every', Number(row.job.daysFrequency));
  }

  /** Main "when" line: the overdue run, the next run, or Paused / Ended. */
  when(row: JobRow): string {
    if (row.group === 'overdue' && row.status?.oldestOpenAlertAt) {
      return dayTime(new Date(row.status.oldestOpenAlertAt), this.language);
    }
    if (row.group === 'inactive') {
      return this.language.t(row.job.isActive ? 'maintenance.row.ended' : 'maintenance.row.paused');
    }
    return row.nextRun ? dayTime(row.nextRun, this.language) : '';
  }

  /** The caption under it: "7 days ago · alert still open", "Alert sent", "In 6 hours", "Ended 1 Sep 2026". */
  note(row: JobRow): string {
    const now: Date = new Date();
    if (row.group === 'overdue' && row.status?.oldestOpenAlertAt) {
      const days: number = dayDiff(new Date(row.status.oldestOpenAlertAt), now);
      return `${this.language.tCount('maintenance.row.daysAgo', days)} · ${this.language.t('maintenance.row.alertOpen')}`;
    }
    if (row.group === 'inactive') {
      const end: Date = new Date(row.job.endTime);
      return this.language.t(end.getTime() < now.getTime() ? 'maintenance.row.endedOn' : 'maintenance.row.endsOn', {
        date: this.language.date(end, 'date'),
      });
    }
    if (row.status?.openAlerts) {
      return this.language.t('maintenance.row.alertSent');
    }
    if (!row.nextRun) {
      return '';
    }
    if (row.group === 'today') {
      const hours: number = Math.round((row.nextRun.getTime() - now.getTime()) / HOUR_MS);
      return hours > 0 ? this.language.tCount('maintenance.row.inHours', hours) : this.language.t('maintenance.row.dueNow');
    }
    return this.language.tCount('maintenance.row.inDays', dayDiff(now, row.nextRun));
  }

  isDanger(group: JobGroup): boolean {
    return group === 'overdue' || group === 'today';
  }

  groupLabel(group: JobGroup): string {
    return this.language.t(`maintenance.groups.${group}`);
  }

  // ---- Actions ---------------------------------------------------------------------

  add(): void {
    this.shellActions.scheduleMaintenance().subscribe();
  }

  edit(row: JobRow): void {
    this.shellActions.editJob(row.job).subscribe();
  }

  markDone(row: JobRow): void {
    this.busySerial = row.job.machineSerialNumber;
    this.actions.markDone(row.job.machineSerialNumber, row.machine?.name ?? null).subscribe(() => (this.busySerial = null));
  }

  openMoreMenu(event: Event, row: JobRow): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [
      {
        id: 'toggle',
        label: this.language.t(row.job.isActive ? 'maintenance.actions.deactivate' : 'maintenance.actions.activate'),
        icon: 'power',
      },
      { id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' },
    ];
    const name: string | null = row.machine?.name ?? null;
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'toggle') {
        this.actions.setActive(row.job, !row.job.isActive, name).subscribe();
      } else if (id === 'delete') {
        this.actions.delete(row.job, name).subscribe();
      }
    });
  }

  trackByGroup(_index: number, group: RowGroup): string {
    return group.group;
  }

  trackByJob(_index: number, row: JobRow): number {
    return row.job.id;
  }

  ngOnDestroy(): void {
    this.jobsSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
