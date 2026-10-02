import { MemberDto } from "./member-dto";

/** GET /api/dashboard/summary — read-only aggregates for the dashboard (redesign.md §5.1, §7.6). */
export interface DashboardSummaryDto {
  gym: { id: number; name: string; memberCount: number };
  members: { active: number; newThisMonth: number };
  expiring: {
    /** Active members whose membership ends today or in the next 7 days. */
    within7Days: number;
    within3Days: number;
    /** Soonest first, at most 5. */
    list: { member: MemberDto; daysLeft: number }[];
  };
  classesToday: {
    total: number;
    /** Classes that haven't started yet. */
    remaining: number;
    list: DashboardClassDto[];
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    /** Rounded % change vs last month; null when last month had no sales. */
    changePct: number | null;
  };
  /** Index 0 = January, up to and including the current month. */
  incomeByMonth: number[];
  newMembersByMonth: number[];
  productsSoldByMonth: number[];
  /** Next occurrences of active maintenance jobs, soonest first, at most 3. */
  maintenance: DashboardMaintenanceDto[];
  /** Products with quantity <= 5, lowest first, at most 5. */
  lowStock: DashboardLowStockDto[];
}

export interface DashboardClassDto {
  id: number;
  startTime: string;
  description: string;
  trainerName: string;
  memberCount: number;
}

export type MaintenanceJobType = "clean" | "service";

export interface DashboardMaintenanceDto {
  jobId: number;
  machineName: string;
  serialNumber: string;
  jobType: MaintenanceJobType;
  nextDue: string;
}

export interface DashboardLowStockDto {
  id: number;
  name: string;
  categoryID: number;
  price: number;
  quantity: number;
}
