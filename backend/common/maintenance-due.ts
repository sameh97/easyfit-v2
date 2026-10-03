import { nextOccurrence } from "./job-occurrence";
import { AppNotification } from "../models/app-notification";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { DashboardMaintenanceDueDto } from "../models/dto/dashboard-summary-dto";

/**
 * "Due today" and "overdue" (redesign.md §5.1, §5.6) — one rule for the sidebar badge, the
 * dashboard, Machines and Maintenance:
 * - due today: an active job with a run (startTime + n × daysFrequency, before endTime) today;
 * - overdue: an active job, not due today, whose alert from an earlier day is still open
 *   (not marked Done, which deletes it). The schema has no per-run completion record, so an
 *   open alert is the only "not done yet" signal.
 * `activeJobs` are the active jobs ending today or later; `openAlertsBeforeToday` the open
 * alerts created before today's local midnight.
 */
export function maintenanceDueJobs(
  activeJobs: MachineScheduledJob[],
  openAlertsBeforeToday: AppNotification[],
  todayStart: Date,
  tomorrowStart: Date
): { dueToday: Set<number>; overdue: Set<number> } {
  const dueToday = new Set<number>(
    activeJobs
      .filter((job: MachineScheduledJob) => {
        const next = nextOccurrence(job, todayStart);
        return next !== null && next < tomorrowStart;
      })
      .map((job: MachineScheduledJob) => job.id)
  );

  const activeIds = new Set<number>(activeJobs.map((job: MachineScheduledJob) => job.id));
  const overdue = new Set<number>();
  openAlertsBeforeToday.forEach((alert: AppNotification) => {
    const jobId = jobIdOfAlert(alert);
    if (jobId !== null && activeIds.has(jobId) && !dueToday.has(jobId)) {
      overdue.add(jobId);
    }
  });
  return { dueToday, overdue };
}

/** Jobs needing attention (sidebar badge). Each job counts once. */
export function countMaintenanceDue(
  activeJobs: MachineScheduledJob[],
  openAlertsBeforeToday: AppNotification[],
  todayStart: Date,
  tomorrowStart: Date
): DashboardMaintenanceDueDto {
  const { dueToday, overdue } = maintenanceDueJobs(activeJobs, openAlertsBeforeToday, todayStart, tomorrowStart);
  return { today: dueToday.size, overdue: overdue.size, total: dueToday.size + overdue.size };
}

/** Scheduled-job alerts store the job DTO as JSON in `content`; other alerts yield null. */
export function jobIdOfAlert(alert: AppNotification): number | null {
  try {
    const parsed: { id?: unknown } = JSON.parse(alert.content);
    return typeof parsed.id === "number" ? parsed.id : null;
  } catch {
    return null;
  }
}
