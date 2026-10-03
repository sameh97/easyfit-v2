import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { formatMoney } from 'src/app/common/money';
import { Machine } from 'src/app/model/machine';
import { MaintenanceStatus } from 'src/app/model/maintenance-status';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { LanguageService } from 'src/app/services/language.service';
import { MachinesService } from 'src/app/services/machines-service/machines.service';
import { MachineAlertGroup, MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { MaintenanceStatusService } from 'src/app/services/maintenance-status.service';
import { SchedulerService } from 'src/app/services/scheduler-service/scheduler.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { jobViews, machineViews, MachineView } from '../machine-status';

type LoadState = 'loading' | 'ready' | 'error';
export type MachineFilter = 'all' | 'attention' | 'ok';

const FILTERS: readonly MachineFilter[] = ['all', 'attention', 'ok'];
const SKELETON_CARDS: readonly number[] = [1, 2, 3, 4, 5, 6];

/**
 * Machines (redesign.md §5.5): a card grid with a status badge from the machine's maintenance
 * jobs (GET /api/maintenance/status), a search and an All · Needs attention · OK filter, the
 * detail panel with open alerts and jobs, and the add/edit side panel. Deep link ?machine=<id>.
 */
@Component({
  selector: 'app-machines-page',
  templateUrl: './machines-page.component.html',
})
export class MachinesPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  views: MachineView[] = [];
  filtered: MachineView[] = [];
  filter: MachineFilter = 'all';
  query: string = '';
  selectedId: number | null = null;
  wide: boolean = true;
  readonly filters: readonly MachineFilter[] = FILTERS;
  readonly skeletonCards: readonly number[] = SKELETON_CARDS;

  private machines: Machine[] | null = null;
  private jobs: ScheduledJob[] = [];
  private status: MaintenanceStatus | null = null;
  private alertGroups: MachineAlertGroup[] = [];
  private pendingId: number | null = null;
  /** ?serial=<serial number> (the dashboard's Maintenance rows), resolved to ?machine=<id>. */
  private pendingSerial: string | null = null;
  private machinesSubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private machinesService: MachinesService,
    private scheduler: SchedulerService,
    private statusService: MaintenanceStatusService,
    private alerts: MaintenanceAlertsService,
    private shellActions: ShellActionsService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.subscriptions.push(
      this.scheduler.getAll().subscribe(
        (jobs: ScheduledJob[] | null) => {
          this.jobs = jobs ?? [];
          this.rebuild();
        },
        () => undefined
      )
    );
    this.statusService.reload();
    // A job fired: jobs may have been added or changed elsewhere, so reload them with the status.
    this.subscriptions.push(this.alerts.arrived$.subscribe(() => this.scheduler.getAll().pipe(take(1)).subscribe({ error: () => undefined })));
    this.subscriptions.push(
      combineLatest([this.statusService.status$, this.alerts.groups$]).subscribe(
        ([status, groups]: [MaintenanceStatus | null, MachineAlertGroup[]]) => {
          this.status = status;
          this.alertGroups = groups;
          this.rebuild();
        }
      )
    );
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const id: number = Number(params.get('machine'));
        this.pendingId = Number.isInteger(id) && id > 0 ? id : null;
        this.pendingSerial = params.get('serial');
        if (this.pendingId === null && this.pendingSerial === null) {
          this.selectedId = null;
        }
        this.resolvePending();
      })
    );
    this.subscriptions.push(
      this.breakpointObserver.observe('(min-width: 1024px)').subscribe(() => {
        this.wide = this.breakpointObserver.isMatched('(min-width: 1024px)');
      })
    );
  }

  load(): void {
    this.state = 'loading';
    this.machinesSubscription?.unsubscribe();
    this.machinesSubscription = this.machinesService.getAll().subscribe(
      (machines: Machine[] | null) => {
        if (machines === null) {
          return;
        }
        this.machines = machines;
        this.state = 'ready';
        this.rebuild();
        this.resolvePending();
        if (this.selectedId !== null && !this.selected && this.pendingId === null) {
          this.closeDetail();
        }
      },
      () => (this.state = 'error')
    );
  }

  private rebuild(): void {
    if (!this.machines) {
      return;
    }
    const openAlerts = new Map<string, number>(this.alertGroups.map((group: MachineAlertGroup) => [group.serialNumber, group.alerts.length]));
    this.views = machineViews(this.machines, jobViews(this.jobs, this.status), openAlerts).sort((a: MachineView, b: MachineView) =>
      a.machine.name.localeCompare(b.machine.name, undefined, { sensitivity: 'base' }) || String(a.machine.serialNumber).localeCompare(String(b.machine.serialNumber))
    );
    this.refilter();
  }

  // ---- Filtering -----------------------------------------------------------------

  get counts(): Record<MachineFilter, number> {
    const attention: number = this.views.filter((view: MachineView) => view.needsAttention).length;
    return { all: this.views.length, attention, ok: this.views.length - attention };
  }

  get subtitle(): string {
    const machines: string = this.language.tCount('machines.page.count', this.views.length);
    const attention: number = this.counts.attention;
    return attention ? `${machines} · ${this.language.tCount('machines.page.attention', attention)}` : machines;
  }

  setFilter(filter: MachineFilter): void {
    this.filter = filter;
    this.refilter();
  }

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  private refilter(): void {
    const q: string = this.query.trim().toLowerCase();
    this.filtered = this.views.filter((view: MachineView) => {
      if (this.filter === 'attention' && !view.needsAttention) {
        return false;
      }
      if (this.filter === 'ok' && view.needsAttention) {
        return false;
      }
      return !q || view.machine.name.toLowerCase().includes(q) || String(view.machine.serialNumber).toLowerCase().includes(q);
    });
  }

  // ---- Cards -----------------------------------------------------------------------

  photo(view: MachineView): string | null {
    return realPhotoUrl(view.machine.imgUrl);
  }

  alertsLabel(view: MachineView): string {
    return this.language.tCount('shell.notifications.panel.alerts', view.openAlerts);
  }

  /** "2024 · ₪18,500" */
  meta(view: MachineView): string {
    return `${view.machine.productionYear} · ${formatMoney(view.machine.price)}`;
  }

  /** Waits for the status before showing badges, so cards don't flash "No jobs". */
  get statusReady(): boolean {
    return this.status !== null;
  }

  add(): void {
    this.shellActions.addMachine().subscribe((machine: Machine | undefined) => machine && this.select(machine));
  }

  trackById(_index: number, view: MachineView): number {
    return view.machine.id;
  }

  // ---- Detail panel ----------------------------------------------------------------

  get selected(): MachineView | null {
    return this.selectedId === null ? null : this.views.find((view: MachineView) => view.machine.id === this.selectedId) ?? null;
  }

  get selectedAlerts(): MachineAlertGroup | null {
    const view: MachineView | null = this.selected;
    return view ? this.alertGroups.find((group: MachineAlertGroup) => group.serialNumber === String(view.machine.serialNumber)) ?? null : null;
  }

  get narrow(): boolean {
    return this.wide && this.selected !== null;
  }

  select(machine: Machine): void {
    this.selectedId = machine.id;
    this.router.navigate([], { relativeTo: this.route, queryParams: { machine: machine.id }, replaceUrl: true });
  }

  closeDetail(): void {
    this.selectedId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { machine: null }, replaceUrl: true });
  }

  private resolvePending(): void {
    if (this.state !== 'ready' || !this.machines) {
      return;
    }
    if (this.pendingSerial !== null) {
      const serial: string = this.pendingSerial;
      this.pendingSerial = null;
      const machine: Machine | undefined = this.machines.find((m: Machine) => String(m.serialNumber) === serial);
      if (machine) {
        this.router.navigate([], { relativeTo: this.route, queryParams: { machine: machine.id, serial: null }, queryParamsHandling: 'merge', replaceUrl: true });
      } else {
        this.toast.error(this.language.t('machines.toast.notFound'));
        this.router.navigate([], { relativeTo: this.route, queryParams: { serial: null }, queryParamsHandling: 'merge', replaceUrl: true });
      }
      return;
    }
    if (this.pendingId === null) {
      return;
    }
    const id: number = this.pendingId;
    this.pendingId = null;
    if (this.machines.some((machine: Machine) => machine.id === id)) {
      this.selectedId = id;
    } else {
      this.toast.error(this.language.t('machines.toast.notFound'));
      this.closeDetail();
    }
  }

  ngOnDestroy(): void {
    this.machinesSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
