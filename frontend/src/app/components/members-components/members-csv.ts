import { Member } from 'src/app/model/member';
import { LanguageService } from 'src/app/services/language.service';
import { fromApiDate, toIsoDate } from 'src/app/shared/ui/form/field';
import { memberStatus } from './member-status';

/** Values that spreadsheet apps would run as formulas get a leading apostrophe. */
function cell(value: string | number | null | undefined): string {
  let text: string = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function date(value: Date | string | null | undefined): string {
  return toIsoDate(fromApiDate(value)) ?? '';
}

/**
 * CSV of the members shown (current filters and sort), built in the browser (§5.2).
 * Headers in the UI language; UTF-8 with a BOM so Excel shows Hebrew correctly; dates as YYYY-MM-DD.
 */
export function membersCsv(members: Member[], language: LanguageService): string {
  const header: string[] = [
    'members.form.firstName',
    'members.form.lastName',
    'members.form.phone',
    'members.form.email',
    'members.table.status',
    'members.table.ends',
    'members.table.joined',
    'members.form.gender',
    'members.form.birthday',
    'members.form.address',
  ].map((key: string) => language.t(key));

  const rows: string[][] = members.map((member: Member) => [
    member.firstName,
    member.lastName,
    member.phone,
    member.email,
    language.t(`common.status.${memberStatus(member)}`),
    date(member.endOfMembershipDate),
    date(member.joinDate),
    Number(member.gender) === 2 ? language.t('common.gender.female') : Number(member.gender) === 1 ? language.t('common.gender.male') : '',
    date(member.birthDay),
    member.address,
  ].map(cell));

  return '﻿' + [header.map(cell), ...rows].map((row: string[]) => row.join(',')).join('\r\n') + '\r\n';
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
