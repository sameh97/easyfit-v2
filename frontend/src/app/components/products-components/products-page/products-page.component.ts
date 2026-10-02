import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppUtil } from 'src/app/common/app-util';
import { Product } from 'src/app/model/product';
import { Subscription } from 'rxjs';
import { ProductsService } from 'src/app/services/products-service/products.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AddProductComponent } from '../add-product/add-product.component';
import { tap } from 'rxjs/operators';
import { UpdateProductPageComponent } from '../update-product-page/update-product-page.component';
import { SellProductComponent } from '../sell-product/sell-product.component';
import { Bill } from 'src/app/model/bill';

@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css'],
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[];
  bills: Bill[];
  filteredBills: Bill[];
  private subscriptions: Subscription[] = [];

  constructor(
    private productsService: ProductsService,
    private navigationService: NavigationHelperService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.productsService.getAll().subscribe((products) => {
        this.products = products;
        this.assignCopyOfProducts();
      })
    );

    this.subscriptions.push(
      this.productsService.getAllBills().subscribe((bills) => {
        this.bills = bills;
        this.assignCopy();
      })
    );
  }

  isProductsEmpty() {
    if (!this.filteredProducts) {
      return true;
    }
    return this.filteredProducts.length === 0;
  }

  isBillsEmpty() {
    if (!this.filteredBills) {
      return true;
    }
    return this.filteredBills.length === 0;
  }

  assignCopy() {
    this.filteredBills = Object.assign([], this.bills);
  }

  filterItem(value) {
    if (!value) {
      this.assignCopy();
    } // when nothing has typed
    this.filteredBills = Object.assign([], this.bills).filter(
      (item) =>
        item.coustomerName.toLowerCase().indexOf(value.toLowerCase()) > -1
    );
  }

  assignCopyOfProducts() {
    this.filteredProducts = Object.assign([], this.products);
  }

  filterProducts(value) {
    if (!value) {
      this.assignCopyOfProducts();
    } // when nothing has typed
    this.filteredProducts = Object.assign([], this.products).filter(
      (item) => item.code.toLowerCase().indexOf(value.toLowerCase()) > -1
    );
  }

  public getCategory(categoryID: any) {
    if (categoryID === 1) {
      return 'protein';
    } else if (categoryID === 2) {
      return 'BCAA';
    } else if (categoryID === 3) {
      return 'Glutamine';
    } else if (categoryID === 4) {
      return 'Creatine';
    } else if (categoryID === 5) {
      return 'Clothes';
    }
    //TODO: make more categores
  }

  public getProductName(productId: number): string {
    const product: Product = this.products.find(({ id }) => id === productId);

    return product.name;
  }

  public openUpdateProductDialog(product: Product) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateProductPageComponent, null, product, true)
        .subscribe()
    );
  }

  public openSellProductDialog(product: Product) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(SellProductComponent, null, product, true)
        .subscribe()
    );
  }

  public openCreateProductDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddProductComponent, null, null, true)
        .subscribe()
    );
  }

  public deleteBill = (bill: Bill) => {
    const message = `Are you sure you want to delete bill for coustomer:
    ${bill.coustomerName}?

   This may affect the income data`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.productsService.deleteBill(bill.id).subscribe(
            (res) => {
              console.log(res);
            },
            (err) => {
              AppUtil.showError(err);
            }
          );
        }
      });
  };

  public delete = (product: Product) => {
    const message = `Are you sure you want to delete the product with the name:
    ${product.name}?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.productsService.delete(product.id).subscribe(
            (res) => {
              console.log(res);
            },
            (err) => {
              AppUtil.showError(err);
            }
          );
        }
      });
  };

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
