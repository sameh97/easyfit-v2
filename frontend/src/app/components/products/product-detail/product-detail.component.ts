import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatMoney } from 'src/app/common/money';
import { productCategoryKey } from 'src/app/common/product-categories';
import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { ProductActionsService } from '../product-actions.service';
import { salesOf, stockLabel, stockState, STOCK_PILL } from '../product-stock';

/** Recent sales shown in the panel. */
const RECENT_SALES: number = 5;

export type SalesState = 'loading' | 'ready' | 'error';

/** Product detail panel (§5.7): photo, category, stock, Sell / Edit / Delete, price, code, description, recent sales. */
@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styles: [':host { display: flex; flex-direction: column; min-height: 0; }'],
})
export class ProductDetailComponent {
  @Input() product!: Product;
  @Input() bills: Bill[] = [];
  @Input() salesState: SalesState = 'loading';
  @Output() deleted: EventEmitter<void> = new EventEmitter<void>();
  /** "All sales": the Sales tab, searched for this product. */
  @Output() showSales: EventEmitter<Product> = new EventEmitter<Product>();

  constructor(
    private shellActions: ShellActionsService,
    private actions: ProductActionsService,
    private menu: MenuService,
    public language: LanguageService
  ) {}

  get photo(): string | null {
    return realPhotoUrl(this.product.imgUrl);
  }

  get categoryKey(): string {
    return productCategoryKey(Number(this.product.categoryID));
  }

  get stockText(): string {
    return stockLabel(this.product.quantity, this.language);
  }

  get stockClass(): string {
    return STOCK_PILL[stockState(this.product.quantity)];
  }

  get price(): string {
    return formatMoney(this.product.price);
  }

  get sales(): Bill[] {
    return salesOf(this.bills, this.product.id);
  }

  get recentSales(): Bill[] {
    return this.sales.slice(0, RECENT_SALES);
  }

  /** Sales of this product in the current month. */
  get thisMonth(): number {
    const now: Date = new Date();
    return this.sales.filter((bill: Bill) => {
      const at: Date = new Date(bill.createdAt ?? 0);
      return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
    }).length;
  }

  money(value: number): string {
    return formatMoney(value);
  }

  sell(): void {
    this.shellActions.sellProduct(this.product).subscribe();
  }

  edit(): void {
    this.shellActions.editProduct(this.product).subscribe();
  }

  openMoreMenu(event: Event): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.deleteProduct(this.product).subscribe((done: boolean) => done && this.deleted.emit());
      }
    });
  }

  trackById(_index: number, bill: Bill): number {
    return bill.id;
  }
}
