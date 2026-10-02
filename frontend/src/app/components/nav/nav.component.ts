import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AppUtil } from 'src/app/common/app-util';
import { NotificationsDropdownComponent } from '../notifications/notifications-dropdown.component';
import { AppNotificationMessage } from 'src/app/model/app-notification-message';
import { WebSocketService } from 'src/app/services/web-socket.service';
import { SocketTopics } from 'src/app/shared/util/socket-util';
import { UserNotificationsService } from 'src/app/services/user-notifications.service';
import { User } from 'src/app/model/user';
import { IconName } from 'src/app/shared/ui/icon/icons';
import { ShellStateService } from 'src/app/services/shell-state.service';
import { ShellContext, ShellContextService } from 'src/app/services/shell-context.service';
import { initialsOf } from 'src/app/shared/ui/avatar/avatar.component';

type NavBadge = 'members' | 'maintenance';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  badge?: NavBadge;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Below md: off-canvas drawer. md–lg: 72px rail. ≥ lg: full sidebar (user can collapse). ≥ xl: AI panel docks. */
type Viewport = 'phone' | 'tablet' | 'desktop' | 'wide';

const ROLE_LABELS: Record<number, string> = { 1: 'Manager', 2: 'Admin' };

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit, OnDestroy {
  notificationNumber: number = 0;
  currentUser: User | null = null;
  context: ShellContext = { gymName: null, memberCount: null };
  viewport: Viewport = 'desktop';
  drawerOpen: boolean = false;
  userMenuOpen: boolean = false;
  aiPanelOpen: boolean = false;
  private userCollapsed: boolean = false;
  private subscriptions: Subscription[] = [];

  @ViewChild('drawerCloseButton') private drawerCloseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('userMenuButton') private userMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('userMenu') private userMenu?: ElementRef<HTMLElement>;

  readonly navGroups: NavGroup[] = [
    { label: 'Overview', items: [{ label: 'Dashboard', path: '/home', icon: 'home' }] },
    {
      label: 'People',
      items: [
        { label: 'Members', path: '/members', icon: 'users', badge: 'members' },
        { label: 'Trainers', path: '/trainers', icon: 'user-check' },
        { label: 'Classes', path: '/group-trainings', icon: 'calendar' },
      ],
    },
    {
      label: 'Equipment',
      items: [
        { label: 'Machines', path: '/machines', icon: 'dumbbell' },
        { label: 'Maintenance', path: '/scheduler', icon: 'wrench', badge: 'maintenance' },
      ],
    },
    {
      label: 'Shop',
      items: [
        { label: 'Products', path: '/products', icon: 'shopping-bag' },
        { label: 'Catalogs', path: '/catalog', icon: 'send' },
      ],
    },
  ];

  constructor(
    private authService: AuthenticationService,
    private navigationService: NavigationHelperService,
    private webSocketService: WebSocketService,
    private userNotificationsService: UserNotificationsService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private shellContextService: ShellContextService,
    public shell: ShellStateService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
      })
    );

    this.subscriptions.push(
      this.shellContextService.context$.subscribe((context: ShellContext) => {
        this.context = context;
      })
    );

    this.subscriptions.push(
      this.shell.sidebarCollapsed$.subscribe((collapsed: boolean) => {
        this.userCollapsed = collapsed;
      })
    );

    this.subscriptions.push(
      this.shell.aiPanelOpen$.subscribe((open: boolean) => {
        this.aiPanelOpen = open;
      })
    );

    this.subscriptions.push(
      this.observeBreakpoints().subscribe(() => {
        this.viewport = this.resolveViewport();
        if (this.viewport !== 'phone') {
          this.drawerOpen = false;
        }
      })
    );

    this.subscriptions.push(
      this.router.events
        .pipe(filter((event: RouterEvent | unknown): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.drawerOpen = false;
          this.userMenuOpen = false;
        })
    );

    this.subscriptions.push(
      this.userNotificationsService.getAll().subscribe(
        (notifications: AppNotificationMessage[]) => {
          this.notificationNumber = this.getNotSeenNotificationsCount(notifications);
          // TODO: make a function that retreves only the count of the notifications
        },
        (error: Error) => {
          AppUtil.showError(error);
        }
      )
    );

    this.subscriptions.push(
      this.webSocketService
        .onMessage(SocketTopics.TOPIC_GROUPED_NOTIFICATION)
        .subscribe((notificationFromServer: AppNotificationMessage) => {
          let sum = 0;
          for (let notification of notificationFromServer.content) {
            sum += notification.notificationsCount;
          }
          this.notificationNumber = sum;
        })
    );
  }

  private getNotSeenNotificationsCount = (notifications: AppNotificationMessage[]): number => {
    let count = 0;
    for (let i = 0; i < notifications.length; i++) {
      if (!notifications[i].seen) {
        count++;
      }
    }
    return count;
  };

  // ---- Layout ----------------------------------------------------------

  /** Icon-only rail: forced on tablets, user's choice on desktop, never in the phone drawer. */
  get collapsed(): boolean {
    if (this.viewport === 'phone') {
      return false;
    }
    return this.viewport === 'tablet' || this.userCollapsed;
  }

  get canToggleCollapse(): boolean {
    return this.viewport === 'desktop' || this.viewport === 'wide';
  }

  get isPhone(): boolean {
    return this.viewport === 'phone';
  }

  /** The AI panel docks as a third column on ≥ xl; below that it overlays the page. */
  get aiDocked(): boolean {
    return this.viewport === 'wide';
  }

  private observeBreakpoints(): Observable<BreakpointState> {
    return this.breakpointObserver.observe(['(min-width: 768px)', '(min-width: 1024px)', '(min-width: 1280px)']);
  }

  private resolveViewport(): Viewport {
    if (this.breakpointObserver.isMatched('(min-width: 1280px)')) {
      return 'wide';
    }
    if (this.breakpointObserver.isMatched('(min-width: 1024px)')) {
      return 'desktop';
    }
    if (this.breakpointObserver.isMatched('(min-width: 768px)')) {
      return 'tablet';
    }
    return 'phone';
  }

  openDrawer(): void {
    this.drawerOpen = true;
    setTimeout(() => this.drawerCloseButton?.nativeElement.focus());
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  // ---- Sidebar content ---------------------------------------------------

  badgeFor(badge: NavBadge | undefined): string | null {
    if (badge === 'members') {
      return this.context.memberCount !== null ? String(this.context.memberCount) : null;
    }
    if (badge === 'maintenance') {
      return this.notificationNumber > 0 ? this.formatCount(this.notificationNumber) : null;
    }
    return null;
  }

  get gymName(): string {
    return this.context.gymName ?? 'Your gym';
  }

  get gymInitials(): string {
    return initialsOf(this.gymName) || 'G';
  }

  get gymSubtitle(): string {
    const count: number | null = this.context.memberCount;
    if (count === null) {
      return '';
    }
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  }

  get userName(): string {
    if (!this.currentUser) {
      return '';
    }
    return `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''}`.trim();
  }

  get userRole(): string {
    return (this.currentUser && ROLE_LABELS[this.currentUser.roleId]) || '';
  }

  get notificationsLabel(): string {
    return this.notificationNumber > 0 ? `Notifications, ${this.notificationNumber} unread` : 'Notifications';
  }

  formatCount(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  // ---- User menu ---------------------------------------------------------

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      setTimeout(() => this.menuItems()[0]?.focus());
    }
  }

  closeUserMenu(returnFocus: boolean): void {
    this.userMenuOpen = false;
    if (returnFocus) {
      this.userMenuButton?.nativeElement.focus();
    }
  }

  onUserMenuKeydown(event: KeyboardEvent): void {
    const items: HTMLElement[] = this.menuItems();
    const index: number = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step: number = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      this.closeUserMenu(true);
    } else if (event.key === 'Tab') {
      this.closeUserMenu(false);
    }
  }

  private menuItems(): HTMLElement[] {
    const menu: HTMLElement | undefined = this.userMenu?.nativeElement;
    return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
  }

  logout(): void {
    this.userMenuOpen = false;
    const message: string = `Are you sure you want to log out?`;
    this.navigationService.openYesNoDialogNoCallback(message, 500).subscribe((res: boolean) => {
      if (res) {
        this.authService.logout();
      }
    });
  }

  // ---- Global shortcuts --------------------------------------------------

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const mod: boolean = event.metaKey || event.ctrlKey;
    const key: string = event.key.toLowerCase();
    if (mod && !event.altKey && !event.shiftKey && key === 'k') {
      event.preventDefault();
      this.shell.togglePalette();
    } else if (mod && !event.altKey && !event.shiftKey && key === 'j') {
      event.preventDefault();
      this.shell.toggleAiPanel();
    } else if (key === 'escape' && this.drawerOpen && !this.shell.paletteOpen) {
      this.closeDrawer();
    }
  }

  public openNotificationsDialog(): void {
    this.subscriptions.push(this.navigationService.openDialog(NotificationsDropdownComponent).subscribe());
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
