import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { productCategoryLabel } from 'src/app/common/product-categories';
import {
  DashboardClass,
  DashboardLowStockProduct,
  DashboardMaintenanceJob,
  DashboardSummary,
} from 'src/app/model/dashboard-summary';
import { Member } from 'src/app/model/member';
import { User } from 'src/app/model/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DashboardService } from 'src/app/services/dashboard-service/dashboard.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { ShellStateService } from 'src/app/services/shell-state.service';
import { BarDatum } from 'src/app/shared/ui/bar-chart/bar-chart.component';
import { PillStatus } from 'src/app/shared/ui/status-pill/status-pill.component';
import { SegmentOption } from 'src/app/shared/ui/segmented-control/segmented-control.component';

type ChartMetric = 'income' | 'members' | 'products';
type ClassState = 'done' | 'next' | 'later';
type LoadState = 'loading' | 'ready' | 'error';

interface Kpi {
  label: string;
  value: string;
  chip: string | null;
  chipStatus: PillStatus;
  caption: string;
}

interface ClassRow {
  id: number;
  time: Date;
  name: string;
  detail: string;
  state: ClassState;
}

interface ExpiringRow {
  member: Member;
  name: string;
  note: string;
}

interface MaintenanceRow {
  id: number;
  name: string;
  detail: string;
  due: string;
  urgent: boolean;
}

interface StockRow {
  id: number;
  name: string;
  detail: string;
  left: string;
  critical: boolean;
}

const MONTHS_SHORT: readonly string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const METRIC_COPY: Record<ChartMetric, { title: string; unit: string; question: string }> = {
  income: { title: 'Income', unit: 'Monthly', question: 'Explain my monthly income this year' },
  members: { title: 'New members', unit: 'Joined per month', question: 'Explain how many members joined each month this year' },
  products: { title: 'Products sold', unit: 'Units per month', question: 'Explain my product sales this year' },
};

