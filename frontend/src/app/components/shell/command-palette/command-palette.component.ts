import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Member } from 'src/app/model/member';
import { Product } from 'src/app/model/product';
import { MembersService } from 'src/app/services/members-service/members.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { CreateAction, ShellActionsService } from 'src/app/services/shell-actions.service';
import { PaletteMode, ShellStateService } from 'src/app/services/shell-state.service';
import { IconName } from 'src/app/shared/ui/icon/icons';
import { productCategoryLabel } from 'src/app/common/product-categories';
import { AppUtil } from 'src/app/common/app-util';
import { NAV_GROUPS, NavItem, PROFILE_PAGE } from '../shell-nav';

type PaletteGroupKey = 'ask-ai' | 'members' | 'products' | 'pages' | 'actions';

interface PaletteItem {
  id: string;
  label: string;
  icon: IconName;
  /** Secondary text after the label (phone, price…). */
  detail?: string;
  /** Right-aligned hint (status, shortcut…). */
  meta?: string;
  avatar?: { name: string; id: number; imageUrl: string | null };
  disabled?: boolean;
  run?: () => void;
}

interface PaletteGroup {
  key: PaletteGroupKey;
  label: string;
  items: PaletteItem[];
  /** Shown instead of items (e.g. "Loading…", "No members match"). */
  note?: string;
}

interface ActionDefinition {
  label: string;
  icon: IconName;
  keywords: string;
  action: CreateAction | 'sell-product';
}

const ACTIONS: ActionDefinition[] = [
  { label: 'Add member', icon: 'user-plus', keywords: 'new member create join', action: 'add-member' },
  { label: 'Sell product', icon: 'shopping-bag', keywords: 'sale bill shop pos', action: 'sell-product' },
  { label: 'New class', icon: 'calendar-plus', keywords: 'group training create class', action: 'new-class' },
  { label: 'Add trainer', icon: 'user-check', keywords: 'new trainer coach create', action: 'add-trainer' },
  { label: 'Add product', icon: 'package', keywords: 'new product stock create', action: 'add-product' },
  { label: 'Schedule maintenance', icon: 'wrench', keywords: 'clean service machine job', action: 'schedule-maintenance' },
];

