import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppUtil } from 'src/app/common/app-util';
import { AppConsts } from 'src/app/common/consts';
import { Catalog } from 'src/app/model/catalog';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { NavigationHelperService } from 'src/app/shared/services/navigation-helper.service';
import { AddCatalogComponent } from '../add-catalog/add-catalog.component';
import { SendCatalogComponent } from '../send-catalog/send-catalog.component';
import { UpdateCatalogComponent } from '../update-catalog/update-catalog.component';

@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.css'],
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Catalog>;
  dataSource: MatTableDataSource<Catalog> = new MatTableDataSource<Catalog>();

  private subscriptions: Subscription[] = [];
  catalogs: Catalog[];

  columns: string[] = [
    'link',
    'durationDays',
    'creationTime',
    'sendOnWhatsApp',
    'update',
    'delete',
  ];

  constructor(
    private navigationService: NavigationHelperService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.getAll();
  }

  private getAll = (): void => {
    this.subscriptions.push(
      this.catalogService.getAll().subscribe((catalogs) => {
        this.catalogs = catalogs;
        this.dataSource = new MatTableDataSource<Catalog>(this.catalogs);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      })
    );
  };

  public openSendCatalogDialog(catalog: Catalog) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(SendCatalogComponent, null, catalog, true)
        .subscribe()
    );
  }

  public displayLink(uuid: string): string {
    return `${AppConsts.BASE_URL}/api/catalog-url/${uuid}`;
  }

  public openCreateCatalogDialog() {
    this.subscriptions.push(
      this.navigationService
        .openDialog(AddCatalogComponent, null, null, true)
        .subscribe()
    );
  }

  public delete = (catalog: Catalog) => {
    //TODO: make the message show the machine's details:
    const message = `Are you sure you want to delete the link with uuid:
    ${catalog.uuid}?`;

    this.navigationService
      .openYesNoDialogNoCallback(message, 500)
      .subscribe((res) => {
        if (res) {
          this.catalogService.delete(catalog.uuid).subscribe(
            (res) => {
              this.catalogs = [...this.catalogs];
            },
            (err) => {
              AppUtil.showError(err);
            }
          );
        }
      });
  };

  public openUpdateCatalogDialog(catalog: Catalog) {
    this.subscriptions.push(
      this.navigationService
        .openDialog(UpdateCatalogComponent, null, catalog, true)
        .subscribe()
    );
  }

  ngOnDestroy(): void {
    AppUtil.releaseSubscriptions(this.subscriptions);
  }
}
