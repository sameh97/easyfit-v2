import { Member } from 'src/app/model/member';
import { fromApiDate } from 'src/app/shared/ui/form/field';
import { PillStatus } from 'src/app/shared/ui/status-pill/status-pill.component';

/** Derived on the client from isActive + endOfMembershipDate (redesign.md §5.2). */
export type MemberStatus = 'active' | 'expiring' | 'expired' | 'inactive';

export const MEMBER_STATUSES: readonly MemberStatus[] = ['active', 'expiring', 'expired', 'inactive'];

/** "Expiring" = active and the membership ends today or within the next 7 days. */
export const EXPIRING_WINDOW_DAYS = 7;

const DAY_MS = 86400000;
const AVG_MONTH_DAYS = 30.44;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days from today to `date` (negative when it's in the past). */
export function daysFromToday(date: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function membershipEnd(member: Member): Date | null {
  return fromApiDate(member.endOfMembershipDate);
}

export function memberStatus(member: Member, now: Date = new Date()): MemberStatus {
  if (!member.isActive) {
    return 'inactive';
  }
  const end: Date | null = membershipEnd(member);
  if (!end) {
    return 'active';
  }
  const days: number = daysFromToday(end, now);
  if (days < 0) {
    return 'expired';
  }
  return days <= EXPIRING_WINDOW_DAYS ? 'expiring' : 'active';
}

export const STATUS_PILL: Record<MemberStatus, PillStatus> = {
  active: 'active',
  expiring: 'expiring',
  expired: 'expired',
  inactive: 'inactive',
};

export type NoteTone = 'muted' | 'warning' | 'danger';

/** "In 3 days", "7 weeks left", "2 months ago"… as a translation key + count. */
export interface EndNote {
  /** Counted key (one/two/other), or a plain key when count is null. */
  key: string;
  count: number | null;
  tone: NoteTone;
}

export function endNote(member: Member, now: Date = new Date()): EndNote | null {
  const status: MemberStatus = memberStatus(member, now);
  const end: Date | null = membershipEnd(member);
  if (status === 'inactive' || !end) {
    return null;
  }
  const days: number = daysFromToday(end, now);
  if (days === 0) {
    return { key: 'members.notes.endsToday', count: null, tone: 'warning' };
  }
  if (days > 0) {
    if (days <= EXPIRING_WINDOW_DAYS) {
      return { key: 'members.notes.inDays', count: days, tone: 'warning' };
    }
    if (days < 60) {
      return { key: 'members.notes.weeksLeft', count: Math.floor(days / 7), tone: 'muted' };
    }
    return { key: 'members.notes.monthsLeft', count: Math.round(days / AVG_MONTH_DAYS), tone: 'muted' };
  }
  const ago: number = -days;
  if (ago < 7) {
    return { key: 'members.notes.daysAgo', count: ago, tone: 'danger' };
  }
  if (ago < 60) {
    return { key: 'members.notes.weeksAgo', count: Math.floor(ago / 7), tone: 'danger' };
  }
  return { key: 'members.notes.monthsAgo', count: Math.round(ago / AVG_MONTH_DAYS), tone: 'danger' };
}

/** Same day `months` later; the 31st becomes the month's last day when needed (31 Jan + 1 = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const target: Date = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay: number = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Renewal extends from the later of today and the current end date (§5.2). */
export function renewedEnd(member: Member, months: number, now: Date = new Date()): Date {
  const today: Date = startOfDay(now);
  const end: Date | null = membershipEnd(member);
  const base: Date = end && end.getTime() > today.getTime() ? end : today;
  return addMonths(base, months);
}

/**
 * Default "membership ends" order (§5.2: ending soonest first): running memberships by end date,
 * then expired ones, then inactive members.
 */
export function endSortValue(member: Member, now: Date = new Date()): number | null {
  const end: Date | null = membershipEnd(member);
  if (!end) {
    return null;
  }
  const bucket: Record<MemberStatus, number> = { active: 0, expiring: 0, expired: 1, inactive: 2 };
  return bucket[memberStatus(member, now)] * 1e14 + end.getTime();
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
}
