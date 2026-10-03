import { Component, ElementRef, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { formatMoney } from 'src/app/common/money';
import { Bill } from 'src/app/model/bill';
import { Member } from 'src/app/model/member';
import { Product } from 'src/app/model/product';
import { LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { validateAndFocus } from 'src/app/shared/ui/form/field';
import { MultiSelectOption } from 'src/app/shared/ui/form/multi-select.component';
import { CloseGuard, SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { fullName } from '../../members-components/member-status';
import { ProductActionsService } from '../product-actions.service';
import { stockLabel } from '../product-stock';

export interface SellFormData {
  product: Product;
}

/**
 * Sell side panel (§5.7, POS-like): quantity stepper (up to the stock), an optional member that
 * fills in the name and phone, the customer's name, phone and Israeli ID, and the live total.
 * Rules as the legacy sell dialog: quantity > 0 and not above the stock, name letters only,
 * Israeli mobile, Israeli ID checksum.
 */
@Component({
  selector: 'app-sell-form',
  templateUrl: './sell-form.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class SellFormComponent extends FormInputComponent implements CloseGuard, OnDestroy {
  readonly product: Product;
  readonly member: FormControl = new FormControl([]);
  readonly quantity: FormControl;
  readonly coustomerName: FormControl;
  readonly coustomerPhone: FormControl;
  readonly coustomerID: FormControl;
  readonly form: FormGroup;

  memberOptions: MultiSelectOption[] = [];
  saving: boolean = false;
  private members: Member[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: SellFormData,
    public ref: SidePanelRef<Bill>,
    private host: ElementRef<HTMLElement>,
    private products: ProductsService,
    private membersService: MembersService,
    private actions: ProductActionsService,
    private toast: ToastService,
    public language: LanguageService
  ) {
    super();
    this.product = data.product;
    this.quantity = new FormControl('1', [Validators.required, this.nonZero, this.withinStock]);
    this.coustomerName = new FormControl('', [Validators.required, this.validateName]);
    this.coustomerPhone = new FormControl('', [Validators.required, this.validatePhoneNumber]);
    this.coustomerID = new FormControl('', [Validators.required, this.validateID]);
    this.form = new FormGroup({
      quantity: this.quantity,
      coustomerName: this.coustomerName,
      coustomerPhone: this.coustomerPhone,
      coustomerID: this.coustomerID,
    });

    this.subscriptions.push(
      this.membersService.getAll().subscribe((members: Member[] | null) => {
        if (!members) {
          return;
        }
        this.members = members;
        this.memberOptions = members
          .map((m: Member) => ({ value: m.id, label: fullName(m), caption: m.phone, imageUrl: realPhotoUrl(m.imageURL) }))
          .sort((a: MultiSelectOption, b: MultiSelectOption) => a.label.localeCompare(b.label));
      }),
      // A picked member fills in the name and phone (still editable).
      this.member.valueChanges.subscribe((ids: number[]) => {
        const picked: Member | undefined = this.members.find((m: Member) => m.id === ids?.[0]);
        if (picked) {
          this.coustomerName.setValue(fullName(picked));
          this.coustomerPhone.setValue(picked.phone ?? '');
          this.coustomerName.markAsTouched();
          this.coustomerPhone.markAsTouched();
          this.form.markAsDirty();
        }
      })
    );
  }

  get stock(): number {
    return Number(this.product.quantity) || 0;
  }

  get stockText(): string {
    return stockLabel(this.stock, this.language);
  }

  get price(): string {
    return formatMoney(this.product.price);
  }

  get photo(): string | null {
    return realPhotoUrl(this.product.imgUrl);
  }

  /** Whole quantity when valid, else null. */
  private get count(): number | null {
    const n: number = Number(this.quantity.value);
    return this.quantity.valid && Number.isFinite(n) ? n : null;
  }

  get total(): string | null {
    const n: number | null = this.count;
    return n === null ? null : formatMoney(n * Number(this.product.price));
  }

  /** "2 × ₪249" */
  get totalDetail(): string {
    return `${this.count ?? 0} × ${this.price}`;
  }

  step(by: number): void {
    const current: number = Math.floor(Number(this.quantity.value) || 0);
    const next: number = Math.min(Math.max(current + by, 1), Math.max(this.stock, 1));
    this.quantity.setValue(String(next));
    this.quantity.markAsDirty();
    this.quantity.markAsTouched();
  }

  /** As the legacy sell dialog: not more than in stock (`quantityNotValid`). */
  private withinStock = (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return Number(value) > Number(this.product?.quantity) ? { quantityNotValid: { max: Number(this.product.quantity) } } : null;
  };

  isDirty(): boolean {
    return this.form.dirty;
  }

  save(): void {
    if (this.saving || !validateAndFocus(this.form, this.host.nativeElement)) {
      return;
    }
    this.saving = true;
    const quantity: number = Number(this.quantity.value);
    const bill: Bill = Object.assign(new Bill(), {
      gymId: this.product.gymId,
      productID: this.product.id,
      productName: this.product.name,
      quantity,
      totalCost: quantity * Number(this.product.price),
      coustomerName: String(this.coustomerName.value).trim(),
      coustomerPhone: String(this.coustomerPhone.value).trim(),
      coustomerID: String(this.coustomerID.value).trim(),
    });
    this.subscriptions.push(
      this.products.sell(bill).subscribe(
        (saved: Bill) => {
          this.toast.success(
            this.language.t('sales.toast.sold', { count: quantity, product: this.product.name, total: formatMoney(bill.totalCost) })
          );
          this.actions.refreshStock();
          this.ref.close(saved);
        },
        (error: unknown) => {
          this.saving = false;
          const message: string = error instanceof Error ? error.message : String(error);
          this.toast.error(this.language.t(/quantity is not available/i.test(message) ? 'sales.toast.stockError' : 'sales.toast.sellError'));
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
