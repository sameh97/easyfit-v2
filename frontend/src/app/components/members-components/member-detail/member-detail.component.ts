import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { classTitle } from 'src/app/common/class-title';
import { Member } from 'src/app/model/member';
import { MemberActivity, MemberClass, MemberPurchase } from 'src/app/model/member-activity';
import { LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { IconName } from 'src/app/shared/ui/icon/icons';
import { fromApiDate } from 'src/app/shared/ui/form/field';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { PillStatus } from 'src/app/shared/ui/status-pill/status-pill.component';
import { MemberActionsService } from '../member-actions.service';
import {
  daysFromToday,
  fullName,
  memberStatus,
  MemberStatus,
  membershipEnd,
  STATUS_PILL,
} from '../member-status';
import { TabItem } from 'src/app/shared/ui/tabs/tabs.component';

type DetailTab = 'overview' | 'classes' | 'purchases';
type LoadState = 'loading' | 'ready' | 'error';

/** Quick renew lengths (months), §5.2. */
const RENEW_MONTHS: readonly number[] = [1, 3, 12];
const TABS: readonly DetailTab[] = ['overview', 'classes', 'purchases'];
const COMING_UP_LIMIT = 3;

interface ContactRow {
  icon: IconName;
  labelKey: string;
  value: string;
  /** Phone and email read left to right in Hebrew too. */
  ltr: boolean;
}

/** Content of the member detail side panel (mockup P2-Members-Detail). */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styles: [':host { display: flex; flex-direction: column; min-height: 0; }'],
})
export class MemberDetailComponent implements OnChanges, OnDestroy {
  @Input() member!: Member;
  /** Emitted after the member was deleted. */
  @Output() deleted: EventEmitter<void> = new EventEmitter<void>();

  readonly tabs: readonly DetailTab[] = TABS;
  readonly renewMonths: readonly number[] = RENEW_MONTHS;
  tab: DetailTab = 'overview';
  activity: MemberActivity | null = null;
  activityState: LoadState = 'loading';
  busy: boolean = false;

