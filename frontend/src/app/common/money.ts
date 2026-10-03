/** ₪48,250 in both languages (redesign.md §7.8): Western digits, up to two decimals. */
export function formatMoney(value: number | string | null | undefined): string {
  const amount: number = Number(value) || 0;
  return `₪${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
