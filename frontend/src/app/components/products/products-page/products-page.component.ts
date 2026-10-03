import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { formatMoney } from 'src/app/common/money';
import { productCategoryKey } from 'src/app/common/product-categories';
import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { LanguageService } from 'src/app/services/language.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { TabItem } from 'src/app/shared/ui/tabs/tabs.component';
import { SalesState } from '../product-detail/product-detail.component';
import { PRODUCT_CATEGORY_IDS } from '../product-form/product-form.component';
import { stockLabel, stockState, StockState, STOCK_PILL } from '../product-stock';

type LoadState = 'loading' | 'ready' | 'error';
type PageTab = 'products' | 'sales';
export type StockFilter = 'all' | 'low' | 'out';

const STOCK_FILTERS: readonly StockFilter[] = ['all', 'low', 'out'];
const SKELETON_CARDS: readonly number[] = [1, 2, 3, 4, 5, 6];

/**
 * Products and Sales (redesign.md §5.7): product cards with stock states, a stock filter, a
 * category filter and a search, the product detail panel, add/edit and sell side panels; the
 * Sales tab lists the bills. Deep links ?product=<id> and ?tab=sales.
 */
@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  tab: PageTab = 'products';
  state: LoadState = 'loading';
  salesState: SalesState = 'loading';
  products: Product[] = [];
  bills: Bill[] = [];
  filtered: Product[] = [];
  stockFilter: StockFilter = 'all';
  categoryFilter: number | null = null;
  query: string = '';
  salesQuery: string = '';
  selectedId: number | null = null;
  wide: boolean = true;
  tabItems: TabItem<PageTab>[] = [];
  readonly stockFilters: readonly StockFilter[] = STOCK_FILTERS;
  readonly skeletonCards: readonly number[] = SKELETON_CARDS;

  private pendingId: number | null = null;
  private productsSubscription: Subscription | null = null;
  private billsSubscription: Subscription | null = null;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    private productsService: ProductsService,
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
    this.loadSales();
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params: ParamMap) => {
        this.tab = params.get('tab') === 'sales' ? 'sales' : 'products';
        const id: number = Number(params.get('product'));
        this.pendingId = Number.isInteger(id) && id > 0 ? id : null;
        if (this.pendingId === null) {
          this.selectedId = null;
        }
        this.resolvePending();
      }),
      this.language.lang$.subscribe(() => {
        this.tabItems = [
          { id: 'products', label: this.language.t('products.page.tabProducts') },
          { id: 'sales', label: this.language.t('products.page.tabSales') },
        ];
      }),
      this.breakpointObserver.observe('(min-width: 1024px)').subscribe(() => {
        this.wide = this.breakpointObserver.isMatched('(min-width: 1024px)');
      })
    );
  }

  load(): void {
    this.state = 'loading';
    this.productsSubscription?.unsubscribe();
    this.productsSubscription = this.productsService.getAll().subscribe(
      (products: Product[] | null) => {
        if (products === null) {
          return;
        }
        this.products = [...products].sort((a: Product, b: Product) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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

  loadSales(): void {
    this.salesState = 'loading';
    this.billsSubscription?.unsubscribe();
    this.billsSubscription = this.productsService.getAllBills().subscribe(
      (bills: Bill[] | null) => {
        if (bills === null) {
          return;
        }
        this.bills = bills;
        this.salesState = 'ready';
      },
      () => (this.salesState = 'error')
    );
  }

  setTab(id: string): void {
    const tab: PageTab = id === 'sales' ? 'sales' : 'products';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'sales' ? 'sales' : null, product: tab === 'sales' ? null : this.selectedId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** "All sales" from a product: the Sales tab, searched for it. */
  showSalesOf(product: Product): void {
    this.salesQuery = product.name;
    this.setTab('sales');
  }

  // ---- Filters ------------------------------------------------------------------

  get counts(): Record<StockFilter, number> {
    const states: StockState[] = this.products.map((p: Product) => stockState(p.quantity));
    return {
      all: this.products.length,
      low: states.filter((s: StockState) => s === 'low' || s === 'critical').length,
      out: states.filter((s: StockState) => s === 'out').length,
    };
  }

  get subtitle(): string {
    const total: string = this.language.tCount('products.page.count', this.products.length);
    const low: number = this.counts.low + this.counts.out;
    return low ? `${total} · ${this.language.tCount('products.page.lowCount', low)}` : total;
  }

  setStockFilter(filter: StockFilter): void {
    this.stockFilter = filter;
    this.refilter();
  }

  get categoryLabel(): string {
    return this.language.t('products.page.categoryFilter', {
      name: this.categoryFilter === null ? this.language.t('products.page.categoryAll') : this.language.t(productCategoryKey(this.categoryFilter)),
    });
  }

  openCategoryMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [
      { id: 'all', label: this.language.t('products.page.categoryAll'), checked: this.categoryFilter === null },
      ...PRODUCT_CATEGORY_IDS.map((id: number) => ({ id: String(id), label: this.language.t(productCategoryKey(id)), checked: this.categoryFilter === id })),
    ];
    this.menu.open(trigger, items, this.language.t('products.page.categoryFilterLabel')).subscribe((id: string | null) => {
      if (id !== null) {
        this.categoryFilter = id === 'all' ? null : Number(id);
        this.refilter();
      }
    });
  }

  onSearch(value: string): void {
    this.query = value;
    this.refilter();
  }

  get filtering(): boolean {
    return this.stockFilter !== 'all' || this.categoryFilter !== null || this.query.trim() !== '';
  }

  private refilter(): void {
    const q: string = this.query.trim().toLowerCase();
    this.filtered = this.products.filter((product: Product) => {
      const state: StockState = stockState(product.quantity);
      if (this.stockFilter === 'low' && state !== 'low' && state !== 'critical') {
        return false;
      }
      if (this.stockFilter === 'out' && state !== 'out') {
        return false;
      }
      if (this.categoryFilter !== null && Number(product.categoryID) !== this.categoryFilter) {
        return false;
      }
      return !q || product.name.toLowerCase().includes(q) || (product.code ?? '').toLowerCase().includes(q);
    });
  }

  // ---- Cards --------------------------------------------------------------------

  photo(product: Product): string | null {
    return realPhotoUrl(product.imgUrl);
  }

  categoryKey(product: Product): string {
    return productCategoryKey(Number(product.categoryID));
  }

  stockText(product: Product): string {
    return stockLabel(product.quantity, this.language);
  }

  stockClass(product: Product): string {
    return STOCK_PILL[stockState(product.quantity)];
  }

  price(product: Product): string {
    return formatMoney(product.price);
  }

  add(): void {
    this.shellActions.addProduct().subscribe((product: Product | undefined) => product && this.select(product));
  }

  sell(event: Event, product: Product): void {
    event.stopPropagation();
    this.shellActions.sellProduct(product).subscribe();
  }

  trackById(_index: number, product: Product): number {
    return product.id;
  }

  // ---- Detail panel ---------------------------------------------------------------

  get selected(): Product | null {
    return this.selectedId === null ? null : this.products.find((product: Product) => product.id === this.selectedId) ?? null;
  }

  get narrow(): boolean {
    return this.wide && this.selected !== null;
  }

  select(product: Product): void {
    this.selectedId = product.id;
    this.router.navigate([], { relativeTo: this.route, queryParams: { product: product.id, tab: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  closeDetail(): void {
    this.selectedId = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { product: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private resolvePending(): void {
    if (this.pendingId === null || this.state !== 'ready') {
      return;
    }
    const id: number = this.pendingId;
    this.pendingId = null;
    if (this.products.some((product: Product) => product.id === id)) {
      this.selectedId = id;
    } else {
      this.toast.error(this.language.t('products.toast.notFound'));
      this.closeDetail();
    }
  }

  ngOnDestroy(): void {
    this.productsSubscription?.unsubscribe();
    this.billsSubscription?.unsubscribe();
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
