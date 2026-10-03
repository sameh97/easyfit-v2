/** GET /api/maintenance/status (redesign.md §5.6). Job fields themselves come from GET /api/schedules. */
export interface MaintenanceJobStatus {
  jobId: number;
  machineSerialNumber: string;
  /** ISO; null when the job is inactive or has no run left. */
  nextRun: string | null;
  dueToday: boolean;
  overdue: boolean;
  openAlerts: number;
  oldestOpenAlertAt: string | null;
}

export interface MaintenanceStatus {
  /** The sidebar badge: jobs due today or overdue. */
  due: { today: number; overdue: number; total: number };
  jobs: MaintenanceJobStatus[];
  machines: { serialNumber: string; openAlerts: number }[];
}
