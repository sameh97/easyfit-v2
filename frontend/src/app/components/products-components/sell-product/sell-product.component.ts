import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-sell-product',
  templateUrl: './sell-product.component.html',
  styleUrls: ['./sell-product.component.css'],
})
export class SellProductComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  sellProductForm: FormGroup;
  bill: Bill;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) private product: Product,
    private productsService: ProductsService,
    public dialogRef: MatDialogRef<SellProductComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.bill = new Bill();
    this.bill.gymId = this.product.gymId;
    this.bill.productID = this.product.id;
    this.buildForm();
    this.bill.quantity = 1;
    this.bill.totalCost = this.product.price * this.bill.quantity;
  }

  private buildForm = (): void => {
    this.sellProductForm = this.formBuilder.group({
  
      quantity: ['', [Validators.required, this.nonZero, this.validateQuantity]],
      coustomerName: ['', [Validators.required, this.validateName]],
      coustomerPhone: ['', [Validators.required, this.validatePhoneNumber]],
      coustomerID: ['', [Validators.required, this.validateID]],
    });
  };

  public sellProduct = (): Promise<void> => {
    if (!AppUtil.hasValue(this.bill)) {
      AppUtil.showWarningMessage(
        `cannot sell product because there is a missing fields`
      );
      return;
    }
    this.bill.totalCost = this.product.price * this.bill.quantity;
    this.bill.productName = this.product.name;

    this.subscriptions.push(
      this.productsService.sell(this.bill).subscribe(
        (res) => {
          this.dialogRef.close();
          this.navigationHelperService.openSnackBar(
            'start',
            'bottom',
            `Product was sold successfully`
          );
        },
        (error) => {
          AppUtil.showError(error);
        }
      )
    );
  };

  public validateQuantity = (
    inputControl: AbstractControl
  ): ValidationErrors | null => {
    if (!inputControl) {
      return null;
    }

    if (!AppUtil.hasValue(inputControl.value)) {
      return null;
    }

    // if (Number(inputControl.value) === 0) {
    //   return { zeroNotValid: true };
    // }

    if (Number(inputControl.value) > this.product.quantity) {
      return { quantityNotValid: true };
    }

    return null;
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
