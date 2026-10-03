import { classTitle } from 'src/app/common/class-title';
import { GroupTraining } from 'src/app/model/group-training';

export type ClassState = 'done' | 'next' | 'later';

/** The part of a description after the first colon ("Morning Yoga: bring a mat" → "bring a mat"). */
export function classNote(description: string): string {
  const text: string = description ?? '';
  const colon: number = text.indexOf(':');
  return colon < 0 ? '' : text.slice(colon + 1).trim();
}

export { classTitle };

/**
 * Done / up next / later, the dashboard's Today rules (§5.1, §5.4): a class that has started is
 * done; the first class still to come (of all classes passed in) is up next.
 */
export function classStates<T extends { id: number; startTime: Date | string }>(items: T[], now: Date = new Date()): Map<number, ClassState> {
  const sorted: T[] = [...items].sort((a: T, b: T) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const next: T | undefined = sorted.find((item: T) => new Date(item.startTime).getTime() > now.getTime());
  return new Map<number, ClassState>(
    items.map((item: T) => [
      item.id,
      new Date(item.startTime).getTime() <= now.getTime() ? 'done' : item.id === next?.id ? 'next' : 'later',
    ])
  );
}

/** One hour: the backend refuses a trainer's class that starts less than this after another of theirs started. */
const TRAINER_GAP_MS: number = 60 * 60 * 1000;

/**
 * The trainer's other class that blocks starting a class at `start` (the backend's rule on create
 * and update: another class of theirs that started in the hour up to `start`), or null.
 */
export function trainerClash(trainings: GroupTraining[], trainerId: number, start: Date, ignoreId: number | null): GroupTraining | null {
  const t: number = start.getTime();
  return (
    trainings.find((training: GroupTraining) => {
      if (training.trainerId !== trainerId || training.id === ignoreId) {
        return false;
      }
      const other: number = new Date(training.startTime).getTime();
      return other > t - TRAINER_GAP_MS && other <= t;
    }) ?? null
  );
}

/** YYYY-MM-DD of a local date (the `?day=` format). */
export function dayParam(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a `?day=YYYY-MM-DD` value, or null when it isn't a real date. */
export function parseDayParam(value: string | null): Date | null {
  const match: RegExpMatchArray | null = (value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date: Date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}
