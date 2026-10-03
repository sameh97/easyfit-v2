import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { classTitle } from 'src/app/common/class-title';
import { GroupTraining } from 'src/app/model/group-training';
import { Trainer } from 'src/app/model/trainer';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { fromApiDate } from 'src/app/shared/ui/form/field';
import { IconName } from 'src/app/shared/ui/icon/icons';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { daysFromToday, fullName } from '../../members-components/member-status';
import { TrainerActionsService } from '../trainer-actions.service';
import { TrainerSchedule } from '../trainer-schedule';

type DetailTab = 'overview' | 'classes';
export type ScheduleState = 'loading' | 'ready' | 'error';

const TABS: readonly DetailTab[] = ['overview', 'classes'];
const COMING_UP_LIMIT = 3;

interface InfoRow {
  icon: IconName;
  labelKey: string;
  value: string;
  ltr: boolean;
}

/** Content of the trainer detail side panel (§5.3): Overview and Classes. */
@Component({
  selector: 'app-trainer-detail',
  templateUrl: './trainer-detail.component.html',
  styles: [':host { display: flex; flex-direction: column; min-height: 0; }'],
})
export class TrainerDetailComponent implements OnChanges, OnDestroy {
  @Input() trainer!: Trainer;
  @Input() schedule!: TrainerSchedule;
  @Input() scheduleState: ScheduleState = 'loading';
  @Output() deleted: EventEmitter<void> = new EventEmitter<void>();
  @Output() retrySchedule: EventEmitter<void> = new EventEmitter<void>();

  readonly tabs: readonly DetailTab[] = TABS;
  tab: DetailTab = 'overview';
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private actions: TrainerActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    public language: LanguageService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes.trainer;
    if (change && change.currentValue?.id !== change.previousValue?.id) {
      this.tab = 'overview';
    }
  }

  get name(): string {
    return fullName(this.trainer);
  }

  get photo(): string | null {
    return realPhotoUrl(this.trainer.imageURL);
  }

  get infoRows(): InfoRow[] {
    const date = (value: Date | string): string => {
      const parsed: Date | null = fromApiDate(value);
      return parsed ? this.language.date(parsed) : '';
    };
    const gender: number = Number(this.trainer.gender);
    const rows: InfoRow[] = [
      { icon: 'phone', labelKey: 'members.form.phone', value: this.trainer.phone, ltr: true },
      { icon: 'mail', labelKey: 'members.form.email', value: this.trainer.email, ltr: true },
      { icon: 'map-pin', labelKey: 'members.form.address', value: this.trainer.address, ltr: false },
      { icon: 'cake', labelKey: 'members.form.birthday', value: date(this.trainer.birthDay), ltr: false },
      {
        icon: 'user',
        labelKey: 'members.form.gender',
        value: gender === 1 || gender === 2 ? this.language.t(gender === 1 ? 'common.gender.male' : 'common.gender.female') : '',
        ltr: false,
      },
      { icon: 'calendar', labelKey: 'members.table.joined', value: date(this.trainer.joinDate), ltr: false },
      { icon: 'award', labelKey: 'trainers.detail.certified', value: date(this.trainer.certificationDate), ltr: false },
    ];
    return rows.filter((row: InfoRow) => !!row.value);
  }

  get comingUp(): GroupTraining[] {
    return this.schedule.upcoming.slice(0, COMING_UP_LIMIT);
  }

  get classCount(): number {
    return this.schedule.upcoming.length + this.schedule.past.length;
  }

  tabLabel(tab: DetailTab): string {
    const label: string = this.language.t(`trainers.detail.tabs.${tab}`);
    return tab === 'classes' && this.scheduleState === 'ready' ? `${label} · ${this.classCount}` : label;
  }

  title(training: GroupTraining): string {
    return classTitle(training.description);
  }

  /** "Today", "Tomorrow" or "Wed, 30 Sep". */
  day(training: GroupTraining): string {
    const days: number = daysFromToday(new Date(training.startTime));
    if (days === 0) {
      return this.language.t('members.detail.today');
    }
    if (days === 1) {
      return this.language.t('members.detail.tomorrow');
    }
    return this.language.date(training.startTime, 'shortDay');
  }

  trackById(_index: number, training: GroupTraining): number {
    return training.id;
  }

  onTabKeydown(event: KeyboardEvent): void {
    const rtl: boolean = getComputedStyle(this.host.nativeElement).direction === 'rtl';
    const keys: string[] = rtl ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft'];
    const index: number = this.tabs.indexOf(this.tab);
    let target: number = -1;
    if (event.key === keys[0] || event.key === keys[1]) {
      target = (index + 1) % this.tabs.length; // two tabs: either arrow switches
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = this.tabs.length - 1;
    }
    if (target >= 0) {
      event.preventDefault();
      this.tab = this.tabs[target];
      setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#trainer-tab-${this.tab}`)?.focus());
    }
  }

  edit(): void {
    this.shellActions.editTrainer(this.trainer).subscribe();
  }

  openMoreMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const active: boolean = this.trainer.isActive;
    const items: MenuItem[] = [
      { id: 'toggle', label: this.language.t(active ? 'trainers.actions.deactivate' : 'trainers.actions.activate'), icon: 'power' },
      { id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' },
    ];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'toggle') {
        this.subscriptions.push(this.actions.setActive(this.trainer, !active).subscribe());
      } else if (id === 'delete') {
        this.subscriptions.push(this.actions.delete(this.trainer).subscribe((done: boolean) => done && this.deleted.emit()));
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
