import { DashboardMaintenanceDueDto } from "./dashboard-summary-dto";

/** One scheduled job's status. Its own fields (type, frequency, dates, active) come from GET /api/schedules. */
export interface MaintenanceJobStatusDto {
  jobId: number;
  machineSerialNumber: string;
  /** First run from today's local midnight on (ISO); null when the job is inactive or has no run left. */
  nextRun: string | null;
  dueToday: boolean;
  /** Active, not due today, with an open alert from an earlier day. */
  overdue: boolean;
  /** This job's open (not Done) alerts. */
  openAlerts: number;
  /** Creation time of the oldest open alert (ISO), or null. */
  oldestOpenAlertAt: string | null;
}

export interface MachineAlertStatusDto {
  serialNumber: string;
  openAlerts: number;
}

/** GET /api/maintenance/status — read-only, gym from the JWT (redesign.md §5.6). */
export interface MaintenanceStatusDto {
  /** The same numbers as the dashboard's maintenanceDue (sidebar badge). */
  due: DashboardMaintenanceDueDto;
  jobs: MaintenanceJobStatusDto[];
  /** Machines with at least one open alert. */
  machines: MachineAlertStatusDto[];
}
