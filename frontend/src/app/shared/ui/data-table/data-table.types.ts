import { Directive, Input, TemplateRef } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export type SortValue = string | number | null;

export interface DataTableColumn<T> {
  /** Matches the `appCell` template that renders this column. */
  key: string;
  /** Translation key of the header. */
  labelKey: string;
  /** CSS grid track, e.g. '2.3fr' or '44px'. */
  width: string;
  /** Sortable when set; nulls sort last. */
  sortValue?: (row: T) => SortValue;
  /** Dropped when the table is narrowed next to a detail panel. */
  hideWhenNarrow?: boolean;
  /** Header text for screen readers only (e.g. the actions column). */
  headerHidden?: boolean;
  /** In the stacked (phone) layout: the card's title row, shown without a label. */
  cardTitle?: boolean;
  /** In the stacked layout: shown at the card's top end without a label (actions). */
  cardCorner?: boolean;
}

export interface CellContext<T> {
  $implicit: T;
}

/** `<ng-template appCell="phone" let-row>{{ row.phone }}</ng-template>` */
@Directive({
  selector: '[appCell]',
})
export class CellDefDirective<T> {
  @Input('appCell') key: string = '';

  constructor(public template: TemplateRef<CellContext<T>>) {}
}

export const PAGE_SIZES: readonly number[] = [10, 25, 50];

/** Sorts a copy of `rows` the way the table does (nulls last; numbers; locale-aware strings). */
export function sortRows<T>(rows: T[], columns: DataTableColumn<T>[], sort: DataTableSort | null): T[] {
  const column: DataTableColumn<T> | undefined = columns.find((c: DataTableColumn<T>) => c.key === sort?.key);
  const sorted: T[] = [...rows];
  if (column?.sortValue && sort) {
    const value = column.sortValue;
    const factor: number = sort.direction === 'asc' ? 1 : -1;
    sorted.sort((a: T, b: T) => compareValues(value(a), value(b), factor));
  }
  return sorted;
}

function compareValues(a: SortValue, b: SortValue, factor: number): number {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true }) * factor;
}
