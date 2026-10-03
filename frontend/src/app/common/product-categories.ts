/** Product categories are hard-coded in the app (see redesign.md §5.7). */
export const PRODUCT_CATEGORY_LABELS: Readonly<Record<number, string>> = {
  1: 'Protein',
  2: 'BCAA',
  3: 'Glutamine',
  4: 'Creatine',
  5: 'Clothes',
};

export function productCategoryLabel(categoryID: number): string {
  return PRODUCT_CATEGORY_LABELS[categoryID] ?? 'Other';
}

/** Translation keys (common.productCategory.*) for Studio pages. */
const PRODUCT_CATEGORY_KEYS: Readonly<Record<number, string>> = {
  1: 'common.productCategory.protein',
  2: 'common.productCategory.bcaa',
  3: 'common.productCategory.glutamine',
  4: 'common.productCategory.creatine',
  5: 'common.productCategory.clothes',
};

export function productCategoryKey(categoryID: number): string {
  return PRODUCT_CATEGORY_KEYS[categoryID] ?? 'common.productCategory.other';
}
