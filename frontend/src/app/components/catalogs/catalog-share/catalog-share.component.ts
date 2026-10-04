import { Component, Inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Catalog } from 'src/app/model/catalog';
import { Member } from 'src/app/model/member';
import { LanguageService } from 'src/app/services/language.service';
import { MembersService } from 'src/app/services/members-service/members.service';
import { realPhotoUrl } from 'src/app/shared/ui/avatar/photo';
import { SidePanelRef, SIDE_PANEL_DATA } from 'src/app/shared/ui/overlay/side-panel-ref';
import { fullName } from '../../members-components/member-status';
import { CatalogActionsService } from '../catalog-actions.service';
import { catalogExpiresAt, catalogUrl, messageWithLink, whatsappLink, whatsappNumber } from '../catalog-util';

export interface CatalogShareData {
  catalog: Catalog;
}

interface ShareRow {
  member: Member;
  name: string;
  photo: string | null;
  number: string;
}

/** Members shown before "Show more". */
const PAGE: number = 30;

/**
 * Share catalog (§5.8): the link with Copy, an editable message ({link} marks where the link goes)
 * with Copy message, and a member list where each row opens WhatsApp (wa.me) with the message
 * filled in for that member. Replaces the server-side `wbm` sending.
 */
@Component({
  selector: 'app-catalog-share',
  templateUrl: './catalog-share.component.html',
  styles: [':host { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }'],
})
export class CatalogShareComponent implements OnDestroy {
  readonly catalog: Catalog;
  readonly link: string;
  readonly message: FormControl;
  query: string = '';
  limit: number = PAGE;
  opened = new Set<number>();
  loading: boolean = true;
  private rows: ShareRow[] = [];
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(SIDE_PANEL_DATA) data: CatalogShareData,
    public ref: SidePanelRef<void>,
    private members: MembersService,
    private actions: CatalogActionsService,
    public language: LanguageService
  ) {
    this.catalog = data.catalog;
    this.link = catalogUrl(this.catalog);
    const names: string = (this.catalog.products ?? []).map((p) => p.name).join(', ');
    this.message = new FormControl(this.language.t('catalogs.share.defaultMessage', { products: names }));
    this.subscriptions.push(
      this.members.getAll().subscribe((members: Member[] | null) => {
        if (!members) {
          return;
        }
        this.loading = false;
        this.rows = members
          .filter((m: Member) => m.isActive)
          .map((m: Member) => ({ member: m, name: fullName(m), photo: realPhotoUrl(m.imageURL), number: whatsappNumber(m.phone) ?? '' }))
          .filter((row: ShareRow) => row.number !== '')
          .sort((a: ShareRow, b: ShareRow) => a.name.localeCompare(b.name));
      })
    );
  }

  get subtitle(): string {
    const count: string = this.language.tCount('catalogs.row.products', (this.catalog.products ?? []).length);
    return `${count} · ${this.language.t('catalogs.share.validUntil', { date: this.language.date(catalogExpiresAt(this.catalog), 'shortDay') })}`;
  }

  get text(): string {
    return messageWithLink(String(this.message.value ?? ''), this.link);
  }

  get filtered(): ShareRow[] {
    const q: string = this.query.trim().toLowerCase();
    const digits: string = q.replace(/\D/g, '');
    return this.rows.filter((row: ShareRow) => !q || row.name.toLowerCase().includes(q) || (digits.length >= 3 && row.number.includes(digits)));
  }

  get visible(): ShareRow[] {
    return this.filtered.slice(0, this.limit);
  }

  href(row: ShareRow): string {
    return whatsappLink(row.number, this.text);
  }

  markOpened(row: ShareRow): void {
    this.opened.add(row.member.id);
  }

  copyLink(): void {
    this.actions.copyLink(this.catalog);
  }

  copyMessage(): void {
    this.actions.copy(this.text, 'catalogs.toast.messageCopied');
  }

  /** Nothing to lose: the message isn't saved anywhere. */
  isDirty(): boolean {
    return false;
  }

  trackById(_index: number, row: ShareRow): number {
    return row.member.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
