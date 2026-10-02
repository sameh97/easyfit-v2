const DAY_MS = 24 * 60 * 60 * 1000;

/** The fields that define when a maintenance job runs: `startTime + n × daysFrequency`, up to `endTime`. */
export interface JobTiming {
  startTime: Date;
  endTime: Date;
  daysFrequency: number;
}

/**
 * First run at or after `from`, or null when the job has no run left before its `endTime`.
 * A frequency of 0 (or less) means a single run at `startTime`.
 * Shared by the scheduler (when to fire) and the dashboard (what is due), so both agree.
 */
export function nextOccurrence(job: JobTiming, from: Date): Date | null {
  const start = new Date(job.startTime).getTime();
  const end = new Date(job.endTime).getTime();
  const fromMs = from.getTime();
  const periodMs = Number(job.daysFrequency) * DAY_MS;

  let next: number;
  if (start >= fromMs) {
    next = start;
  } else if (periodMs > 0) {
    next = start + Math.ceil((fromMs - start) / periodMs) * periodMs;
  } else {
    return null;
  }
  return next <= end ? new Date(next) : null;
}
