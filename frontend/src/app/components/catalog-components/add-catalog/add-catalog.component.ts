import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatListOption } from '@angular/material/list';
import { Subscription } from 'rxjs';
import { AppUtil } from 'src/app/common/app-util';
import { Catalog } from 'src/app/model/catalog';
import { Product } from 'src/app/model/product';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { FormInputComponent } from 'src/app/shared/components/form-input/form-input.component';
import { MatDialogRef } from '@angular/material/dialog';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';

@Component({
  selector: 'app-add-catalog',
  templateUrl: './add-catalog.component.html',
  styleUrls: ['./add-catalog.component.css'],
})
export class AddCatalogComponent
  extends FormInputComponent
  implements OnInit, OnDestroy
{
  addCatalogForm: FormGroup;
  catalog: Catalog;
  allProducts: Product[];
  private subscriptions: Subscription[] = [];

  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};

  constructor(
    private formBuilder: FormBuilder,
    private catalogService: CatalogService,
    private productsService: ProductsService,
    public dialogRef: MatDialogRef<AddCatalogComponent>,
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

    this.catalog = new Catalog();
    this.addCatalogForm = this.formBuilder.group({
      
      durationDays: [
        '',
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      products: ['', [Validators.required]],
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }

  onItemSelect(item: any) {
    for (let product of this.allProducts) {
      if (item.item_id === product.id) {
        this.catalog.products.push(product);
      }
    }
  }

  onSelectAll(items: any) {
    this.catalog.products = this.allProducts;
  }

  onItemDeSelect(item: any) {
    for (let i = 0; i < this.catalog.products.length; i++) {
      if (item.item_id === this.catalog.products[i].id) {
        this.catalog.products.splice(i, 1);
        break;
      }
    }
  }

  onDeSelectAll(items: any) {
    this.catalog.products = [];
  }

  public create = (): Promise<void> => {
    if (!AppUtil.hasValue(this.catalog)) {
      AppUtil.showWarningMessage(
        `cannot create catalog because there is a missing fields`
      );
      return;
    }

    this.catalog.isActive = true;
    // this.catalog.products = this.selectedItems;
    this.dropdownList;

    this.subscriptions.push(
      this.catalogService.create(this.catalog).subscribe(
        () => {
          this.dialogRef.close();
          this.navigationHelperService.openSnackBar(
            'start',
            'bottom',
            `Catalog was created successfully`
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