const MAX_MEMBER_RESULTS = 6;
const MAX_PRODUCT_RESULTS = 8;

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  open: boolean = false;
  mode: PaletteMode = 'default';
  query: string = '';
  groups: PaletteGroup[] = [];
  activeIndex: number = 0;

  private selectable: PaletteItem[] = [];
  private members: Member[] | null = null;
  private products: Product[] | null = null;
  private membersError: boolean = false;
  private productsError: boolean = false;
  private returnFocusTo: HTMLElement | null = null;
  private subscriptions: Subscription[] = [];
  private dataSubscriptions: Subscription[] = [];

  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('resultsList') private resultsList?: ElementRef<HTMLElement>;

  constructor(
    public shell: ShellStateService,
    private router: Router,
    private membersService: MembersService,
    private productsService: ProductsService,
    private actions: ShellActionsService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.shell.paletteMode$.subscribe((mode: PaletteMode) => {
        this.mode = mode;
        this.query = '';
        this.rebuild();
      })
    );
    this.subscriptions.push(
      this.shell.paletteOpen$.subscribe((open: boolean) => (open ? this.onOpen() : this.onClose()))
    );
  }

  // ---- Open / close ------------------------------------------------------

  private onOpen(): void {
    if (!this.open) {
      this.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.open = true;
    this.query = '';
    this.loadData();
    this.rebuild();
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  private onClose(): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    AppUtil.releaseSubscriptions(this.dataSubscriptions);
    this.dataSubscriptions = [];
    const target: HTMLElement | null = this.returnFocusTo;
    this.returnFocusTo = null;
    if (target && document.body.contains(target)) {
      setTimeout(() => target.focus());
    }
  }

  close(): void {
    this.shell.closePalette();
  }

  /** Close without restoring focus (a dialog or a new page takes it). */
  private closeForHandoff(): void {
    this.returnFocusTo = null;
    this.shell.closePalette();
  }

  private loadData(): void {
    this.membersError = false;
    this.productsError = false;
    this.dataSubscriptions.push(
      this.membersService.getAll().subscribe(
        (members: Member[] | null) => {
          this.members = members ?? [];
          this.rebuild();
        },
        () => {
          this.membersError = true;
          this.rebuild();
        }
      )
    );
    if (this.mode === 'sell-product' || this.products === null) {
      this.loadProducts();
    }
  }

  private loadProducts(): void {
    this.dataSubscriptions.push(
      this.productsService.getAll().subscribe(
        (products: Product[] | null) => {
          this.products = products ?? [];
          this.rebuild();
        },
        () => {
          this.productsError = true;
          this.rebuild();
        }
      )
    );
  }

  // ---- Results -----------------------------------------------------------

  onQueryChange(value: string): void {
    this.query = value;
    this.rebuild();
  }

  private rebuild(): void {
    const q: string = this.query.trim().toLowerCase();
    this.groups = this.mode === 'sell-product' ? this.buildSellGroups(q) : this.buildDefaultGroups(q);
    this.selectable = this.groups
      .reduce((all: PaletteItem[], group: PaletteGroup) => all.concat(group.items), [])
      .filter((item: PaletteItem) => !item.disabled);
    this.activeIndex = 0;
  }

  private buildDefaultGroups(q: string): PaletteGroup[] {
    const groups: PaletteGroup[] = [
      {
        key: 'ask-ai',
        label: 'Ask AI',
        items: [
          {
            id: 'ask-ai',
            label: q ? `Ask EasyFit AI: “${this.query.trim()}”` : 'Ask EasyFit AI anything about your gym',
            icon: 'sparkle',
            meta: 'Coming soon',
            disabled: true,
          },
        ],
      },
    ];

    if (q) {
      groups.push(this.buildMembersGroup(q));
    }

    const pages: PaletteItem[] = this.allPages()
      .filter((page: NavItem) => !q || page.label.toLowerCase().includes(q))
      .map((page: NavItem) => ({
        id: `page:${page.path}`,
        label: page.label,
        icon: page.icon,
        meta: this.router.isActive(page.path, false) ? 'Current page' : undefined,
        run: () => this.goTo(page.path),
      }));
    if (pages.length) {
      groups.push({ key: 'pages', label: 'Pages', items: pages });
    }

    const actions: PaletteItem[] = ACTIONS.filter(
      (action: ActionDefinition) => !q || `${action.label} ${action.keywords}`.toLowerCase().includes(q)
    ).map((action: ActionDefinition) => ({
      id: `action:${action.action}`,
      label: action.label,
      icon: action.icon,
      meta: action.action === 'sell-product' ? 'Pick a product' : undefined,
      run: () => this.runAction(action.action),
    }));
    if (actions.length) {
      groups.push({ key: 'actions', label: 'Actions', items: actions });
    }

    return groups;
  }

  private buildMembersGroup(q: string): PaletteGroup {
    const group: PaletteGroup = { key: 'members', label: 'Members', items: [] };
    if (this.membersError) {
      group.note = 'Could not load members.';
      return group;
    }
    if (this.members === null) {
      group.note = 'Loading members…';
      return group;
    }
    const digits: string = q.replace(/\D/g, '');
    group.items = this.members
      .filter((member: Member) => {
        const name: string = `${member.firstName} ${member.lastName}`.toLowerCase();
        const phone: string = (member.phone ?? '').replace(/\D/g, '');
        return (
          name.includes(q) ||
          (member.email ?? '').toLowerCase().includes(q) ||
          (digits.length >= 3 && phone.includes(digits))
        );
      })
      .slice(0, MAX_MEMBER_RESULTS)
      .map((member: Member) => ({
        id: `member:${member.id}`,
        label: `${member.firstName} ${member.lastName}`,
        detail: member.phone,
        icon: 'user' as IconName,
        avatar: { name: `${member.firstName} ${member.lastName}`, id: member.id, imageUrl: member.imageURL || null },
        meta: this.memberStatus(member),
        run: () => this.editMember(member),
      }));
    if (!group.items.length) {
      group.note = 'No members match.';
    }
    return group;
  }

  private buildSellGroups(q: string): PaletteGroup[] {
    const group: PaletteGroup = { key: 'products', label: 'Products', items: [] };
    if (this.productsError) {
      group.note = 'Could not load products.';
    } else if (this.products === null) {
      group.note = 'Loading products…';
    } else {
      group.items = this.products
        .filter(
          (product: Product) =>
            !q || product.name.toLowerCase().includes(q) || (product.code ?? '').toLowerCase().includes(q)
        )
        .slice(0, MAX_PRODUCT_RESULTS)
        .map((product: Product) => ({
          id: `product:${product.id}`,
          label: product.name,
          detail: `${productCategoryLabel(product.categoryID)} · ₪${product.price.toLocaleString('en-US')}`,
          icon: 'package' as IconName,
          meta: product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock',
          disabled: product.quantity <= 0,
          run: () => this.sell(product),
        }));
      if (!group.items.length) {
        group.note = this.products.length ? 'No products match.' : 'No products yet. Add one first.';
      }
    }
    return [group];
  }

  private allPages(): NavItem[] {
    return NAV_GROUPS.reduce((all: NavItem[], group) => all.concat(group.items), [] as NavItem[]).concat(PROFILE_PAGE);
  }

  private memberStatus(member: Member): string {
    if (!member.isActive) {
      return 'Inactive';
    }
    if (member.endOfMembershipDate) {
      const days: number = (new Date(member.endOfMembershipDate).getTime() - Date.now()) / 86400000;
      if (days >= 0 && days <= 7) {
        return 'Expiring';
      }
    }
    return 'Active';
  }

  // ---- Running items -----------------------------------------------------

  isActive(item: PaletteItem): boolean {
    return this.selectable[this.activeIndex] === item;
  }

  optionId(item: PaletteItem): string {
    return `palette-opt-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  get activeOptionId(): string | null {
    const item: PaletteItem | undefined = this.selectable[this.activeIndex];
    return item ? this.optionId(item) : null;
  }

  hover(item: PaletteItem): void {
    const index: number = this.selectable.indexOf(item);
    if (index >= 0) {
      this.activeIndex = index;
    }
  }

  activate(item: PaletteItem): void {
    if (!item.disabled && item.run) {
      item.run();
    }
  }

  private goTo(path: string): void {
    this.closeForHandoff();
    this.router.navigateByUrl(path);
  }

  private runAction(action: CreateAction | 'sell-product'): void {
    if (action === 'sell-product') {
      this.shell.openPalette('sell-product');
      if (this.products === null) {
        this.loadProducts();
      }
      setTimeout(() => this.searchInput?.nativeElement.focus());
      return;
    }
    this.closeForHandoff();
    this.actions.create(action).pipe(take(1)).subscribe();
  }

  private editMember(member: Member): void {
    this.closeForHandoff();
    this.actions.editMember(member).pipe(take(1)).subscribe();
  }

  private sell(product: Product): void {
    this.closeForHandoff();
    this.actions.sellProduct(product).pipe(take(1)).subscribe();
  }

  backToDefault(): void {
    this.shell.openPalette('default');
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  // ---- Keyboard ----------------------------------------------------------

  onKeydown(event: KeyboardEvent): void {
    const count: number = this.selectable.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (count) {
          this.activeIndex = (this.activeIndex + 1) % count;
          this.scrollActiveIntoView();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) {
          this.activeIndex = (this.activeIndex - 1 + count) % count;
          this.scrollActiveIntoView();
        }
        break;
      case 'Home':
        if (count && !this.query) {
          event.preventDefault();
          this.activeIndex = 0;
          this.scrollActiveIntoView();
        }
        break;
      case 'End':
        if (count && !this.query) {
          event.preventDefault();
          this.activeIndex = count - 1;
          this.scrollActiveIntoView();
        }
        break;
      case 'Enter': {
        event.preventDefault();
        const item: PaletteItem | undefined = this.selectable[this.activeIndex];
        if (item) {
          this.activate(item);
        }
        break;
      }
      case 'Tab':
        // Focus stays in the palette. Tab will hand the query to the AI once it ships.
        event.preventDefault();
        break;
      case 'Backspace':
        if (this.mode === 'sell-product' && !this.query) {
          event.preventDefault();
          this.backToDefault();
        }
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        if (this.mode === 'sell-product') {
          this.backToDefault();
        } else {
          this.close();
        }
        break;
    }
  }

  /** Esc must still close when focus has wandered (e.g. after clicking the backdrop area). */
  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.open && document.activeElement !== this.searchInput?.nativeElement) {
      this.close();
    }
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const id: string | null = this.activeOptionId;
      const el: HTMLElement | null = id && this.resultsList ? this.resultsList.nativeElement.querySelector(`#${id}`) : null;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  trackById(_index: number, item: PaletteItem): string {
    return item.id;
  }

  trackByKey(_index: number, group: PaletteGroup): string {
    return group.key;
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
    AppUtil.releaseSubscriptions(this.dataSubscriptions);
  }
}
