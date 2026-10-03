import { fromApiDate, toIsoDate } from 'src/app/shared/ui/form/field';

/** One CSV cell. Values that spreadsheet apps would run as formulas get a leading apostrophe. */
export function csvCell(value: string | number | null | undefined): string {
  let text: string = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A date cell as YYYY-MM-DD. */
export function csvDate(value: Date | string | null | undefined): string {
  return toIsoDate(fromApiDate(value)) ?? '';
}

/** UTF-8 with a BOM (Excel then shows Hebrew correctly), CRLF line ends. */
export function buildCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  return '﻿' + [header, ...rows].map((row: (string | number | null | undefined)[]) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadCsv(csv: string, fileName: string): void {
  const url: string = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link: HTMLAnchorElement = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
