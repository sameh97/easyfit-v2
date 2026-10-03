import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Catalog } from 'src/app/model/catalog';
import { Product } from 'src/app/model/product';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { LanguageService } from 'src/app/services/language.service';
import { ShellActionsService } from 'src/app/services/shell-actions.service';
import { AVATAR_PALETTE } from 'src/app/shared/ui/avatar/avatar.component';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { CatalogActionsService } from '../catalog-actions.service';
import { catalogExpiresAt, catalogIsActive } from '../catalog-util';

type LoadState = 'loading' | 'ready' | 'error';

export interface CatalogRow {
  catalog: Catalog;
  active: boolean;
  thumbs: { photo: string | null; background: string; foreground: string }[];
  names: string;
}

const SKELETON_ROWS: readonly number[] = [1, 2, 3];

/**
 * Catalogs (redesign.md §5.8): temporary public product links. Three-line rows (products and
 * status · product names · validity and actions), Copy link, Share on WhatsApp, edit, delete.
 */
@Component({
  selector: 'app-catalogs-page',
  templateUrl: './catalogs-page.component.html',
})
export class CatalogsPageComponent implements OnInit, OnDestroy {
  state: LoadState = 'loading';
  rows: CatalogRow[] = [];
  readonly skeletonRows: readonly number[] = SKELETON_ROWS;
  private catalogsSubscription: Subscription | null = null;

  constructor(
    private catalogs: CatalogService,
    private actions: CatalogActionsService,
    private shellActions: ShellActionsService,
    private menu: MenuService,
    public language: LanguageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.catalogsSubscription?.unsubscribe();
    this.catalogsSubscription = this.catalogs.getAll().subscribe(
      (catalogs: Catalog[] | null) => {
        if (catalogs === null) {
          return;
        }
        this.state = 'ready';
        this.rows = catalogs
          .map((catalog: Catalog) => this.toRow(catalog))
          .sort((a: CatalogRow, b: CatalogRow) => Number(b.active) - Number(a.active) || new Date(b.catalog.createdAt).getTime() - new Date(a.catalog.createdAt).getTime());
      },
      () => (this.state = 'error')
    );
  }

  /** The list keys catalogs by uuid, which the service's cache can't update in place: reload instead. */
  private reload(): void {
    this.catalogs.getAll().pipe(take(1)).subscribe({ error: () => undefined });
  }

  private toRow(catalog: Catalog): CatalogRow {
    const products: Product[] = catalog.products ?? [];
    return {
      catalog,
      active: catalogIsActive(catalog),
      thumbs: products.slice(0, 3).map((p: Product) => {
        const pair = AVATAR_PALETTE[Math.abs(p.id) % AVATAR_PALETTE.length];
        return { photo: realPhotoUrl(p.imgUrl), background: pair[0], foreground: pair[1] };
      }),
      names: products.map((p: Product) => p.name).join(', '),
    };
  }

  get subtitle(): string {
    const active: number = this.rows.filter((row: CatalogRow) => row.active).length;
    return `${this.language.tCount('catalogs.page.count', this.rows.length)} · ${this.language.tCount('catalogs.page.active', active)}`;
  }

  productsLabel(row: CatalogRow): string {
    return this.language.tCount('catalogs.row.products', (row.catalog.products ?? []).length);
  }

  /** "Valid for 7 days · until Mon, 5 Oct" or "Expired Mon, 28 Sep". */
  validity(row: CatalogRow): string {
    const until: string = this.language.date(catalogExpiresAt(row.catalog), 'shortDay');
    return row.active
      ? `${this.language.tCount('catalogs.row.validFor', Number(row.catalog.durationDays))} · ${this.language.t('catalogs.row.until', { date: until })}`
      : this.language.t('catalogs.row.expiredOn', { date: until });
  }

  created(row: CatalogRow): string {
    return this.language.t('catalogs.row.created', { date: this.language.date(row.catalog.createdAt, 'shortDay') });
  }

  add(): void {
    this.shellActions.addCatalog().subscribe((saved: Catalog | undefined) => {
      if (saved) {
        this.reload();
        this.share(saved);
      }
    });
  }

  share(catalog: Catalog): void {
    this.shellActions.shareCatalog(catalog).subscribe();
  }

  copyLink(catalog: Catalog): void {
    this.actions.copyLink(catalog);
  }

  edit(catalog: Catalog): void {
    this.shellActions.editCatalog(catalog).subscribe((saved: Catalog | undefined) => saved && this.reload());
  }

  openMoreMenu(event: Event, catalog: Catalog): void {
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('common.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.delete(catalog).subscribe((done: boolean) => done && this.reload());
      }
    });
  }

  trackByUuid(_index: number, row: CatalogRow): string {
    return row.catalog.uuid;
  }

  ngOnDestroy(): void {
    this.catalogsSubscription?.unsubscribe();
  }
}
