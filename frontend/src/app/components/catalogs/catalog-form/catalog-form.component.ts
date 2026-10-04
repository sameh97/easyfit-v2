import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { formatMoney } from 'src/app/common/money';
import { Catalog } from 'src/app/model/catalog';
import { Product } from 'src/app/model/product';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { LanguageService } from 'src/app/services/language.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { MultiSelectOption } from 'src/app/shared/ui/form/multi-select.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface CatalogFormData {
  /** null = a new catalog. */
  catalog: Catalog | null;
}

/**
 * New / edit catalog side panel (§5.8): products as chips and how many days the link works.
 * Rules as the legacy dialogs: at least one product, 1–100 days.
 */
@Component({
  selector: 'app-catalog-form',
  templateUrl: './catalog-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class CatalogFormComponent implements CloseGuard, OnDestroy {
  readonly original: Catalog | null;
  readonly isEdit: boolean;
  readonly products: FormControl;
  readonly durationDays: FormControl;
  readonly form: FormGroup;

  productOptions: MultiSelectOption[] = [];
  saving: boolean = false;
  private allProducts: Product[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: CatalogFormData,
    public ref: SidePanelRef<Catalog>,
    private host: ElementRef<HTMLElement>,
    private catalogs: CatalogService,
    private productsService: ProductsService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    this.original = data?.catalog ?? null;
    this.isEdit = !!this.original;
    this.products = new FormControl((this.original?.products ?? []).map((p: Product) => p.id), [Validators.required]);
    this.durationDays = new FormControl(this.original ? String(this.original.durationDays) : '7', [
      Validators.required,
      Validators.min(1),
      Validators.max(100),
    ]);
    this.form = new FormGroup({ products: this.products, durationDays: this.durationDays });

    this.subscriptions.push(
      this.productsService.getAll().subscribe((products: Product[] | null) => {
        if (!products) {
          return;
        }
        this.allProducts = products;
        this.productOptions = products
          .map((p: Product) => ({ value: p.id, label: p.name, caption: `${p.code} · ${formatMoney(p.price)}`, imageUrl: realPhotoUrl(p.imgUrl) }))
          .sort((a: MultiSelectOption, b: MultiSelectOption) => a.label.localeCompare(b.label));
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'catalogs.form.editTitle' : 'catalogs.form.addTitle');
  }

  get productCount(): number {
    return Array.isArray(this.products.value) ? (this.products.value as number[]).length : 0;
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const ids = new Set<number>(this.products.value as number[]);
    const known: Product[] = this.allProducts.length ? this.allProducts : this.original?.products ?? [];
    const catalog: Catalog = Object.assign(new Catalog(), this.original ?? { isActive: true }, {
      durationDays: Number(this.durationDays.value),
      products: known.filter((p: Product) => ids.has(p.id)),
    });
    const save$: Observable<Catalog> = this.isEdit ? this.catalogs.update(catalog) : this.catalogs.create(catalog);
    this.subscriptions.push(
      save$.subscribe(
        (saved: Catalog) => {
          this.toast.success(this.language.t(this.isEdit ? 'catalogs.toast.updated' : 'catalogs.toast.added'));
          // The response leaves out the products; keep the ones we sent (the Share panel lists them).
          this.ref.close({ ...catalog, ...saved, products: catalog.products });
        },
        () => {
          this.saving = false;
          this.toast.error(this.language.t('catalogs.toast.saveError'));
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
