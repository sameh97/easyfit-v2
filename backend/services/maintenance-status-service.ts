import { inject, injectable } from "inversify";
import { nextOccurrence } from "../common/job-occurrence";
import { LocalCalendar } from "../common/local-calendar";
import { jobIdOfAlert, maintenanceDueJobs } from "../common/maintenance-due";
import { AppNotification } from "../models/app-notification";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { MaintenanceJobStatusDto, MaintenanceStatusDto } from "../models/dto/maintenance-status-dto";
import { DashboardRepository } from "../repositories/dashboard-repository";

/**
 * GET /api/maintenance/status (redesign.md §5.6): per job the next run and whether it is due
 * today or overdue, per machine the open-alert count. Same rules as the dashboard
 * (common/maintenance-due.ts), so the sidebar badge, Machines and Maintenance always agree.
 */
@injectable()
export class MaintenanceStatusService {
  constructor(@inject(DashboardRepository) private repository: DashboardRepository) {}

  public getStatus = async (gymId: number, tzOffsetMinutes: number, now: Date = new Date()): Promise<MaintenanceStatusDto> => {
    const cal = new LocalCalendar(now, tzOffsetMinutes);
    const todayStart: Date = cal.todayStart;
    const tomorrowStart: Date = cal.startOf(cal.year, cal.month, cal.date + 1);

    const [jobs, openAlerts] = await Promise.all([
      this.repository.getAllJobs(gymId),
      this.repository.getOpenNotifications(gymId),
    ]);

    // Exactly the inputs the dashboard uses for its badge count.
    const activeJobs: MachineScheduledJob[] = jobs.filter(
      (job: MachineScheduledJob) => job.isActive && new Date(job.endTime).getTime() >= todayStart.getTime()
    );
    const alertsBeforeToday: AppNotification[] = openAlerts.filter(
      (alert: AppNotification) => new Date(alert.createdAt).getTime() < todayStart.getTime()
    );
    const { dueToday, overdue } = maintenanceDueJobs(activeJobs, alertsBeforeToday, todayStart, tomorrowStart);

    const alertsByJob = new Map<number, Date[]>();
    const alertsByMachine = new Map<string, number>();
    openAlerts.forEach((alert: AppNotification) => {
      alertsByMachine.set(alert.targetObjectId, (alertsByMachine.get(alert.targetObjectId) || 0) + 1);
      const jobId: number | null = jobIdOfAlert(alert);
      if (jobId !== null) {
        alertsByJob.set(jobId, [...(alertsByJob.get(jobId) || []), new Date(alert.createdAt)]);
      }
    });

    const activeIds = new Set<number>(activeJobs.map((job: MachineScheduledJob) => job.id));
    return {
      due: { today: dueToday.size, overdue: overdue.size, total: dueToday.size + overdue.size },
      jobs: jobs.map((job: MachineScheduledJob): MaintenanceJobStatusDto => {
        const next: Date | null = activeIds.has(job.id) ? nextOccurrence(job, todayStart) : null;
        const alerts: Date[] = alertsByJob.get(job.id) || [];
        const oldest: Date | null = alerts.length ? new Date(Math.min(...alerts.map((date: Date) => date.getTime()))) : null;
        return {
          jobId: job.id,
          machineSerialNumber: job.machineSerialNumber,
          nextRun: next ? next.toISOString() : null,
          dueToday: dueToday.has(job.id),
          overdue: overdue.has(job.id),
          openAlerts: alerts.length,
          oldestOpenAlertAt: oldest ? oldest.toISOString() : null,
        };
      }),
      machines: Array.from(alertsByMachine.entries()).map(([serialNumber, count]: [string, number]) => ({
        serialNumber,
        openAlerts: count,
      })),
    };
  };
}
