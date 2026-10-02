import { Member } from './member';

/** Response of GET /api/dashboard/summary (see backend/models/dto/dashboard-summary-dto.ts). */
export interface DashboardSummary {
  gym: { id: number; name: string; memberCount: number };
  members: { active: number; newThisMonth: number };
  expiring: {
    within7Days: number;
    within3Days: number;
    list: { member: Member; daysLeft: number }[];
  };
  classesToday: {
    total: number;
    remaining: number;
    list: DashboardClass[];
  };
  revenue: { thisMonth: number; lastMonth: number; changePct: number | null };
  /** Index 0 = January, up to and including the current month. */
  incomeByMonth: number[];
  newMembersByMonth: number[];
  productsSoldByMonth: number[];
  maintenance: DashboardMaintenanceJob[];
  lowStock: DashboardLowStockProduct[];
}

export interface DashboardClass {
  id: number;
  startTime: string;
  description: string;
  trainerName: string;
  memberCount: number;
}

export interface DashboardMaintenanceJob {
  jobId: number;
  machineName: string;
  serialNumber: string;
  jobType: 'clean' | 'service';
  nextDue: string;
}

export interface DashboardLowStockProduct {
  id: number;
  name: string;
  categoryID: number;
  price: number;
  quantity: number;
}
