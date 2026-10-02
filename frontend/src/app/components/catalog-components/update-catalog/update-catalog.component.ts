import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Catalog } from 'src/app/model/catalog';
import { Product } from 'src/app/model/product';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-update-catalog',
  templateUrl: './update-catalog.component.html',
  styleUrls: ['./update-catalog.component.css'],
})
export class UpdateCatalogComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  updateCatalogForm: FormGroup;
  private subscriptions: Subscription[] = [];

  allProducts: Product[];
  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    @Inject(MAT_DIALOG_DATA) private catalog: Catalog,
    private productsService: ProductsService,
    public dialogRef: MatDialogRef<UpdateCatalogComponent>,
    private navigationHelperService: NavigationHelperService
  ) {
    super();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.productsService.getAll().subscribe((products) => {
        this.allProducts = products;

        for (let product of this.allProducts) {
          const item: any = {
            item_id: product.id,
            item_text: product.name,
          };
          this.dropdownList.push(item);
        }

        this.dropdownList = [...this.dropdownList];
      })
    );

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };

    this.catalog.products.forEach((product) => {
      const item: any = {
        item_id: product.id,
        item_text: product.name,
      };

      this.selectedItems.push(item);
    });

    this.dropdownList = [...this.dropdownList];

    this.buildForm();
  }

  private buildForm = (): void => {
    this.updateCatalogForm = this.formBuilder.group({
      
      durationDays: [
        this.catalog.durationDays,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      products: [this.catalog.products, [Validators.required]],
    });
  };

  onItemSelect(item: any) {
    for (let product of this.allProducts) {
      if (item.item_id === product.id) {
        this.catalog.products.push(product);
      }
    }
  }

  onItemDeSelect(item: any) {
    for (let i = 0; i < this.catalog.products.length; i++) {
      if (item.item_id === this.catalog.products[i].id) {
        this.catalog.products.splice(i, 1);
        break;
      }
    }
  }

  onSelectAll(items: any) {
    this.catalog.products = this.allProducts;
  }

  onDeSelectAll(items: any) {
    this.catalog.products = [];
  }

  public update = (): Promise<void> => {
    if (!AppUtil.hasValue(this.catalog)) {
      AppUtil.showWarningMessage(
        `cannot update catalog because there is a missing fields`
      );
      return;
    }

    this.subscriptions.push(
      this.catalogService.update(this.catalog).subscribe(
        (catalog) => {
          this.dialogRef.close();
          this.navigationHelperService.openSnackBar(
            'start',
            'bottom',
            `Catalog was updated successfully`
          );
        },
        (err: Error) => {
          AppUtil.showError(err);
        }
      )
    );
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
