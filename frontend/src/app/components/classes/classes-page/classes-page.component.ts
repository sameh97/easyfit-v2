import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupTraining } from 'src/app/model/group-training';
import { Trainer } from 'src/app/model/trainer';
import { GroupTrainingService } from 'src/app/services/group-training-service/group-training.service';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { TrainersService } from 'src/app/services/trainers-service/trainers.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { addDays, sameDay, startOfWeek, WeekStripDay } from 'src/app/shared/ui/week-strip/week-strip.component';
import { fullName } from '../../members-components/member-status';
import { classNote, classStates, ClassState, classTitle, dayParam, parseDayParam } from '../class-schedule';

type LoadState = 'loading' | 'ready' | 'error';

export interface ClassRow {
  training: GroupTraining;
  title: string;
  note: string;
  trainer: Trainer | null;
  trainerName: string;
  members: string;
  state: ClassState;
}

const SKELETON_ROWS: readonly number[] = [1, 2, 3, 4];

/**
 * Classes (redesign.md §5.4): a Sunday–Saturday week strip, the selected day's classes (done /
 * up next as on the dashboard), a trainer filter and a name search, the class detail panel and
 * the add/edit side panel. The day and the class are in the URL: ?day=YYYY-MM-DD&class=<id>.
 */
@Component({
  selector: 'app-classes-page',
  templateUrl: './classes-page.component.html',
})
export class ClassesPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  trainings: GroupTraining[] = [];
  selectedDay: Date = today();
  trainerFilter: number | null = null;
  query: string = '';
  selectedId: number | null = null;
  readonly skeletonRows: readonly number[] = SKELETON_ROWS;

  /** Derived, rebuilt by refresh(). */
  weekDays: WeekStripDay[] = [];
  dayRows: ClassRow[] = [];
  weekTotal: number = 0;

  private trainersById = new Map<number, Trainer>();
  private trainers: Trainer[] = [];
  private pendingClassId: number | null = null;
  private dayFromUrl: boolean = false;
  private trainingsSubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private trainingsService: GroupTrainingService,
    private trainersService: TrainersService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.subscriptions.push(
      this.trainersService.getAll().subscribe((trainers: Trainer[] | null) => {
        if (trainers) {
          this.trainers = [...trainers].sort((a: Trainer, b: Trainer) => fullName(a).localeCompare(fullName(b)));
          this.trainersById = new Map<number, Trainer>(trainers.map((trainer: Trainer) => [trainer.id, trainer]));
          this.refresh();
        }
      })
    );
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const day: Date | null = parseDayParam(params.get('day'));
        this.dayFromUrl = day !== null;
        if (day) {
          this.selectedDay = day;
        }
        const id: number = Number(params.get('class'));
        this.pendingClassId = Number.isInteger(id) && id > 0 ? id : null;
        if (this.pendingClassId === null) {
          this.selectedId = null;
        }
        this.resolvePending();
        this.refresh();
      })
    );
    this.subscriptions.push(this.language.lang$.subscribe(() => this.refresh()));
  }

  load(): void {
    this.state = 'loading';
    this.trainingsSubscription?.unsubscribe();
    this.trainingsSubscription = this.trainingsService.getAll().subscribe(
      (trainings: GroupTraining[] | null) => {
        if (trainings === null) {
          return;
        }
        this.trainings = trainings;
        this.state = 'ready';
        this.resolvePending();
        if (this.selectedId !== null && !this.selected && this.pendingClassId === null) {
          this.closeDetail();
        }
        this.refresh();
      },
      () => (this.state = 'error')
    );
  }

  // ---- Week and day ----------------------------------------------------------------

  get weekStart(): Date {
    return startOfWeek(this.selectedDay);
  }

  /** "27 Sep – 3 Oct 2026" */
  get weekRange(): string {
    const start: Date = this.weekStart;
    const end: Date = addDays(start, 6);
    const from: string = start.getFullYear() === end.getFullYear() ? this.language.date(start, 'dayMonth') : this.language.date(start, 'date');
    return `${from} – ${this.language.date(end, 'date')}`;
  }

  get subtitle(): string {
    const week: string = this.language.tCount('classes.page.weekCount', this.weekTotal);
    const todayDate: Date = today();
    if (!sameDay(startOfWeek(todayDate), this.weekStart)) {
      return week;
    }
    const todayCount: number = this.trainings.filter((training: GroupTraining) => sameDay(new Date(training.startTime), todayDate)).length;
    return `${week} · ${this.language.tCount('classes.page.todayCount', todayCount)}`;
  }

  /** "4 classes · 1 done" */
  get daySummary(): string {
    const count: string = this.language.tCount('classes.page.dayCount', this.dayRows.length);
    const done: number = this.dayRows.filter((row: ClassRow) => row.state === 'done').length;
    return done ? `${count} · ${this.language.tCount('classes.page.doneCount', done)}` : count;
  }

  get isTodaySelected(): boolean {
    return sameDay(this.selectedDay, today());
  }

  selectDay(day: Date): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { day: dayParam(day) }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  shiftWeek(weeks: number): void {
    this.selectDay(addDays(this.selectedDay, weeks * 7));
  }

  goToday(): void {
    this.selectDay(today());
  }

  // ---- Filters -------------------------------------------------------------------------

  get trainerFilterLabel(): string {
    const trainer: Trainer | undefined = this.trainerFilter === null ? undefined : this.trainersById.get(this.trainerFilter);
    return this.language.t('classes.page.trainerFilter', { name: trainer ? fullName(trainer) : this.language.t('classes.page.trainerAll') });
  }

  openTrainerMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [
      { id: 'all', label: this.language.t('classes.page.trainerAll'), checked: this.trainerFilter === null },
      ...this.trainers.map((trainer: Trainer) => ({ id: String(trainer.id), label: fullName(trainer), checked: this.trainerFilter === trainer.id })),
    ];
    this.menu.open(trigger, items, this.language.t('classes.page.trainerFilterLabel')).subscribe((id: string | null) => {
      if (id !== null) {
        this.trainerFilter = id === 'all' ? null : Number(id);
        this.refresh();
      }
    });
  }

  onSearch(value: string): void {
    this.query = value;
    this.refresh();
  }

  get filtering(): boolean {
    return this.trainerFilter !== null || this.query.trim() !== '';
  }

  private matches(training: GroupTraining): boolean {
    if (this.trainerFilter !== null && training.trainerId !== this.trainerFilter) {
      return false;
    }
    const q: string = this.query.trim().toLowerCase();
    return !q || classTitle(training.description).toLowerCase().includes(q);
  }

  /** Rebuilds the strip counts and the day list from the data, the day and the filters. */
  private refresh(): void {
    const weekStart: Date = this.weekStart;
    const weekEnd: Date = addDays(weekStart, 7);
    const inWeek = (training: GroupTraining): boolean => {
      const start: Date = new Date(training.startTime);
      return start >= weekStart && start < weekEnd;
    };
    this.weekTotal = this.trainings.filter(inWeek).length;
    const visible: GroupTraining[] = this.trainings.filter((training: GroupTraining) => this.matches(training));
    this.weekDays = Array.from({ length: 7 }, (_unused: unknown, i: number) => {
      const date: Date = addDays(weekStart, i);
      return { date, count: visible.filter((training: GroupTraining) => sameDay(new Date(training.startTime), date)).length };
    });
    const states: Map<number, ClassState> = classStates(visible, new Date());
    this.dayRows = visible
      .filter((training: GroupTraining) => sameDay(new Date(training.startTime), this.selectedDay))
      .sort((a: GroupTraining, b: GroupTraining) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map((training: GroupTraining) => this.toRow(training, states.get(training.id) ?? 'later'));
  }

  private toRow(training: GroupTraining, state: ClassState): ClassRow {
    const trainer: Trainer | null = this.trainersById.get(training.trainerId) ?? null;
    return {
      training,
      title: classTitle(training.description),
      note: classNote(training.description),
      trainer,
      trainerName: trainer ? fullName(trainer) : '',
      members: this.language.tCount('classes.row.members', (training.members ?? []).length),
      state,
    };
  }

  trainerPhoto(trainer: Trainer | null): string | null {
    return trainer ? realPhotoUrl(trainer.imageURL) : null;
  }

  trackById(_index: number, row: ClassRow): number {
    return row.training.id;
  }

  // ---- Create ---------------------------------------------------------------------------

  add(): void {
    this.shellActions.addClass(this.selectedDay).subscribe((training: GroupTraining | undefined) => training && this.select(training));
  }

  // ---- Detail panel ---------------------------------------------------------------------

  get selected(): GroupTraining | null {
    return this.selectedId === null ? null : this.trainings.find((training: GroupTraining) => training.id === this.selectedId) ?? null;
  }

  get selectedTrainer(): Trainer | null {
    const training: GroupTraining | null = this.selected;
    return training ? this.trainersById.get(training.trainerId) ?? null : null;
  }

  /** Opens a class and shows its day. */
  select(training: GroupTraining): void {
    this.selectedId = training.id;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { class: training.id, day: dayParam(new Date(training.startTime)) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  closeDetail(): void {
    this.selectedId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { class: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** A deep-linked class: open it, and show its day unless the URL picked one. */
  private resolvePending(): void {
    if (this.pendingClassId === null || this.state !== 'ready') {
      return;
    }
    const id: number = this.pendingClassId;
    this.pendingClassId = null;
    const training: GroupTraining | undefined = this.trainings.find((item: GroupTraining) => item.id === id);
    if (!training) {
      this.toast.error(this.language.t('classes.toast.notFound'));
      this.closeDetail();
      return;
    }
    this.selectedId = id;
    if (!this.dayFromUrl) {
      this.selectDay(new Date(training.startTime));
    }
  }

  ngOnDestroy(): void {
    this.trainingsSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

function today(): Date {
  const now: Date = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