const DAY_MS = 86400000;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  summary: DashboardSummary | null = null;
  firstName: string = '';
  aiPanelOpen: boolean = false;
  readonly today: Date = new Date();

  metric: ChartMetric = 'income';
  readonly metricOptions: SegmentOption[] = [
    { value: 'income', label: 'Income' },
    { value: 'members', label: 'Members' },
    { value: 'products', label: 'Products sold' },
  ];

  // View models, rebuilt whenever a summary arrives.
  kpis: Kpi[] = [];
  bars: BarDatum[] = [];
  classes: ClassRow[] = [];
  expiring: ExpiringRow[] = [];
  maintenance: MaintenanceRow[] = [];
  stock: StockRow[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthenticationService,
    private dashboardService: DashboardService,
    private actions: ShellActionsService,
    private shell: ShellStateService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.firstName = user?.firstName ?? '';
      })
    );
    this.subscriptions.push(
      this.dashboardService.summary$.subscribe((summary: DashboardSummary | null) => {
        if (summary) {
          this.apply(summary);
        }
      })
    );
    this.subscriptions.push(this.shell.aiPanelOpen$.subscribe((open: boolean) => (this.aiPanelOpen = open)));
    this.reload();
  }

  reload(): void {
    if (!this.summary) {
      this.state = 'loading';
    }
    this.subscriptions.push(
      this.dashboardService.load().subscribe({
        error: () => {
          // Keep showing the last good data if there is any.
          if (!this.summary) {
            this.state = 'error';
          }
        },
      })
    );
  }

  // ---- Header ----------------------------------------------------------

  get greeting(): string {
    const hour: number = new Date().getHours();
    const part: string = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return this.firstName ? `Good ${part}, ${this.firstName}` : `Good ${part}`;
  }

  get gymName(): string {
    return this.summary?.gym.name ?? '';
  }

  // ---- Actions ---------------------------------------------------------

  addMember(): void {
    this.actions.create('add-member').pipe(take(1)).subscribe();
  }

  sellProduct(): void {
    this.shell.openPalette('sell-product');
  }

  newClass(): void {
    this.actions.create('new-class').pipe(take(1)).subscribe();
  }

  renew(row: ExpiringRow): void {
    this.actions.editMember(row.member).pipe(take(1)).subscribe();
  }

  explain(): void {
    this.shell.openAiPanel(METRIC_COPY[this.metric].question);
  }

  setMetric(value: string): void {
    if (value === 'income' || value === 'members' || value === 'products') {
      this.metric = value;
      if (this.summary) {
        this.bars = this.buildBars(this.summary);
      }
    }
  }

  // ---- Chart copy ------------------------------------------------------

  get chartTitle(): string {
    return METRIC_COPY[this.metric].title;
  }

  get chartSubtitle(): string {
    if (!this.summary) {
      return '';
    }
    const total: number = this.series(this.summary).reduce((sum: number, v: number) => sum + v, 0);
    const formatted: string = this.metric === 'income' ? this.money(total) : total.toLocaleString('en-US');
    return `${METRIC_COPY[this.metric].unit}, ${this.today.getFullYear()} · ${formatted} so far`;
  }

  get chartIsEmpty(): boolean {
    return !!this.summary && this.series(this.summary).every((v: number) => v === 0);
  }

  // ---- View-model builders --------------------------------------------

  private apply(summary: DashboardSummary): void {
    this.summary = summary;
    this.state = 'ready';
    this.kpis = this.buildKpis(summary);
    this.bars = this.buildBars(summary);
    this.classes = this.buildClasses(summary.classesToday.list);
    this.expiring = summary.expiring.list.map((entry: { member: Member; daysLeft: number }) => ({
      member: entry.member,
      name: `${entry.member.firstName} ${entry.member.lastName}`,
      note: this.expiryNote(entry.daysLeft),
    }));
    this.maintenance = summary.maintenance.map((job: DashboardMaintenanceJob) => this.buildMaintenanceRow(job));
    this.stock = summary.lowStock.map((product: DashboardLowStockProduct) => ({
      id: product.id,
      name: product.name,
      detail: `${productCategoryLabel(product.categoryID)} · ${this.money(product.price)}`,
      left: product.quantity <= 0 ? 'Out of stock' : `${product.quantity} left`,
      critical: product.quantity <= 2,
    }));
  }

  private buildKpis(summary: DashboardSummary): Kpi[] {
    const month: number = this.today.getMonth();
    const nextClass: DashboardClass | undefined = summary.classesToday.list.find(
      (c: DashboardClass) => new Date(c.startTime).getTime() > Date.now()
    );
    const change: number | null = summary.revenue.changePct;

    return [
      {
        label: 'Active members',
        value: summary.members.active.toLocaleString('en-US'),
        chip: summary.members.newThisMonth > 0 ? `↑ ${summary.members.newThisMonth}` : null,
        chipStatus: 'active',
        caption: summary.members.newThisMonth > 0 ? 'New this month' : 'No new members this month',
      },
      {
        label: 'Expiring this week',
        value: String(summary.expiring.within7Days),
        chip: summary.expiring.within7Days > 0 ? 'Action' : null,
        chipStatus: 'expiring',
        caption:
          summary.expiring.within7Days > 0
            ? `${summary.expiring.within3Days} in the next 3 days`
            : 'Nothing expires in the next 7 days',
      },
      {
        label: 'Classes today',
        value: String(summary.classesToday.total),
        chip: summary.classesToday.total > 0 ? `${summary.classesToday.remaining} left` : null,
        chipStatus: 'neutral',
        caption: nextClass
          ? `Next: ${this.className(nextClass.description)} at ${this.time(nextClass.startTime)}`
          : summary.classesToday.total > 0
          ? 'No more classes today'
          : 'No classes scheduled today',
      },
      {
        label: `Revenue · ${MONTHS_LONG[month]}`,
        value: this.money(summary.revenue.thisMonth),
        chip: change === null ? null : `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%`,
        chipStatus: change !== null && change >= 0 ? 'active' : 'expiring',
        caption:
          summary.revenue.lastMonthSamePeriod > 0
            ? `vs ${this.money(summary.revenue.lastMonthSamePeriod)} same period last month`
            : 'No sales in the same period last month',
      },
    ];
  }

  private series(summary: DashboardSummary): number[] {
    switch (this.metric) {
      case 'members':
        return summary.newMembersByMonth;
      case 'products':
        return summary.productsSoldByMonth;
      default:
        return summary.incomeByMonth;
    }
  }

  private buildBars(summary: DashboardSummary): BarDatum[] {
    const values: number[] = this.series(summary);
    return values.map((value: number, index: number) => {
      const current: boolean = index === values.length - 1;
      return {
        label: MONTHS_SHORT[index],
        value,
        highlight: current,
        valueLabel: this.metric === 'income' ? (current ? this.money(value) : this.compactMoney(value)) : value.toLocaleString('en-US'),
      };
    });
  }

  private buildClasses(list: DashboardClass[]): ClassRow[] {
    const now: number = Date.now();
    let nextFound: boolean = false;
    return list.map((c: DashboardClass) => {
      const start: Date = new Date(c.startTime);
      let state: ClassState = 'later';
      if (start.getTime() <= now) {
        state = 'done';
      } else if (!nextFound) {
        state = 'next';
        nextFound = true;
      }
      const people: string = `${c.memberCount} ${c.memberCount === 1 ? 'member' : 'members'}`;
      return {
        id: c.id,
        time: start,
        name: this.className(c.description),
        detail: c.trainerName ? `${c.trainerName} · ${people}` : people,
        state,
      };
    });
  }

  private buildMaintenanceRow(job: DashboardMaintenanceJob): MaintenanceRow {
    const due: Date = new Date(job.nextDue);
    const days: number = this.daysFromToday(due);
    let label: string;
    if (days <= 0) {
      label = 'Due today';
    } else if (days === 1) {
      label = 'Tomorrow';
    } else {
      label = due.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return {
      id: job.jobId,
      name: job.machineName,
      detail: `${job.jobType === 'clean' ? 'Clean' : 'Service'} · SN ${job.serialNumber}`,
      due: label,
      urgent: days <= 0,
    };
  }

  // ---- Formatting ------------------------------------------------------

  private expiryNote(daysLeft: number): string {
    if (daysLeft <= 0) {
      return 'Expires today';
    }
    if (daysLeft === 1) {
      return 'Expires tomorrow';
    }
    return `Expires in ${daysLeft} days`;
  }

  /** Class descriptions are free text; show the part before a colon as the class name. */
  private className(description: string): string {
    const head: string = description.split(':')[0].trim();
    return head || description;
  }

  private time(iso: string): string {
    const d: Date = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private daysFromToday(date: Date): number {
    const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((startOf(date) - startOf(new Date())) / DAY_MS);
  }

  money(value: number): string {
    return `₪${Math.round(value).toLocaleString('en-US')}`;
  }

  private compactMoney(value: number): string {
    return value >= 1000 ? `₪${Math.round(value / 1000)}k` : this.money(value);
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  trackByLabel(_index: number, item: Kpi): string {
    return item.label;
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    if (this.authService.isAuthenticated()) {
      //TODO: find a better way
      event.preventDefault();
      window.history.forward();
    }
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
