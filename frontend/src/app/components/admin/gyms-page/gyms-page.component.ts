import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { Gym } from 'src/app/model/gym';
import { User } from 'src/app/model/user';
import { GymsService } from 'src/app/services/gyms-service/gyms.service';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { UsersService } from 'src/app/services/users-service/users.service';
import { initialsOf } from 'src/app/shared/ui/avatar/avatar.component';
import { DataTableColumn, DataTableSort } from 'src/app/shared/ui/data-table/data-table.types';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { AdminActionsService } from '../admin-actions.service';

type LoadState = 'loading' | 'ready' | 'error';

/** Admin: Gyms (redesign.md §5.11): a table with the number of users per gym; add/edit side panel, delete. */
@Component({
  selector: 'app-gyms-page',
  templateUrl: './gyms-page.component.html',
})
export class GymsPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  gyms: Gym[] = [];
  filtered: Gym[] = [];
  query: string = '';
  sort: DataTableSort = { key: 'gym', direction: 'asc' };
  private usersByGym = new Map<number, number>();
  private subscription: Subscription | null = null;

  readonly columns: DataTableColumn<Gym>[] = [
    { key: 'gym', labelKey: 'admin.gyms.table.gym', width: '2fr', sortValue: (g: Gym) => g.name, cardTitle: true },
    { key: 'phone', labelKey: 'admin.gyms.table.phone', width: '1.1fr', sortValue: (g: Gym) => g.phone },
    { key: 'address', labelKey: 'admin.gyms.table.address', width: '1.6fr', sortValue: (g: Gym) => g.address },
    { key: 'users', labelKey: 'admin.gyms.table.users', width: '0.7fr', sortValue: (g: Gym) => this.userCount(g) },
    { key: 'edit', labelKey: 'common.actions.edit', width: '36px', headerHidden: true, cardCorner: true },
    { key: 'more', labelKey: 'common.actions.moreActions', width: '36px', headerHidden: true, cardCorner: true },
  ];
  readonly rowId = (gym: Gym): number => gym.id;
  readonly rowLabel = (gym: Gym): string => gym.name;

  constructor(
    private gymsService: GymsService,
    private usersService: UsersService,
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
    this.subscription = combineLatest([this.gymsService.getAll(), this.usersService.getAll()]).subscribe(
      ([gyms, users]: [Gym[] | null, User[] | null]) => {
        if (!gyms || !users) {
          return;
        }
        this.gyms = gyms;
        this.usersByGym = new Map<number, number>();
        users.forEach((user: User) => this.usersByGym.set(user.gymId, (this.usersByGym.get(user.gymId) ?? 0) + 1));
        this.state = 'ready';
        this.refilter();
      },
      () => (this.state = 'error')
    );
  }

  get subtitle(): string {
    const users: number = Array.from(this.usersByGym.values()).reduce((sum: number, n: number) => sum + n, 0);
    return `${this.language.tCount('admin.gyms.page.count', this.gyms.length)} · ${this.language.tCount('admin.users.page.count', users)}`;
  }

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  private refilter(): void {
    const q: string = this.query.trim().toLowerCase();
    this.filtered = this.gyms.filter(
      (gym: Gym) => !q || (gym.name ?? '').toLowerCase().includes(q) || (gym.address ?? '').toLowerCase().includes(q) || (gym.phone ?? '').includes(q)
    );
  }

  userCount(gym: Gym): number {
    return this.usersByGym.get(gym.id) ?? 0;
  }

  initials(gym: Gym): string {
    return initialsOf((gym.name ?? '').split(/\s+/).slice(0, 2).join(' ')) || 'G';
  }

  add(): void {
    this.shellActions.addGym().subscribe();
  }

  edit(gym: Gym): void {
    this.shellActions.editGym(gym).subscribe();
  }

  openMoreMenu(event: Event, gym: Gym): void {
    event.stopPropagation();
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.deleteGym(gym, this.userCount(gym)).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
