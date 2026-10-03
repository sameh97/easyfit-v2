import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { productCategoryKey } from 'src/app/common/product-categories';
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
import { Lang, LanguageService } from 'src/app/services/language.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
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
  jobType: string;
  /** Always shown left to right (§7.8). */
  serialNumber: string;
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

const METRICS: readonly ChartMetric[] = ['income', 'members', 'products'];

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
  metricOptions: SegmentOption[] = [];

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
    private shell: ShellStateService,
    private language: LanguageService,
    private router: Router
  ) {}

  private t(key: string, params?: Record<string, string | number>): string {
    return this.language.t(key, params);
  }

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
    // Everything below is built in code, so rebuild it in the new language.
    this.subscriptions.push(
      this.language.lang$.subscribe((_lang: Lang) => {
        this.metricOptions = METRICS.map((metric: ChartMetric) => ({
          value: metric,
          label: this.t(`dashboard.chart.${metric}.tab`),
        }));
        if (this.summary) {
          this.apply(this.summary);
        }
      })
    );
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
    return this.firstName
      ? this.t(`dashboard.greeting.${part}`, { name: this.firstName })
      : this.t(`dashboard.greeting.${part}NoName`);
  }

  get subtitle(): string {
    const date: string = this.language.date(this.today, 'longDay');
    return this.gymName ? `${date} · ${this.gymName}` : date;
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

  /** Opens the member's detail panel (quick renew lives there). */
  renew(row: ExpiringRow): void {
    this.router.navigate(['/members'], { queryParams: { member: row.member.id } });
  }

  explain(): void {
    this.shell.openAiPanel(this.t(`dashboard.chart.${this.metric}.question`));
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
    return this.t(`dashboard.chart.${this.metric}.title`);
  }

  get chartSubtitle(): string {
    if (!this.summary) {
      return '';
    }
    const total: number = this.series(this.summary).reduce((sum: number, v: number) => sum + v, 0);
    const formatted: string = this.metric === 'income' ? this.money(total) : total.toLocaleString('en-US');
    return this.t('dashboard.chart.subtitle', {
      unit: this.t(`dashboard.chart.${this.metric}.unit`),
      year: this.today.getFullYear(),
      total: formatted,
    });
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
      detail: `${this.t(productCategoryKey(product.categoryID))} · ${this.money(product.price)}`,
      left:
        product.quantity <= 0
          ? this.t('dashboard.stock.outOfStock')
          : this.language.tCount('dashboard.stock.left', product.quantity),
      critical: product.quantity <= 2,
    }));
  }

  private buildKpis(summary: DashboardSummary): Kpi[] {
    const nextClass: DashboardClass | undefined = summary.classesToday.list.find(
      (c: DashboardClass) => new Date(c.startTime).getTime() > Date.now()
    );
    const change: number | null = summary.revenue.changePct;

    return [
      {
        label: this.t('dashboard.kpi.activeMembers'),
        value: summary.members.active.toLocaleString('en-US'),
        chip: summary.members.newThisMonth > 0 ? `↑ ${summary.members.newThisMonth}` : null,
        chipStatus: 'active',
        caption:
          summary.members.newThisMonth > 0 ? this.t('dashboard.kpi.newThisMonth') : this.t('dashboard.kpi.noNewThisMonth'),
      },
      {
        label: this.t('dashboard.kpi.expiringThisWeek'),
        value: String(summary.expiring.within7Days),
        chip: summary.expiring.within7Days > 0 ? this.t('dashboard.kpi.action') : null,
        chipStatus: 'expiring',
        caption:
          summary.expiring.within7Days > 0
            ? this.language.tCount('dashboard.kpi.inNext3Days', summary.expiring.within3Days)
            : this.t('dashboard.kpi.nothingExpires'),
      },
      {
        label: this.t('dashboard.kpi.classesToday'),
        value: String(summary.classesToday.total),
        chip:
          summary.classesToday.total > 0
            ? this.language.tCount('dashboard.kpi.classesLeft', summary.classesToday.remaining)
            : null,
        chipStatus: 'neutral',
        caption: nextClass
          ? this.t('dashboard.kpi.nextClass', {
              name: this.className(nextClass.description),
              time: this.language.date(nextClass.startTime, 'time'),
            })
          : summary.classesToday.total > 0
          ? this.t('dashboard.kpi.noMoreClasses')
          : this.t('dashboard.kpi.noClassesScheduled'),
      },
      {
        label: this.t('dashboard.kpi.revenue', { month: this.language.date(this.today, 'monthLong') }),
        value: this.money(summary.revenue.thisMonth),
        chip: change === null ? null : `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%`,
        chipStatus: change !== null && change >= 0 ? 'active' : 'expiring',
        caption:
          summary.revenue.lastMonthSamePeriod > 0
            ? this.t('dashboard.kpi.vsSamePeriod', { amount: this.money(summary.revenue.lastMonthSamePeriod) })
            : this.t('dashboard.kpi.noSalesSamePeriod'),
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
        label: this.language.date(new Date(this.today.getFullYear(), index, 1), 'monthShort'),
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
      const people: string = this.language.tCount('dashboard.today.members', c.memberCount);
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
      label = this.t('dashboard.maintenance.dueToday');
    } else if (days === 1) {
      label = this.t('dashboard.maintenance.tomorrow');
    } else {
      label = this.language.date(due, 'shortDay');
    }
    return {
      id: job.jobId,
      name: job.machineName,
      jobType: this.t(job.jobType === 'clean' ? 'dashboard.maintenance.clean' : 'dashboard.maintenance.service'),
      serialNumber: job.serialNumber,
      due: label,
      urgent: days <= 0,
    };
  }

  // ---- Formatting ------------------------------------------------------

  private expiryNote(daysLeft: number): string {
    if (daysLeft <= 0) {
      return this.t('dashboard.expiring.today');
    }
    if (daysLeft === 1) {
      return this.t('dashboard.expiring.tomorrow');
    }
    return this.language.tCount('dashboard.expiring.inDays', daysLeft);
  }

  /** Class descriptions are free text; show the part before a colon as the class name. */
  private className(description: string): string {
    const head: string = description.split(':')[0].trim();
    return head || description;
  }

  private daysFromToday(date: Date): number {
    const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((startOf(date) - startOf(new Date())) / DAY_MS);
  }

  photoOf(url: string | null | undefined): string | null {
    return realPhotoUrl(url);
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
