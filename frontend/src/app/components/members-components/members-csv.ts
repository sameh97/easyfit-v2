import { Member } from 'src/app/model/member';
import { LanguageService } from 'src/app/services/language.service';
import { buildCsv, csvDate as date } from 'src/app/shared/util/csv';
import { memberStatus } from './member-status';

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
  ]);

  return buildCsv(header, rows);
}
