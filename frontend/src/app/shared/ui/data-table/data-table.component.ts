import {
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import {
  CellContext,
  CellDefDirective,
  DataTableColumn,
  DataTableSort,
  PAGE_SIZES,
  sortRows,
} from './data-table.types';

export type DataTableState = 'loading' | 'error' | 'ready';

const SKELETON_ROWS: readonly number[] = [1, 2, 3, 4, 5, 6];

/**
 * Shared Studio table (§7.4): typed columns, client-side sort and pagination (10/25/50),
 * row click + selected row, skeleton rows, empty and error states, and stacked cards below md.
 * Empty content is projected with `[tableEmpty]`; cells with `<ng-template appCell="key" let-row>`.
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styles: [':host { display: block; min-width: 0; }'],
})
export class DataTableComponent<T> implements OnInit, OnChanges, OnDestroy {
  @Input() rows: T[] = [];
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() state: DataTableState = 'ready';
  @Input() rowId: (row: T) => number | string = () => 0;
  /** Accessible name of each row, e.g. the member's name. */
  @Input() rowLabel: (row: T) => string = () => '';
  /** Extra classes for a row (e.g. the amber "expiring" tint). Ignored on the selected row. */
  @Input() rowClass: (row: T) => string = () => '';
  @Input() selectedId: number | string | null = null;
  /** Fewer columns while a detail panel is open next to the table. */
  @Input() narrow: boolean = false;
  @Input() sort: DataTableSort | null = null;
  /** Accessible name of the table. */
  @Input() label: string = '';
  /** Any change (filter, search…) sends the table back to page 1. */
  @Input() resetPageOn: unknown = null;

  @Output() rowClick: EventEmitter<T> = new EventEmitter<T>();
  @Output() sortChange: EventEmitter<DataTableSort> = new EventEmitter<DataTableSort>();
  @Output() retry: EventEmitter<void> = new EventEmitter<void>();

  @ContentChildren(CellDefDirective) private cellDefs!: QueryList<CellDefDirective<T>>;

  readonly pageSizes: readonly number[] = PAGE_SIZES;
  readonly skeletonRows: readonly number[] = SKELETON_ROWS;
  pageSize: number = PAGE_SIZES[0];
  page: number = 0;
  stacked: boolean = false;

  visibleColumns: DataTableColumn<T>[] = [];
  pageRows: T[] = [];
  private sortedRows: T[] = [];
  private subscription: Subscription | null = null;

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.subscription = this.breakpointObserver.observe('(min-width: 768px)').subscribe(() => {
      this.stacked = !this.breakpointObserver.isMatched('(min-width: 768px)');
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resetPageOn && !changes.resetPageOn.firstChange) {
      this.page = 0;
    }
    this.visibleColumns = this.columns.filter((column: DataTableColumn<T>) => !(this.narrow && column.hideWhenNarrow));
    this.applySort();
  }

  // ---- Sorting -----------------------------------------------------------

  isSortable(column: DataTableColumn<T>): boolean {
    return !!column.sortValue;
  }

  ariaSort(column: DataTableColumn<T>): string | null {
    if (!this.isSortable(column)) {
      return null;
    }
    if (this.sort?.key !== column.key) {
      return 'none';
    }
    return this.sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  toggleSort(column: DataTableColumn<T>): void {
    const direction = this.sort?.key === column.key && this.sort.direction === 'asc' ? 'desc' : 'asc';
    this.sort = { key: column.key, direction };
    this.sortChange.emit(this.sort);
    this.page = 0;
    this.applySort();
  }

  private applySort(): void {
    this.sortedRows = sortRows(this.rows, this.columns, this.sort);
    this.clampPage();
    this.slicePage();
  }

  // ---- Paging ------------------------------------------------------------

  get total(): number {
    return this.sortedRows.length;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get from(): number {
    return this.total ? this.page * this.pageSize + 1 : 0;
  }

  get to(): number {
    return Math.min(this.total, (this.page + 1) * this.pageSize);
  }

  /** Up to five page numbers around the current one. */
  get pageNumbers(): number[] {
    const count: number = Math.min(5, this.pageCount);
    const start: number = Math.min(Math.max(0, this.page - 2), this.pageCount - count);
    return Array.from({ length: count }, (_value: unknown, index: number) => start + index);
  }

  goTo(page: number): void {
    this.page = Math.min(Math.max(0, page), this.pageCount - 1);
    this.slicePage();
  }

  setPageSize(value: string): void {
    this.pageSize = Number(value) || PAGE_SIZES[0];
    this.page = 0;
    this.slicePage();
  }

  private clampPage(): void {
    this.page = Math.min(this.page, this.pageCount - 1);
  }

  private slicePage(): void {
    this.pageRows = this.sortedRows.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);
  }

  // ---- Rendering -----------------------------------------------------------

  get gridColumns(): string {
    return this.visibleColumns.map((column: DataTableColumn<T>) => column.width).join(' ');
  }

  cellTemplate(key: string): TemplateRef<CellContext<T>> | null {
    return this.cellDefs?.find((def: CellDefDirective<T>) => def.key === key)?.template ?? null;
  }

  get cardTitleColumns(): DataTableColumn<T>[] {
    return this.visibleColumns.filter((column: DataTableColumn<T>) => column.cardTitle);
  }

  get cardCornerColumns(): DataTableColumn<T>[] {
    return this.visibleColumns.filter((column: DataTableColumn<T>) => column.cardCorner);
  }

  get cardDetailColumns(): DataTableColumn<T>[] {
    return this.visibleColumns.filter((column: DataTableColumn<T>) => !column.cardTitle && !column.cardCorner);
  }

  isSelected(row: T): boolean {
    return this.selectedId !== null && this.rowId(row) === this.selectedId;
  }

  rowClasses(row: T): string {
    return this.isSelected(row) ? 'bg-accent-soft' : `${this.rowClass(row)} hover:bg-surface-subtle`;
  }

  onRowKeydown(event: KeyboardEvent, row: T): void {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  trackRow = (_index: number, row: T): number | string => this.rowId(row);

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
