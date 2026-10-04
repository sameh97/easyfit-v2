import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConsts } from 'src/app/common/consts';
import { productCategoryKey } from 'src/app/common/product-categories';
import { Product } from 'src/app/model/product';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { LanguageService } from 'src/app/services/language.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { SelectOption } from 'src/app/shared/ui/form/select.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';

export interface ProductFormData {
  /** null = a new product. */
  product: Product | null;
}

export const PRODUCT_CATEGORY_IDS: readonly number[] = [1, 2, 3, 4, 5];

/**
 * Add / edit product side panel (§5.7): photo, name, category, description, code (LTR), price (LTR)
 * and quantity. Validation rules are exactly the legacy add/update product dialogs' ones.
 */
@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class ProductFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly original: Product | null;
  readonly isEdit: boolean;

  readonly name: FormControl;
  readonly categoryID: FormControl;
  readonly description: FormControl;
  readonly code: FormControl;
  readonly price: FormControl;
  readonly quantity: FormControl;
  readonly form: FormGroup;

  categoryOptions: SelectOption<number>[] = [];
  currentPhoto: string | null;
  saving: boolean = false;
  /** undefined = unchanged, null = removed, File = new photo. */
  private photo: File | null | undefined = undefined;
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: ProductFormData,
    public ref: SidePanelRef<Product>,
    private host: ElementRef<HTMLElement>,
    private products: ProductsService,
    private fileUpload: FileUploadService,
    private toast: ToastService,
    private language: LanguageService
  ) {
    super();
    this.original = data?.product ?? null;
    this.isEdit = !!this.original;
    const p: Product | null = this.original;

    this.name = new FormControl(p?.name ?? '', [Validators.required, this.validateProductName]);
    this.categoryID = new FormControl(p ? Number(p.categoryID) : null, [Validators.required]);
    this.description = new FormControl(p?.description ?? '', [Validators.required]);
    this.code = new FormControl(p?.code ?? '', [Validators.required, this.validateProductCode]);
    this.price = new FormControl(p ? String(p.price ?? '') : '', [Validators.required, Validators.min(0), this.validatePrice]);
    this.quantity = new FormControl(p ? String(p.quantity ?? '') : '', [Validators.compose([Validators.required, this.nonZero])]);
    this.form = new FormGroup({
      name: this.name,
      categoryID: this.categoryID,
      description: this.description,
      code: this.code,
      price: this.price,
      quantity: this.quantity,
    });
    this.currentPhoto = realPhotoUrl(p?.imgUrl);

    this.subscriptions.push(
      this.language.lang$.subscribe(() => {
        this.categoryOptions = PRODUCT_CATEGORY_IDS.map((id: number) => ({ value: id, label: this.language.t(productCategoryKey(id)) }));
      })
    );
  }

  get title(): string {
    return this.language.t(this.isEdit ? 'products.form.editTitle' : 'products.form.addTitle');
  }

  isDirty(): boolean {
    return this.form.dirty || this.photo !== undefined;
  }

  onPhoto(file: File | null): void {
    this.photo = file;
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const name: string = String(this.name.value).trim();
    const upload$: Observable<string | null> = this.photo ? this.fileUpload.uploadImage(this.photo, null) : of(null);
    this.subscriptions.push(
      upload$
        .pipe(
          switchMap((uploaded: string | null) => {
            const product: Product = this.buildProduct(uploaded);
            return this.isEdit ? this.products.update(product) : this.products.create(product);
          })
        )
        .subscribe(
          (saved: Product) => {
            this.toast.success(this.language.t(this.isEdit ? 'products.toast.updated' : 'products.toast.added', { name }));
            this.ref.close(saved);
          },
          () => {
            this.saving = false;
            this.toast.error(this.language.t('products.toast.saveError', { name }));
          }
        )
    );
  }

  private buildProduct(uploadedUrl: string | null): Product {
    // No photo → the placeholder image the legacy form saved (shown as an icon tile in Studio).
    let imgUrl: string = uploadedUrl ?? this.original?.imgUrl ?? AppConsts.PRODUCT_DEFULT_IMAGE;
    if (this.photo === null) {
      imgUrl = AppConsts.PRODUCT_DEFULT_IMAGE;
    }
    const product: Product = Object.assign(new Product(), this.original ?? {});
    return Object.assign(product, {
      name: String(this.name.value).trim(),
      categoryID: Number(this.categoryID.value),
      description: String(this.description.value).trim(),
      code: String(this.code.value).trim(),
      price: Number(this.price.value),
      quantity: Number(this.quantity.value),
      imgUrl,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
