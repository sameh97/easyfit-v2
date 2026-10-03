import { Machine } from 'src/app/model/machine';
import { MaintenanceJobStatus, MaintenanceStatus } from 'src/app/model/maintenance-status';
import { ScheduledJob } from 'src/app/model/scheduled-job';
import { JobType, jobTypeOf } from 'src/app/services/maintenance-alerts.service';
import { DateFormatName } from 'src/app/shared/i18n/date-formats';
import { dayDiff } from 'src/app/shared/ui/week-strip/week-strip.component';

/** A scheduled job with its status from GET /api/maintenance/status (null until that loads). */
export interface JobView {
  job: ScheduledJob;
  type: JobType;
  status: MaintenanceJobStatus | null;
  nextRun: Date | null;
}

/** The machine card badge (§5.5): Overdue / Due today (danger), Next: {date} or No jobs (neutral). */
export type MachineBadge = 'overdue' | 'due' | 'next' | 'none';

export interface MachineView {
  machine: Machine;
  jobs: JobView[];
  badge: MachineBadge;
  /** Earliest next run of the machine's jobs. */
  nextRun: Date | null;
  openAlerts: number;
  needsAttention: boolean;
}

export function jobViews(jobs: ScheduledJob[], status: MaintenanceStatus | null): JobView[] {
  const byId = new Map<number, MaintenanceJobStatus>((status?.jobs ?? []).map((s: MaintenanceJobStatus) => [s.jobId, s]));
  return jobs.map((job: ScheduledJob) => {
    const jobStatus: MaintenanceJobStatus | null = byId.get(job.id) ?? null;
    return {
      job,
      type: jobTypeOf(job.jobID),
      status: jobStatus,
      nextRun: jobStatus?.nextRun ? new Date(jobStatus.nextRun) : null,
    };
  });
}

/** Joins machines with their jobs, the status endpoint and the open-alert counts per serial number. */
export function machineViews(machines: Machine[], jobs: JobView[], openAlertsBySerial: Map<string, number>): MachineView[] {
  return machines.map((machine: Machine) => {
    const serial: string = String(machine.serialNumber);
    const own: JobView[] = jobs
      .filter((view: JobView) => view.job.machineSerialNumber === serial)
      .sort((a: JobView, b: JobView) => (a.nextRun?.getTime() ?? Infinity) - (b.nextRun?.getTime() ?? Infinity));
    const nextRun: Date | null = own.find((view: JobView) => view.nextRun !== null)?.nextRun ?? null;
    const badge: MachineBadge = own.some((view: JobView) => view.status?.overdue)
      ? 'overdue'
      : own.some((view: JobView) => view.status?.dueToday)
      ? 'due'
      : nextRun
      ? 'next'
      : 'none';
    const openAlerts: number = openAlertsBySerial.get(serial) ?? 0;
    return { machine, jobs: own, badge, nextRun, openAlerts, needsAttention: badge === 'overdue' || badge === 'due' || openAlerts > 0 };
  });
}

/** "Today, 06:00" · "Tomorrow, 07:00" · "Yesterday, 06:00" · "Wed, 23 Sep, 06:00" (common.when.*). */
export function dayTime(date: Date, language: { t: (key: string, params?: Record<string, string>) => string; date: (value: Date, format: DateFormatName) => string }): string {
  const time: string = language.date(date, 'time');
  const days: number = dayDiff(new Date(), date);
  if (days === 0 || days === 1 || days === -1) {
    return language.t(`common.when.${days === 0 ? 'today' : days === 1 ? 'tomorrow' : 'yesterday'}`, { time });
  }
  return language.t('common.when.other', { day: language.date(date, 'shortDay'), time });
}
