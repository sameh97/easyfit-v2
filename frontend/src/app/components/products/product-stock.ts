import { Bill } from 'src/app/model/bill';
import { Product } from 'src/app/model/product';
import { LanguageService } from 'src/app/services/language.service';

/** The dashboard's low-stock rule (§5.1): ≤ 5 is low, ≤ 2 critical, 0 out of stock. */
export const LOW_STOCK_MAX: number = 5;
export const CRITICAL_STOCK_MAX: number = 2;

export type StockState = 'ok' | 'low' | 'critical' | 'out';

export function stockState(quantity: number): StockState {
  const q: number = Number(quantity) || 0;
  if (q <= 0) {
    return 'out';
  }
  if (q <= CRITICAL_STOCK_MAX) {
    return 'critical';
  }
  return q <= LOW_STOCK_MAX ? 'low' : 'ok';
}

/** "12 in stock" · "4 left" · "Out of stock" */
export function stockLabel(quantity: number, language: LanguageService): string {
  const state: StockState = stockState(quantity);
  if (state === 'out') {
    return language.t('products.stock.out');
  }
  return language.tCount(state === 'ok' ? 'products.stock.inStock' : 'products.stock.left', Number(quantity));
}

/** Pill classes per stock state (neutral / warning / danger). */
export const STOCK_PILL: Record<StockState, string> = {
  ok: 'bg-neutral-bg text-neutral',
  low: 'bg-warning-bg text-warning',
  critical: 'bg-danger-bg text-danger-text',
  out: 'bg-danger-bg text-danger-text',
};

/** Sales of one product, newest first. */
export function salesOf(bills: Bill[], productId: number): Bill[] {
  return bills
    .filter((bill: Bill) => bill.productID === productId)
    .sort((a: Bill, b: Bill) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

