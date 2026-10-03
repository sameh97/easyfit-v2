import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterEvent } from '@angular/router';
import { merge, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AppUtil } from 'src/app/common/app-util';
import { MaintenanceAlertsService } from 'src/app/services/maintenance-alerts.service';
import { User } from 'src/app/model/user';
import { NavBadge, NavGroup, NAV_GROUPS } from '../shell/shell-nav';
import { ShellStateService } from 'src/app/services/shell-state.service';
import { ShellContext, ShellContextService } from 'src/app/services/shell-context.service';
import { initialsOf } from 'src/app/shared/ui/avatar/avatar.component';
import { DashboardService } from 'src/app/services/dashboard-service/dashboard.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { Lang, LANGUAGES, LANGUAGE_NAMES, LanguageService, TextDir } from 'src/app/services/language.service';

/** Below md: off-canvas drawer. md–lg: 72px rail. ≥ lg: full sidebar (user can collapse). ≥ xl: AI panel docks. */
type Viewport = 'phone' | 'tablet' | 'desktop' | 'wide';

const ROLE_KEYS: Record<number, string> = { 1: 'shell.user.roles.manager', 2: 'shell.user.roles.admin' };

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit, OnDestroy {
  notificationNumber: number = 0;
  notificationsOpen: boolean = false;
  currentUser: User | null = null;
  context: ShellContext = { gymName: null, memberCount: null, maintenanceDue: null };
  viewport: Viewport = 'desktop';
  drawerOpen: boolean = false;
  userMenuOpen: boolean = false;
  aiPanelOpen: boolean = false;
  lang: Lang;
  /** Redesigned pages follow the UI language; legacy pages are pinned to English LTR. */
  studioRoute: boolean = false;
  readonly languages: readonly Lang[] = LANGUAGES;
  readonly languageNames: Record<Lang, string> = LANGUAGE_NAMES;
  private userCollapsed: boolean = false;
  private subscriptions: Subscription[] = [];

  @ViewChild('drawerCloseButton') private drawerCloseButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('userMenuButton') private userMenuButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('userMenu') private userMenu?: ElementRef<HTMLElement>;
  @ViewChild('bellButton', { read: ElementRef }) private bellButton?: ElementRef<HTMLButtonElement>;

  readonly navGroups: NavGroup[] = NAV_GROUPS;

  constructor(
    private authService: AuthenticationService,
    private alerts: MaintenanceAlertsService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private shellContextService: ShellContextService,
    private dashboardService: DashboardService,
    private language: LanguageService,
    private confirmDialog: ConfirmDialogService,
    public shell: ShellStateService
  ) {
    this.lang = language.current;
  }

  ngOnInit(): void {
    this.studioRoute = this.isStudioRoute();
    this.subscriptions.push(this.language.lang$.subscribe((lang: Lang) => (this.lang = lang)));

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
          this.studioRoute = this.isStudioRoute();
        })
    );

    this.subscriptions.push(this.alerts.count$.subscribe((count: number) => (this.notificationNumber = count)));

    // A job fired, or alerts were cleared: the due/overdue count behind the Maintenance badge changed.
    this.subscriptions.push(
      merge(this.alerts.arrived$, this.alerts.cleared$)
        .subscribe(() => this.dashboardService.load().subscribe({ error: () => undefined }))
    );
  }

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
      // Jobs due today or overdue (not the unread-alert count, which stays on the bell). Hidden at 0.
      const due: number | null = this.context.maintenanceDue;
      return due ? this.formatCount(due) : null;
    }
    return null;
  }

  get gymName(): string {
    return this.context.gymName ?? this.language.t('shell.gym.fallbackName');
  }

  /** First letters of the first two words ("Power House TLV" → "PH"), as in the mockup. */
  get gymInitials(): string {
    const words: string[] = this.gymName.trim().split(/\s+/).slice(0, 2);
    return initialsOf(words.join(' ')) || 'G';
  }

  get gymSubtitle(): string {
    const count: number | null = this.context.memberCount;
    if (count === null) {
      return '';
    }
    return this.language.tCount('shell.gym.members', count);
  }

  get userName(): string {
    if (!this.currentUser) {
      return '';
    }
    return `${this.currentUser.firstName ?? ''} ${this.currentUser.lastName ?? ''}`.trim();
  }

  get userRoleKey(): string | null {
    return (this.currentUser && ROLE_KEYS[this.currentUser.roleId]) || null;
  }

  get notificationsLabel(): string {
    return this.notificationNumber > 0
      ? this.language.tCount('shell.notifications.unread', this.notificationNumber)
      : this.language.t('shell.notifications.label');
  }

  // ---- Language ----------------------------------------------------------

  get contentDir(): TextDir {
    return this.studioRoute ? this.language.dir : 'ltr';
  }

  get contentLang(): Lang {
    return this.studioRoute ? this.lang : 'en';
  }

  setLanguage(lang: Lang): void {
    this.language.use(lang);
  }

  /** Routes opt in with `data: { studio: true }` once their page is redesigned. */
  private isStudioRoute(): boolean {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return route?.data?.studio === true;
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
    // Focus the account button first so the dialog returns focus there (the menu item goes away).
    this.closeUserMenu(true);
    this.confirmDialog
      .confirm({
        title: this.language.t('shell.user.logoutTitle'),
        message: this.language.t('shell.user.logoutBody'),
        confirmLabel: this.language.t('shell.user.logout'),
        tone: 'danger',
      })
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
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

  // ---- Notifications ---------------------------------------------------

  /** The bell's element (a template ref on an appIconButton is the component). */
  get bellElement(): HTMLElement | null {
    return this.bellButton?.nativeElement ?? null;
  }

  toggleNotifications(): void {
    if (this.notificationsOpen) {
      this.closeNotifications(true);
    } else {
      this.notificationsOpen = true;
    }
  }

  closeNotifications(returnFocus: boolean): void {
    this.notificationsOpen = false;
    if (returnFocus) {
      this.bellButton?.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
