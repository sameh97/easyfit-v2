import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { formatMoney } from 'src/app/common/money';
import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { DashboardService } from 'src/app/services/dashboard-service/dashboard.service';
import { LanguageService } from 'src/app/services/language.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

/** Deletes products and sales through the existing endpoints, with confirm + toasts. */
@Injectable({
  providedIn: 'root',
})
export class ProductActionsService {
  constructor(
    private products: ProductsService,
    private dashboard: DashboardService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** Emits true when the product was deleted. */
  deleteProduct(product: Product): Observable<boolean> {
    const name: string = product.name;
    return this.confirmDialog
      .confirm({
        title: this.language.t('products.confirm.deleteTitle', { name }),
        message: this.language.t('products.confirm.deleteBody'),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.products.delete(product.id).pipe(
            map(() => {
              this.toast.success(this.language.t('products.toast.deleted', { name }));
              this.refreshDashboard();
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('products.toast.deleteError', { name }));
              return of(false);
            })
          );
        })
      );
  }

  /** Deleting a sale puts its quantity back into stock (backend); the product list is reloaded. */
  deleteSale(bill: Bill): Observable<boolean> {
    const params = { product: bill.productName, customer: bill.coustomerName, total: formatMoney(bill.totalCost) };
    return this.confirmDialog
      .confirm({
        title: this.language.t('sales.confirm.deleteTitle', params),
        message: this.language.tCount('sales.confirm.deleteBody', Number(bill.quantity), { product: bill.productName }),
        confirmLabel: this.language.t('sales.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.products.deleteBill(bill.id).pipe(
            map(() => {
              this.toast.success(this.language.t('sales.toast.deleted', params));
              this.refreshStock();
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('sales.toast.deleteError'));
              return of(false);
            })
          );
        })
      );
  }

  /** Stock changes on the server after a sale or a deleted sale. */
  refreshStock(): void {
    this.products.getAll().pipe(take(1)).subscribe({ error: () => undefined });
    this.refreshDashboard();
  }

  private refreshDashboard(): void {
    this.dashboard.load().subscribe({ error: () => undefined });
  }
}
