import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { classTitle } from 'src/app/common/class-title';
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
import { daysFromToday, fullName } from '../../members-components/member-status';
import { ScheduleState } from '../trainer-detail/trainer-detail.component';
import { TrainerActionsService } from '../trainer-actions.service';
import { EMPTY_SCHEDULE, schedulesByTrainer, TrainerSchedule } from '../trainer-schedule';

type LoadState = 'loading' | 'ready' | 'error';

const SKELETON_CARDS: readonly number[] = [1, 2, 3, 4, 5, 6];

/** Trainers (redesign.md §5.3): a card grid, the shared detail panel, side-panel forms. Deep link ?trainer=<id>. */
@Component({
  selector: 'app-trainers-page',
  templateUrl: './trainers.component.html',
})
export class TrainersPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  scheduleState: ScheduleState = 'loading';
  trainers: Trainer[] = [];
  filtered: Trainer[] = [];
  query: string = '';
  selectedId: number | null = null;
  wide: boolean = true;
  readonly skeletonCards: readonly number[] = SKELETON_CARDS;

  private schedules = new Map<number, TrainerSchedule>();
  private pendingId: number | null = null;
  private trainersSubscription: Subscription | null = null;
  private trainingsSubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private trainersService: TrainersService,
    private trainingsService: GroupTrainingService,
    private actions: TrainerActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadSchedule();
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const id: number = Number(params.get('trainer'));
        this.pendingId = Number.isInteger(id) && id > 0 ? id : null;
        if (this.pendingId === null) {
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
    this.trainersSubscription?.unsubscribe();
    this.trainersSubscription = this.trainersService.getAll().subscribe(
      (trainers: Trainer[] | null) => {
        if (trainers === null) {
          return;
        }
        this.trainers = [...trainers].sort((a: Trainer, b: Trainer) =>
          fullName(a).localeCompare(fullName(b), undefined, { sensitivity: 'base' })
        );
        this.state = 'ready';
        this.refilter();
        this.resolvePending();
        if (this.selectedId !== null && !this.selected && this.pendingId === null) {
          this.closeDetail();
        }
      },
      () => (this.state = 'error')
    );
  }

  loadSchedule(): void {
    this.scheduleState = 'loading';
    this.trainingsSubscription?.unsubscribe();
    this.trainingsSubscription = this.trainingsService.getAll().subscribe(
      (trainings: GroupTraining[] | null) => {
        if (trainings === null) {
          return;
        }
        this.schedules = schedulesByTrainer(trainings);
        this.scheduleState = 'ready';
      },
      () => (this.scheduleState = 'error')
    );
  }

  // ---- Filtering ----------------------------------------------------------------

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  private refilter(): void {
    const q: string = this.query.trim().toLowerCase();
    const digits: string = q.replace(/\D/g, '');
    this.filtered = !q
      ? this.trainers
      : this.trainers.filter(
          (trainer: Trainer) =>
            fullName(trainer).toLowerCase().includes(q) ||
            (trainer.email ?? '').toLowerCase().includes(q) ||
            (digits.length >= 3 && (trainer.phone ?? '').replace(/\D/g, '').includes(digits))
        );
  }

  get subtitle(): string {
    const active: number = this.trainers.filter((trainer: Trainer) => trainer.isActive).length;
    return `${this.language.tCount('trainers.page.count', this.trainers.length)} · ${this.language.tCount(
      'trainers.page.active',
      active
    )}`;
  }

  // ---- Cards --------------------------------------------------------------------

  name(trainer: Trainer): string {
    return fullName(trainer);
  }

  photo(trainer: Trainer): string | null {
    return realPhotoUrl(trainer.imageURL);
  }

  scheduleOf(trainer: Trainer): TrainerSchedule {
    return this.schedules.get(trainer.id) ?? EMPTY_SCHEDULE;
  }

  /** "3 classes this week · next: Spinning Wed 17:30" (§5.3). */
  classesLine(trainer: Trainer): string {
    if (this.scheduleState !== 'ready') {
      return '';
    }
    const schedule: TrainerSchedule = this.scheduleOf(trainer);
    const week: string = this.language.tCount('trainers.card.thisWeek', schedule.thisWeek);
    const next: GroupTraining | undefined = schedule.upcoming[0];
    if (!next) {
      return `${week} · ${this.language.t('trainers.card.noNext')}`;
    }
    const days: number = daysFromToday(new Date(next.startTime));
    const day: string =
      days === 0
        ? this.language.t('members.detail.today')
        : days === 1
        ? this.language.t('members.detail.tomorrow')
        : this.language.date(next.startTime, 'shortDay');
    return `${week} · ${this.language.t('trainers.card.next', {
      name: classTitle(next.description),
      when: `${day} ${this.language.date(next.startTime, 'time')}`,
    })}`;
  }

  add(): void {
    this.shellActions.addTrainer().subscribe((trainer: Trainer | undefined) => trainer && this.select(trainer));
  }

  openCardMenu(event: Event, trainer: Trainer): void {
    event.stopPropagation();
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [
      { id: 'edit', label: this.language.t('common.actions.edit'), icon: 'pen' },
      {
        id: 'toggle',
        label: this.language.t(trainer.isActive ? 'trainers.actions.deactivate' : 'trainers.actions.activate'),
        icon: 'power',
      },
      { id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' },
    ];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'edit') {
        this.shellActions.editTrainer(trainer).subscribe();
      } else if (id === 'toggle') {
        this.actions.setActive(trainer, !trainer.isActive).subscribe();
      } else if (id === 'delete') {
        this.actions.delete(trainer).subscribe();
      }
    });
  }

  trackById(_index: number, trainer: Trainer): number {
    return trainer.id;
  }

  // ---- Detail panel ----------------------------------------------------------------

  get selected(): Trainer | null {
    return this.selectedId === null ? null : this.trainers.find((trainer: Trainer) => trainer.id === this.selectedId) ?? null;
  }

  get narrow(): boolean {
    return this.wide && this.selected !== null;
  }

  select(trainer: Trainer): void {
    this.selectedId = trainer.id;
    this.router.navigate([], { relativeTo: this.route, queryParams: { trainer: trainer.id }, replaceUrl: true });
  }

  closeDetail(): void {
    this.selectedId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { trainer: null }, replaceUrl: true });
  }

  private resolvePending(): void {
    if (this.pendingId === null || this.state !== 'ready') {
      return;
    }
    const id: number = this.pendingId;
    this.pendingId = null;
    if (this.trainers.some((trainer: Trainer) => trainer.id === id)) {
      this.selectedId = id;
    } else {
      this.toast.error(this.language.t('trainers.toast.notFound'));
      this.closeDetail();
    }
  }

  ngOnDestroy(): void {
    this.trainersSubscription?.unsubscribe();
    this.trainingsSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
