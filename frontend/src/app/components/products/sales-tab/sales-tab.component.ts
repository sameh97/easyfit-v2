import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { formatMoney } from 'src/app/common/money';
import { Bill } from 'src/app/model/bill';
import { LanguageService } from 'src/app/services/language.service';
import { DataTableColumn, DataTableSort, sortRows } from 'src/app/shared/ui/data-table/data-table.types';
import { MenuItem } from 'src/app/shared/ui/menu/menu.component';
import { MenuService } from 'src/app/shared/ui/menu/menu.service';
import { toIsoDate } from 'src/app/shared/ui/form/field';
import { buildCsv, csvDate, downloadCsv } from 'src/app/shared/util/csv';
import { ProductActionsService } from '../product-actions.service';
import { SalesState } from '../product-detail/product-detail.component';

export type SalesRange = 'month' | 'lastMonth' | 'year' | 'all';

export const SALES_RANGES: readonly SalesRange[] = ['month', 'lastMonth', 'year', 'all'];

/** [from, to) of a range in local time; null bounds = open. */
function rangeBounds(range: SalesRange, now: Date): [Date | null, Date | null] {
  const y: number = now.getFullYear();
  const m: number = now.getMonth();
  switch (range) {
    case 'month':
      return [new Date(y, m, 1), new Date(y, m + 1, 1)];
    case 'lastMonth':
      return [new Date(y, m - 1, 1), new Date(y, m, 1)];
    case 'year':
      return [new Date(y, 0, 1), new Date(y + 1, 0, 1)];
    default:
      return [null, null];
  }
}

/**
 * Sales tab (§5.7): the bills in a DataTable with a date range (This month / Last month /
 * This year / All), revenue, items and sales of the filtered rows, search by customer, phone or
 * product, CSV export, and Delete sale (stock goes back).
 */
@Component({
  selector: 'app-sales-tab',
  templateUrl: './sales-tab.component.html',
})
export class SalesTabComponent implements OnChanges {
  @Input() bills: Bill[] = [];
  @Input() state: SalesState = 'loading';
  /** Prefills the search (e.g. "All sales" from a product). */
  @Input() query: string = '';
  @Output() queryChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() retry: EventEmitter<void> = new EventEmitter<void>();

  range: SalesRange = 'month';
  readonly ranges: readonly SalesRange[] = SALES_RANGES;
  filtered: Bill[] = [];
  sort: DataTableSort = { key: 'date', direction: 'desc' };
  columns: DataTableColumn<Bill>[] = [
    { key: 'date', labelKey: 'sales.table.date', width: '1.1fr', sortValue: (b: Bill) => new Date(b.createdAt ?? 0).getTime(), cardTitle: true },
    { key: 'product', labelKey: 'sales.table.product', width: '1.5fr', sortValue: (b: Bill) => b.productName },
    { key: 'customer', labelKey: 'sales.table.customer', width: '1.5fr', sortValue: (b: Bill) => b.coustomerName },
    { key: 'qty', labelKey: 'sales.table.qty', width: '0.5fr', sortValue: (b: Bill) => Number(b.quantity) },
    { key: 'total', labelKey: 'sales.table.total', width: '0.7fr', sortValue: (b: Bill) => Number(b.totalCost) },
    { key: 'more', labelKey: 'common.actions.moreActions', width: '36px', headerHidden: true, cardCorner: true },
  ];

  readonly rowId = (bill: Bill): number => bill.id;
  readonly rowLabel = (bill: Bill): string => `${bill.productName} · ${bill.coustomerName}`;

  constructor(private actions: ProductActionsService, private menu: MenuService, public language: LanguageService) {}

  ngOnChanges(): void {
    this.refilter();
  }

  setRange(range: SalesRange): void {
    this.range = range;
    this.refilter();
  }

  onSearch(value: string): void {
    this.query = value;
    this.queryChange.emit(value);
    this.refilter();
  }

  private refilter(): void {
    const [from, to] = rangeBounds(this.range, new Date());
    const q: string = this.query.trim().toLowerCase();
    const digits: string = q.replace(/\D/g, '');
    this.filtered = this.bills.filter((bill: Bill) => {
      const at: number = new Date(bill.createdAt ?? 0).getTime();
      if ((from && at < from.getTime()) || (to && at >= to.getTime())) {
        return false;
      }
      return (
        !q ||
        (bill.coustomerName ?? '').toLowerCase().includes(q) ||
        (bill.productName ?? '').toLowerCase().includes(q) ||
        (digits.length >= 3 && (bill.coustomerPhone ?? '').replace(/\D/g, '').includes(digits))
      );
    });
  }

  get revenue(): string {
    return formatMoney(this.filtered.reduce((sum: number, bill: Bill) => sum + (Number(bill.totalCost) || 0), 0));
  }

  get items(): number {
    return this.filtered.reduce((sum: number, bill: Bill) => sum + (Number(bill.quantity) || 0), 0);
  }

  /** "Revenue · September" · "Revenue · 2026" · "Revenue · all time" */
  get revenueLabel(): string {
    const now: Date = new Date();
    const period: string =
      this.range === 'month'
        ? this.language.date(now, 'monthLong')
        : this.range === 'lastMonth'
        ? this.language.date(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'monthLong')
        : this.range === 'year'
        ? String(now.getFullYear())
        : this.language.t('sales.allTime');
    return this.language.t('sales.revenue', { period });
  }

  money(value: number): string {
    return formatMoney(value);
  }

  export(): void {
    const rows = sortRows(this.filtered, this.columns, this.sort).map((bill: Bill) => [
      csvDate(bill.createdAt),
      this.language.date(bill.createdAt ?? 0, 'time'),
      bill.productName,
      bill.quantity,
      bill.totalCost,
      bill.coustomerName,
      bill.coustomerPhone,
      bill.coustomerID,
    ]);
    const header: string[] = ['sales.table.date', 'sales.csv.time', 'sales.table.product', 'sales.table.qty', 'sales.table.total', 'sales.form.name', 'sales.form.phone', 'sales.form.idNumber'].map(
      (key: string) => this.language.t(key)
    );
    downloadCsv(buildCsv(header, rows), `sales-${toIsoDate(new Date())}.csv`);
  }

  openMoreMenu(event: Event, bill: Bill): void {
    event.stopPropagation();
    const trigger: HTMLElement = event.currentTarget as HTMLElement;
    const items: MenuItem[] = [{ id: 'delete', label: this.language.t('sales.actions.delete'), icon: 'trash', tone: 'danger' }];
    this.menu.open(trigger, items, this.language.t('common.actions.moreActions')).subscribe((id: string | null) => {
      if (id === 'delete') {
        this.actions.deleteSale(bill).subscribe();
      }
    });
  }
}
