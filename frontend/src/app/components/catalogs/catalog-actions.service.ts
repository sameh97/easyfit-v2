import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Catalog } from 'src/app/model/catalog';
import { CatalogService } from 'src/app/services/catalog-service/catalog.service';
import { LanguageService } from 'src/app/services/language.service';
import { ConfirmDialogService } from 'src/app/shared/ui/overlay/confirm-dialog.service';
import { ToastService } from 'src/app/shared/ui/overlay/toast.service';
import { catalogUrl } from './catalog-util';

/** Delete (confirm + toasts) and Copy for catalogs, through the existing endpoints. */
@Injectable({
  providedIn: 'root',
})
export class CatalogActionsService {
  constructor(
    private catalogs: CatalogService,
    private toast: ToastService,
    private confirmDialog: ConfirmDialogService,
    private language: LanguageService
  ) {}

  /** Emits true when the catalog was deleted. */
  delete(catalog: Catalog): Observable<boolean> {
    const count: number = (catalog.products ?? []).length;
    return this.confirmDialog
      .confirm({
        title: this.language.t('catalogs.confirm.deleteTitle'),
        message: this.language.tCount('catalogs.confirm.deleteBody', count),
        confirmLabel: this.language.t('common.actions.delete'),
        tone: 'danger',
      })
      .pipe(
        switchMap((ok: boolean) => {
          if (!ok) {
            return of(false);
          }
          return this.catalogs.delete(catalog.uuid).pipe(
            map(() => {
              this.toast.success(this.language.t('catalogs.toast.deleted'));
              return true;
            }),
            catchError(() => {
              this.toast.error(this.language.t('catalogs.toast.deleteError'));
              return of(false);
            })
          );
        })
      );
  }

  copyLink(catalog: Catalog): void {
    this.copy(catalogUrl(catalog), 'catalogs.toast.linkCopied');
  }

  /** Clipboard writes must happen in the click handler; some browsers refuse them. */
  copy(text: string, successKey: string): void {
    const fail = (): void => {
      this.toast.error(this.language.t('catalogs.toast.copyError'));
    };
    if (!navigator.clipboard) {
      fail();
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success(this.language.t(successKey));
    }, fail);
  }
}
