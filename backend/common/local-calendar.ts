const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calendar in the client's timezone. `offsetMinutes` is JS `Date#getTimezoneOffset()`
 * from the browser (UTC − local, e.g. −180 in Israel in summer). The API container runs in
 * UTC, so "today" and "this month" are computed from the offset the client sends.
 */
export class LocalCalendar {
  private readonly offsetMs: number;
  /** "now" shifted so that its UTC fields read as the client's local wall clock. */
  private readonly localNow: Date;

  constructor(public readonly now: Date, offsetMinutes: number) {
    this.offsetMs = offsetMinutes * 60 * 1000;
    this.localNow = new Date(now.getTime() - this.offsetMs);
  }

  get year(): number {
    return this.localNow.getUTCFullYear();
  }

  /** 0-based. */
  get month(): number {
    return this.localNow.getUTCMonth();
  }

  /** Instant of local midnight for the given local calendar date (month may overflow). */
  startOf(year: number, month: number, day: number = 1): Date {
    return new Date(Date.UTC(year, month, day) + this.offsetMs);
  }

  get date(): number {
    return this.localNow.getUTCDate();
  }

  get todayStart(): Date {
    return this.startOf(this.year, this.month, this.date);
  }

  /** 0-based local month of an instant. */
  monthOf(instant: Date): { year: number; month: number } {
    const local = new Date(instant.getTime() - this.offsetMs);
    return { year: local.getUTCFullYear(), month: local.getUTCMonth() };
  }

  /** Whole local days from today's midnight to the local day of `instant` (0 = today). */
  daysFromToday(instant: Date): number {
    const local = new Date(instant.getTime() - this.offsetMs);
    const dayStart = this.startOf(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    return Math.round((dayStart.getTime() - this.todayStart.getTime()) / DAY_MS);
  }
}