  private activitySubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private members: MembersService,
    private actions: MemberActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    public language: LanguageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes.member;
    if (change && change.currentValue?.id !== change.previousValue?.id) {
      this.tab = 'overview';
      this.loadActivity();
    }
  }

  loadActivity(): void {
    this.activitySubscription?.unsubscribe();
    this.activity = null;
    this.activityState = 'loading';
    const id: number = this.member.id;
    this.activitySubscription = this.members.getActivity(id).subscribe(
      (activity: MemberActivity) => {
        if (activity.memberId === this.member?.id) {
          this.activity = activity;
          this.activityState = 'ready';
        }
      },
      () => (this.activityState = 'error')
    );
  }

  // ---- Header ------------------------------------------------------------

  get name(): string {
    return fullName(this.member);
  }

  get photo(): string | null {
    return realPhotoUrl(this.member.imageURL);
  }

  get status(): MemberStatus {
    return memberStatus(this.member);
  }

  get pill(): PillStatus {
    return STATUS_PILL[this.status];
  }

  /** "Expires in 3 days" while expiring, the plain status otherwise. */
  get statusLabel(): string {
    const end: Date | null = membershipEnd(this.member);
    if (this.status === 'expiring' && end) {
      const days: number = daysFromToday(end);
      return days === 0
        ? this.language.t('members.detail.expiresToday')
        : this.language.tCount('members.detail.expiresIn', days);
    }
    return this.language.t(`common.status.${this.status}`);
  }

  // ---- Membership card -----------------------------------------------------

  get joinDate(): Date | null {
    return fromApiDate(this.member.joinDate);
  }

  get endDate(): Date | null {
    return membershipEnd(this.member);
  }

  /** How much of the membership has passed, 0–100. */
  get progress(): number {
    const join: Date | null = this.joinDate;
    const end: Date | null = this.endDate;
    if (!join || !end || end.getTime() <= join.getTime()) {
      return this.status === 'expired' ? 100 : 0;
    }
    const fraction: number = (Date.now() - join.getTime()) / (end.getTime() - join.getTime());
    return Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  }

  get progressClass(): string {
    const tones: Record<MemberStatus, string> = {
      active: 'bg-accent',
      expiring: 'bg-warning-bar',
      expired: 'bg-danger-dot',
      inactive: 'bg-neutral-dot',
    };
    return tones[this.status];
  }

  // ---- Contact -------------------------------------------------------------

  get contactRows(): ContactRow[] {
    const birthday: Date | null = fromApiDate(this.member.birthDay);
    const gender: number = Number(this.member.gender);
    const rows: ContactRow[] = [
      { icon: 'phone', labelKey: 'members.form.phone', value: this.member.phone, ltr: true },
      { icon: 'mail', labelKey: 'members.form.email', value: this.member.email, ltr: true },
      { icon: 'map-pin', labelKey: 'members.form.address', value: this.member.address, ltr: false },
      {
        icon: 'cake',
        labelKey: 'members.form.birthday',
        value: birthday ? `${this.language.date(birthday)} · ${ageOf(birthday)}` : '',
        ltr: false,
      },
      {
        icon: 'user',
        labelKey: 'members.form.gender',
        value: gender === 1 || gender === 2 ? this.language.t(gender === 1 ? 'common.gender.male' : 'common.gender.female') : '',
        ltr: false,
      },
    ];
    return rows.filter((row: ContactRow) => !!row.value);
  }

  // ---- Activity -------------------------------------------------------------

  get comingUp(): MemberClass[] {
    return (this.activity?.classes.upcoming ?? []).slice(0, COMING_UP_LIMIT);
  }

  get classCount(): number {
    return this.activity ? this.activity.classes.upcoming.length + this.activity.classes.past.length : 0;
  }

  get purchaseCount(): number {
    return this.activity?.purchases.totalCount ?? 0;
  }

  get tabItems(): TabItem<DetailTab>[] {
    return this.tabs.map((tab: DetailTab) => ({ id: tab, label: this.tabLabel(tab) }));
  }

  tabLabel(tab: DetailTab): string {
    const label: string = this.language.t(`members.detail.tabs.${tab}`);
    if (tab === 'overview' || !this.activity) {
      return label;
    }
    return `${label} · ${tab === 'classes' ? this.classCount : this.purchaseCount}`;
  }

  classTitle(item: MemberClass): string {
    return classTitle(item.description);
  }

  /** "Today", "Tomorrow" or "Wed, 30 Sep". */
  classDay(item: MemberClass): string {
    const days: number = daysFromToday(new Date(item.startTime));
    if (days === 0) {
      return this.language.t('members.detail.today');
    }
    if (days === 1) {
      return this.language.t('members.detail.tomorrow');
    }
    return this.language.date(item.startTime, 'shortDay');
  }

  trainerName(item: MemberClass): string {
    return item.trainer ? fullName(item.trainer) : '';
  }

  money(value: number): string {
    return `₪${Math.round(value).toLocaleString('en-US')}`;
  }

  trackById(_index: number, item: MemberClass | MemberPurchase): number {
    return item.id;
  }

  // ---- Tabs ----------------------------------------------------------------

  selectTab(id: string): void {
    this.tab = this.tabs.find((tab: DetailTab) => tab === id) ?? this.tab;
  }

  // ---- Actions ---------------------------------------------------------------

  renew(months: number): void {
    this.busy = true;
    this.subscriptions.push(this.actions.renew(this.member, months).subscribe(() => (this.busy = false)));
  }

  /** Menus anchor to the clicked <button> (a template ref on it would be the button component). */
  openRenewMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = this.renewMonths.map((months: number) => ({
      id: String(months),
      label: this.language.tCount('members.detail.renewBy', months),
    }));
    this.menu
      .open(trigger, items, this.language.t('members.actions.renew'))
      .subscribe((id: string | null) => id && this.renew(Number(id)));
  }

  edit(): void {
    this.shellActions.editMember(this.member).subscribe();
  }

  openMoreMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const active: boolean = this.member.isActive;
    const items: MenuItem[] = [
      { id: 'toggle', label: this.language.t(active ? 'members.actions.deactivate' : 'members.actions.activate'), icon: 'power' },
      { id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' },
    ];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'toggle') {
        this.subscriptions.push(this.actions.setActive(this.member, !active).subscribe());
      } else if (id === 'delete') {
        this.subscriptions.push(
          this.actions.delete(this.member).subscribe((done: boolean) => done && this.deleted.emit())
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.activitySubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

function ageOf(birthday: Date): number {
  const now: Date = new Date();
  let age: number = now.getFullYear() - birthday.getFullYear();
  const beforeBirthday: boolean =
    now.getMonth() < birthday.getMonth() || (now.getMonth() === birthday.getMonth() && now.getDate() < birthday.getDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age;
}
