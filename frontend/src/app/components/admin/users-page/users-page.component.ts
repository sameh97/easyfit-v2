import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { Gym } from 'src/app/model/gym';
import { ADMIN_ROLE_ID, User } from 'src/app/model/user';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { DataTableColumn, DataTableSort } from 'src/app/shared/ui/data-table/data-table.types';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { AdminActionsService } from '../admin-actions.service';

type LoadState = 'loading' | 'ready' | 'error';

/** Admin: Users (redesign.md §5.11): every gym's users in a table, a gym filter and search; add/edit side panel, delete. */
@Component({
  selector: 'app-users-page',
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  users: User[] = [];
  filtered: User[] = [];
  query: string = '';
  gymFilter: number | null = null;
  sort: DataTableSort = { key: 'user', direction: 'asc' };
  private gymsById = new Map<number, Gym>();
  private subscription: Subscription | null = null;

  readonly columns: DataTableColumn<User>[] = [
    { key: 'user', labelKey: 'admin.users.table.user', width: '2.2fr', sortValue: (u: User) => this.name(u), cardTitle: true },
    { key: 'phone', labelKey: 'admin.users.table.phone', width: '1.1fr' },
    { key: 'gym', labelKey: 'admin.users.table.gym', width: '1.4fr', sortValue: (u: User) => this.gymName(u) },
    { key: 'role', labelKey: 'admin.users.table.role', width: '0.9fr', sortValue: (u: User) => u.roleId },
    { key: 'edit', labelKey: 'common.actions.edit', width: '36px', headerHidden: true, cardCorner: true },
    { key: 'more', labelKey: 'common.actions.moreActions', width: '36px', headerHidden: true, cardCorner: true },
  ];
  readonly rowId = (user: User): string => String(user.id);
  readonly rowLabel = (user: User): string => this.name(user);

  constructor(
    private usersService: UsersService,
    private gymsService: GymsService,
    private actions: AdminActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.subscription?.unsubscribe();
    this.subscription = combineLatest([this.usersService.getAll(), this.gymsService.getAll()]).subscribe(
      ([users, gyms]: [User[] | null, Gym[] | null]) => {
        if (!users || !gyms) {
          return;
        }
        this.users = users;
        this.gymsById = new Map<number, Gym>(gyms.map((gym: Gym) => [gym.id, gym]));
        this.state = 'ready';
        this.refilter();
      },
      () => (this.state = 'error')
    );
  }

  get subtitle(): string {
    return this.language.t('admin.users.page.subtitle', {
      users: this.language.tCount('admin.users.page.count', this.users.length),
      gyms: this.language.tCount('admin.gyms.page.inGyms', this.gymsById.size),
    });
  }

  name(user: User): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  }

  avatarId(user: User): number {
    return Number(user.id) || 0;
  }

  photo(user: User): string | null {
    return realPhotoUrl(user.imageURL);
  }

  gymName(user: User): string {
    return this.gymsById.get(user.gymId)?.name ?? '—';
  }

  isAdmin(user: User): boolean {
    return user.roleId === ADMIN_ROLE_ID;
  }

  get gymFilterLabel(): string {
    const gym: Gym | undefined = this.gymFilter === null ? undefined : this.gymsById.get(this.gymFilter);
    return this.language.t('admin.users.page.gymFilter', { name: gym ? gym.name : this.language.t('admin.users.page.gymAll') });
  }

  openGymMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const gyms: Gym[] = Array.from(this.gymsById.values()).sort((a: Gym, b: Gym) => a.name.localeCompare(b.name));
    const items: MenuItem[] = [
      { id: 'all', label: this.language.t('admin.users.page.gymAll'), checked: this.gymFilter === null },
      ...gyms.map((gym: Gym) => ({ id: String(gym.id), label: gym.name, checked: this.gymFilter === gym.id })),
    ];
    this.menu.open(trigger, items, this.language.t('admin.users.page.gymFilterLabel')).subscribe((id: string | null) => {
      if (id !== null) {
        this.gymFilter = id === 'all' ? null : Number(id);
        this.refilter();
      }
    });
  }

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  get filterKey(): string {
    return `${this.query}|${this.gymFilter}`;
  }

  private refilter(): void {
    const q: string = this.query.trim().toLowerCase();
    const digits: string = q.replace(/\D/g, '');
    this.filtered = this.users.filter((user: User) => {
      if (this.gymFilter !== null && user.gymId !== this.gymFilter) {
        return false;
      }
      return (
        !q ||
        this.name(user).toLowerCase().includes(q) ||
        (user.email ?? '').toLowerCase().includes(q) ||
        (digits.length >= 3 && (user.phone ?? '').replace(/\D/g, '').includes(digits))
      );
    });
  }

  add(): void {
    this.shellActions.addUser().subscribe();
  }

  edit(user: User): void {
    this.shellActions.editUser(user).subscribe();
  }

  openMoreMenu(event: Event, user: User): void {
    event.stopPropagation();
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.deleteUser(user).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
