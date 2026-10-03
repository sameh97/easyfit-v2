import { Machine } from 'src/app/model/machine';
import { addDays, startOfWeek } from 'src/app/shared/ui/week-strip/week-strip.component';
import { JobView } from '../machines/machine-status';

/** §5.6: jobs grouped by when they are next due, then the inactive ones. */
export type JobGroup = 'overdue' | 'today' | 'week' | 'later' | 'inactive';

export const JOB_GROUPS: readonly JobGroup[] = ['overdue', 'today', 'week', 'later', 'inactive'];

export interface JobRow extends JobView {
  group: JobGroup;
  machine: Machine | null;
}

/**
 * Overdue and Today come from the status endpoint (the badge's rule). This week = from tomorrow to
 * the end of Saturday (Sunday–Saturday weeks, as Classes); Later after that. Inactive = paused,
 * or active with no run left before its end time.
 */
export function groupOf(view: JobView, now: Date = new Date()): JobGroup {
  if (!view.job.isActive || !view.nextRun) {
    return 'inactive';
  }
  if (view.status?.overdue) {
    return 'overdue';
  }
  if (view.status?.dueToday) {
    return 'today';
  }
  const weekEnd: Date = addDays(startOfWeek(now), 7);
  return view.nextRun < weekEnd ? 'week' : 'later';
}

/** Rows sorted inside each group: by next run, overdue by how long the alert has been open. */
export function sortRows(rows: JobRow[]): JobRow[] {
  const key = (row: JobRow): number => {
    if (row.group === 'overdue' && row.status?.oldestOpenAlertAt) {
      return new Date(row.status.oldestOpenAlertAt).getTime();
    }
    return row.nextRun?.getTime() ?? new Date(row.job.endTime).getTime();
  };
  return [...rows].sort((a: JobRow, b: JobRow) => key(a) - key(b));
}
