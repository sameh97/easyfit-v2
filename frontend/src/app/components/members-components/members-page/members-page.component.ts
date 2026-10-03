import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Member } from 'src/app/model/member';
import { Lang, LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { DataTableState } from 'src/app/shared/ui/data-table/data-table.component';
import { DataTableColumn, DataTableSort, sortRows } from 'src/app/shared/ui/data-table/data-table.types';
import { fromApiDate, toIsoDate } from 'src/app/shared/ui/form/field';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { PillStatus } from 'src/app/shared/ui/status-pill/status-pill.component';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { MemberActionsService } from '../member-actions.service';
import { downloadCsv, membersCsv } from '../members-csv';
import {
  EndNote,
  endNote,
  endSortValue,
  fullName,
  memberStatus,
  MemberStatus,
  MEMBER_STATUSES,
  STATUS_PILL,
} from '../member-status';

type StatusFilter = 'all' | MemberStatus;
type GenderFilter = 'all' | 'male' | 'female';

const STATUS_FILTERS: readonly StatusFilter[] = ['all', ...MEMBER_STATUSES];
const GENDER_VALUES: Record<GenderFilter, number | null> = { all: null, male: 1, female: 2 };
const STATUS_ORDER: Record<MemberStatus, number> = { expiring: 0, active: 1, expired: 2, inactive: 3 };

/** Precomputed per row so the table doesn't recompute dates on every change detection. */
interface RowInfo {
  name: string;
  photo: string | null;
  status: MemberStatus;
  pill: PillStatus;
  end: Date | null;
  joined: Date | null;
  note: EndNote | null;
}

/**
 * Members (redesign.md §5.2, mockups P2-Members-Detail / P2-Members-Hebrew):
 * status filter with counts, search, gender filter, CSV export, table + detail panel,
 * deep link /members?member=<id>.
 */
@Component({
  selector: 'app-members-page',
  templateUrl: './members-page.component.html',
})
export class MembersPageComponent implements OnInit, OnDestroy {
  state: DataTableState = 'loading';
  members: Member[] = [];
  filtered: Member[] = [];
  counts: Record<StatusFilter, number> = { all: 0, active: 0, expiring: 0, expired: 0, inactive: 0 };

  readonly statusFilters: readonly StatusFilter[] = STATUS_FILTERS;
  statusFilter: StatusFilter = 'all';
  gender: GenderFilter = 'all';
  query: string = '';
  sort: DataTableSort = { key: 'ends', direction: 'asc' };
  columns: DataTableColumn<Member>[] = [];

  selectedId: number | null = null;
  wide: boolean = true;

  private info = new Map<number, RowInfo>();
  /** ?member=<id> waiting for the list to load. */
  private pendingId: number | null = null;
  private readonly subscriptions: Subscription[] = [];
  private membersSubscription: Subscription | null = null;

  constructor(
    private membersService: MembersService,
    private actions: MemberActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.columns = this.buildColumns();
    this.load();
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        const id: number = Number(params.get('member'));
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
    // Notes ("In 3 days") are translated when rows are built.
    this.subscriptions.push(this.language.lang$.subscribe((_lang: Lang) => this.refilter()));
  }

  load(): void {
    this.state = 'loading';
    this.membersSubscription?.unsubscribe();
    this.membersSubscription = this.membersService.getAll().subscribe(
      (members: Member[] | null) => {
        if (members === null) {
          return;
        }
        this.members = members;
        this.state = 'ready';
        this.refilter();
        this.resolvePending();
        // The open member was deleted (here or elsewhere): close the panel.
        if (this.selectedId !== null && !this.selected && this.pendingId === null) {
          this.closeDetail();
        }
      },
      () => (this.state = 'error')
    );
  }

  // ---- Filtering -------------------------------------------------------------

  refilter(): void {
    const now: Date = new Date();
    this.info = new Map<number, RowInfo>(
      this.members.map((member: Member) => {
        const status: MemberStatus = memberStatus(member, now);
        return [
          member.id,
          {
            name: fullName(member),
            photo: realPhotoUrl(member.imageURL),
            status,
            pill: STATUS_PILL[status],
            end: fromApiDate(member.endOfMembershipDate),
            joined: fromApiDate(member.joinDate),
            note: endNote(member, now),
          },
        ];
      })
    );

    const q: string = this.query.trim().toLowerCase();
    const digits: string = q.replace(/\D/g, '');
    const genderValue: number | null = GENDER_VALUES[this.gender];
    const base: Member[] = this.members.filter((member: Member) => {
      if (genderValue !== null && Number(member.gender) !== genderValue) {
        return false;
      }
      if (!q) {
        return true;
      }
      const name: string = this.rowInfo(member).name.toLowerCase();
      const reversed: string = `${member.lastName ?? ''} ${member.firstName ?? ''}`.toLowerCase();
      const phone: string = (member.phone ?? '').replace(/\D/g, '');
      return (
        name.includes(q) ||
        reversed.includes(q) ||
        (member.email ?? '').toLowerCase().includes(q) ||
        (digits.length >= 3 && phone.includes(digits))
      );
    });

    const counts: Record<StatusFilter, number> = { all: base.length, active: 0, expiring: 0, expired: 0, inactive: 0 };
    base.forEach((member: Member) => counts[this.rowInfo(member).status]++);
    this.counts = counts;
    this.filtered =
      this.statusFilter === 'all' ? base : base.filter((member: Member) => this.rowInfo(member).status === this.statusFilter);
  }

  setStatus(filter: StatusFilter): void {
    this.statusFilter = filter;
    this.refilter();
  }

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.gender = 'all';
    this.query = '';
    this.refilter();
  }

  get filterKey(): string {
    return `${this.statusFilter}|${this.gender}|${this.query}`;
  }

  get hasFilters(): boolean {
    return this.statusFilter !== 'all' || this.gender !== 'all' || !!this.query.trim();
  }

  openGenderMenu(trigger: HTMLElement): void {
    const options: GenderFilter[] = ['all', 'male', 'female'];
    const items: MenuItem[] = options.map((option: GenderFilter) => ({
      id: option,
      label: this.language.t(`members.filters.gender.${option}`),
      checked: option === this.gender,
    }));
    this.menu.open(trigger, items, this.language.t('members.filters.genderLabel')).subscribe((id: string | null) => {
      if (id === 'all' || id === 'male' || id === 'female') {
        this.gender = id;
        this.refilter();
      }
    });
  }

  // ---- Header ------------------------------------------------------------------

  get subtitle(): string {
    const valid: number = this.members.filter((member: Member) => {
      const status: MemberStatus = this.rowInfo(member).status;
      return status === 'active' || status === 'expiring';
    }).length;
    return `${this.language.tCount('members.page.people', this.members.length)} · ${this.language.tCount(
      'members.page.valid',
      valid
    )}`;
  }

  exportCsv(): void {
    const rows: Member[] = sortRows(this.filtered, this.columns, this.sort);
    downloadCsv(membersCsv(rows, this.language), `members-${toIsoDate(new Date())}.csv`);
    this.toast.success(this.language.tCount('members.toast.exported', rows.length));
  }

  add(): void {
    this.shellActions.addMember().subscribe((member: Member | undefined) => member && this.select(member));
  }

  // ---- Table -------------------------------------------------------------------

  rowInfo(member: Member): RowInfo {
    return (
      this.info.get(member.id) ?? {
        name: fullName(member),
        photo: null,
        status: 'active',
        pill: 'active',
        end: null,
        joined: null,
        note: null,
      }
    );
  }

  readonly rowId = (member: Member): number => member.id;
  readonly rowLabel = (member: Member): string => this.rowInfo(member).name;
  readonly rowClass = (member: Member): string => (this.rowInfo(member).status === 'expiring' ? 'bg-warning-row' : '');

  noteClass(note: EndNote | null): string {
    if (!note || note.tone === 'muted') {
      return 'font-medium text-ink-3';
    }
    return note.tone === 'warning' ? 'font-bold text-warning-text' : 'font-bold text-danger-text';
  }

  private buildColumns(): DataTableColumn<Member>[] {
    return [
      {
        key: 'member',
        labelKey: 'members.table.member',
        width: '2.3fr',
        sortValue: (m: Member) => this.rowInfo(m).name,
        cardTitle: true,
      },
      { key: 'phone', labelKey: 'members.table.phone', width: '1.2fr', hideWhenNarrow: true },
      {
        key: 'status',
        labelKey: 'members.table.status',
        width: '1fr',
        sortValue: (m: Member) => STATUS_ORDER[this.rowInfo(m).status],
      },
      { key: 'ends', labelKey: 'members.table.ends', width: '1.5fr', sortValue: (m: Member) => endSortValue(m) },
      {
        key: 'joined',
        labelKey: 'members.table.joined',
        width: '1.1fr',
        sortValue: (m: Member) => this.rowInfo(m).joined?.getTime() ?? null,
        hideWhenNarrow: true,
      },
      { key: 'edit', labelKey: 'common.actions.edit', width: '36px', headerHidden: true, hideWhenNarrow: true, cardCorner: true },
      { key: 'more', labelKey: 'common.actions.moreActions', width: '36px', headerHidden: true, cardCorner: true },
    ];
  }

  edit(member: Member, event?: Event): void {
    event?.stopPropagation();
    this.shellActions.editMember(member).subscribe();
  }

  openRowMenu(event: Event, member: Member): void {
    event.stopPropagation();
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.delete(member).subscribe();
      }
    });
  }

  // ---- Detail panel ----------------------------------------------------------------

  get selected(): Member | null {
    return this.selectedId === null ? null : this.members.find((member: Member) => member.id === this.selectedId) ?? null;
  }

  get narrow(): boolean {
    return this.wide && this.selected !== null;
  }

  select(member: Member): void {
    this.selectedId = member.id;
    this.router.navigate([], { relativeTo: this.route, queryParams: { member: member.id }, replaceUrl: true });
  }

  closeDetail(): void {
    this.selectedId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { member: null }, replaceUrl: true });
  }

  /** Opens the panel for ?member=<id> once the list has loaded. */
  private resolvePending(): void {
    if (this.pendingId === null || this.state !== 'ready') {
      return;
    }
    const id: number = this.pendingId;
    this.pendingId = null;
    if (this.members.some((member: Member) => member.id === id)) {
      this.selectedId = id;
    } else {
      this.toast.error(this.language.t('members.toast.notFound'));
      this.closeDetail();
    }
  }

  ngOnDestroy(): void {
    this.membersSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
