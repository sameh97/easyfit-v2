import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Product } from 'src/app/model/product';
import { FileUploadService } from 'src/app/services/file-upload-service/file-upload.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
})
export class AddProductComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addProductForm: FormGroup;
  product: Product;
  private subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private productsService: ProductsService,
    public dialogRef: MatDialogRef<AddProductComponent>,
    private fileUploadService: FileUploadService,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.product = new Product();
    this.addProductForm = this.formBuilder.group({
  

      name: ['', [Validators.required, this.validateProductName]],
      price: ['', [Validators.required, Validators.min(0), this.validatePrice]],
      description: ['', [Validators.required]],
      code: ['', [Validators.required, this.validateProductCode]],
      quantity: ['', [Validators.compose([Validators.required, this.nonZero])]],
      imgUrl: ['', []],
      categoryID: ['', [Validators.required]],
    });
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.product)) {
      AppUtil.showWarningMessage(
        `cannot create product because there is a missing fields`
      );
      return;
    }

    if (AppUtil.hasValue(this.imageToUpload)) {
      this.subscriptions.push(
        this.fileUploadService
          .uploadImage(this.imageToUpload, null)
          .pipe(
            switchMap((imgUrl) => {
              this.uploadedImageUrl = imgUrl;
              this.product.imgUrl = imgUrl;
              return this.productsService.create(this.product);
            })
          )
          .subscribe(
            (product) => {
              this.dialogRef.close();
              this.navigationHelperService.openSnackBar(
                'start',
                'bottom',
                `Product was added successfully`
              );
            },
            (err: Error) => {
              AppUtil.showError(err);
            }
          )
      );
    } else {
      this.product.imgUrl = AppConsts.PRODUCT_DEFULT_IMAGE;

      this.subscriptions.push(
        this.productsService.create(this.product).subscribe(
          (product) => {
            this.dialogRef.close();
            this.navigationHelperService.openSnackBar(
              'start',
              'bottom',
              `Product was added successfully`
            );
          },
          (err: Error) => {
            AppUtil.showError(err);
          }
        )
      );
    }
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
