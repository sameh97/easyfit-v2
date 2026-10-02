import { inject, injectable } from "inversify";
import { MemberDtoMapper } from "../common/dto-mapper/member-dto-mapper";
import { Bill } from "../models/bill";
import {
  DashboardClassDto,
  DashboardLowStockDto,
  DashboardMaintenanceDto,
  DashboardSummaryDto,
  MaintenanceJobType,
} from "../models/dto/dashboard-summary-dto";
import { GroupTraining } from "../models/group-training";
import { Machine } from "../models/machines";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { Member } from "../models/member";
import { MemberParticipate } from "../models/member-participate";
import { Trainer } from "../models/trainer";
import { DashboardRepository } from "../repositories/dashboard-repository";

const DAY_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_MAX_QUANTITY = 5;
const LOW_STOCK_LIMIT = 5;
const EXPIRING_LIST_LIMIT = 5;
const MAINTENANCE_LIMIT = 3;
const JOB_TYPES: Record<number, MaintenanceJobType> = { 1: "clean", 2: "service" };

/**
 * Calendar in the client's timezone. `offsetMinutes` is JS `Date#getTimezoneOffset()`
 * from the browser (UTC − local, e.g. −180 in Israel in summer). The API container runs in
 * UTC, so "today" and "this month" are computed from the offset the client sends.
 */
class LocalCalendar {
  private readonly offsetMs: number;
  /** "now" shifted so that its UTC fields read as the client's local wall clock. */
  private readonly localNow: Date;

  constructor(public readonly now: Date, offsetMinutes: number) {
    this.offsetMs = offsetMinutes * 60 * 1000;
    this.localNow = new Date(now.getTime() - this.offsetMs);
  }

  get year(): number {
    return this.localNow.getUTCFullYear();
  }

  /** 0-based. */
  get month(): number {
    return this.localNow.getUTCMonth();
  }

  /** Instant of local midnight for the given local calendar date (month may overflow). */
  startOf(year: number, month: number, day: number = 1): Date {
    return new Date(Date.UTC(year, month, day) + this.offsetMs);
  }

  get date(): number {
    return this.localNow.getUTCDate();
  }

  get todayStart(): Date {
    return this.startOf(this.year, this.month, this.date);
  }

  /** 0-based local month of an instant. */
  monthOf(instant: Date): { year: number; month: number } {
    const local = new Date(instant.getTime() - this.offsetMs);
    return { year: local.getUTCFullYear(), month: local.getUTCMonth() };
  }

  /** Whole local days from today's midnight to the local day of `instant` (0 = today). */
  daysFromToday(instant: Date): number {
    const local = new Date(instant.getTime() - this.offsetMs);
    const dayStart = this.startOf(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    return Math.round((dayStart.getTime() - this.todayStart.getTime()) / DAY_MS);
  }
}

@injectable()
export class DashboardService {
  constructor(
    @inject(DashboardRepository) private dashboardRepository: DashboardRepository,
    @inject(MemberDtoMapper) private memberDtoMapper: MemberDtoMapper
  ) {}

  public getSummary = async (gymId: number, tzOffsetMinutes: number, now: Date = new Date()): Promise<DashboardSummaryDto> => {
    const cal = new LocalCalendar(now, tzOffsetMinutes);
    const todayStart = cal.todayStart;
    const tomorrowStart = cal.startOf(cal.year, cal.month, cal.date + 1);
    const yearStart = cal.startOf(cal.year, 0);
    const monthStart = cal.startOf(cal.year, cal.month);
    const nextMonthStart = cal.startOf(cal.year, cal.month + 1);
    const lastMonthStart = cal.startOf(cal.year, cal.month - 1);
    // Today plus the next 7 days (end of day 7 = start of day 8).
    const expiringEnd = new Date(todayStart.getTime() + 8 * DAY_MS);

    const [gym, memberCount, activeCount, joinedThisYear, expiringMembers, trainings, bills, jobs, lowStock] =
      await Promise.all([
        this.dashboardRepository.getGym(gymId),
        this.dashboardRepository.countMembers(gymId),
        this.dashboardRepository.countActiveMembers(gymId),
        this.dashboardRepository.getMembersJoinedBetween(gymId, yearStart, nextMonthStart),
        this.dashboardRepository.getActiveMembersEndingBetween(gymId, todayStart, expiringEnd),
        this.dashboardRepository.getTrainingsBetween(gymId, todayStart, tomorrowStart),
        // From last month's start so December→January still has a "last month".
        this.dashboardRepository.getBillsBetween(gymId, lastMonthStart < yearStart ? lastMonthStart : yearStart, nextMonthStart),
        this.dashboardRepository.getActiveJobsEndingAfter(gymId, todayStart),
        this.dashboardRepository.getLowStockProducts(gymId, LOW_STOCK_MAX_QUANTITY, LOW_STOCK_LIMIT),
      ]);

    const monthsSoFar = cal.month + 1;
    const newMembersByMonth = new Array<number>(monthsSoFar).fill(0);
    joinedThisYear.forEach((member: Member) => {
      const { year, month } = cal.monthOf(new Date(member.joinDate));
      if (year === cal.year && month < monthsSoFar) {
        newMembersByMonth[month] += 1;
      }
    });

    const incomeByMonth = new Array<number>(monthsSoFar).fill(0);
    const productsSoldByMonth = new Array<number>(monthsSoFar).fill(0);
    let lastMonthRevenue = 0;
    const lastMonth = cal.monthOf(lastMonthStart);
    bills.forEach((bill: Bill) => {
      const { year, month } = cal.monthOf(new Date(bill.createdAt));
      const total = Number(bill.totalCost) || 0;
      if (year === cal.year && month < monthsSoFar) {
        incomeByMonth[month] += total;
        productsSoldByMonth[month] += Number(bill.quantity) || 0;
      }
      if (year === lastMonth.year && month === lastMonth.month) {
        lastMonthRevenue += total;
      }
    });
    const thisMonthRevenue = incomeByMonth[cal.month];

    const expiringList = expiringMembers.map((member: Member) => ({
      member: this.memberDtoMapper.asDto(member),
      daysLeft: cal.daysFromToday(new Date(member.endOfMembershipDate)),
    }));

    return {
      gym: { id: gymId, name: gym ? gym.name : "", memberCount: memberCount },
      members: { active: activeCount, newThisMonth: newMembersByMonth[cal.month] },
      expiring: {
        within7Days: expiringList.length,
        within3Days: expiringList.filter((entry) => entry.daysLeft <= 3).length,
        list: expiringList.slice(0, EXPIRING_LIST_LIMIT),
      },
      classesToday: await this.buildClassesToday(gymId, trainings, now),
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        changePct: lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null,
      },
      incomeByMonth,
      newMembersByMonth,
      productsSoldByMonth,
      maintenance: await this.buildMaintenance(gymId, jobs, todayStart),
      lowStock: lowStock.map(
        (product): DashboardLowStockDto => ({
          id: product.id,
          name: product.name,
          categoryID: product.categoryID,
          price: product.price,
          quantity: product.quantity,
        })
      ),
    };
  };

  private buildClassesToday = async (
    gymId: number,
    trainings: GroupTraining[],
    now: Date
  ): Promise<DashboardSummaryDto["classesToday"]> => {
    const trainerIds = Array.from(new Set(trainings.map((training: GroupTraining) => training.trainerId)));
    const [trainers, participations] = await Promise.all([
      this.dashboardRepository.getTrainers(gymId, trainerIds),
      this.dashboardRepository.getParticipations(trainings.map((training: GroupTraining) => training.id)),
    ]);

    const trainerNames = new Map<number, string>(
      trainers.map((trainer: Trainer) => [trainer.id, `${trainer.firstName} ${trainer.lastName}`.trim()])
    );
    const memberCounts = new Map<number, number>();
    participations.forEach((participation: MemberParticipate) => {
      memberCounts.set(participation.groupTrainingID, (memberCounts.get(participation.groupTrainingID) || 0) + 1);
    });

    const list: DashboardClassDto[] = trainings.map((training: GroupTraining) => ({
      id: training.id,
      startTime: new Date(training.startTime).toISOString(),
      description: training.description,
      trainerName: trainerNames.get(training.trainerId) || "",
      memberCount: memberCounts.get(training.id) || 0,
    }));

    return {
      total: list.length,
      remaining: trainings.filter((training: GroupTraining) => new Date(training.startTime).getTime() > now.getTime()).length,
      list,
    };
  };

  private buildMaintenance = async (
    gymId: number,
    jobs: MachineScheduledJob[],
    todayStart: Date
  ): Promise<DashboardMaintenanceDto[]> => {
    const upcoming = jobs
      .map((job: MachineScheduledJob) => ({ job, nextDue: this.nextOccurrence(job, todayStart) }))
      .filter((entry): entry is { job: MachineScheduledJob; nextDue: Date } => entry.nextDue !== null)
      .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())
      .slice(0, MAINTENANCE_LIMIT);

    const machines = await this.dashboardRepository.getMachinesBySerial(
      gymId,
      Array.from(new Set(upcoming.map((entry) => entry.job.machineSerialNumber)))
    );
    const machineNames = new Map<string, string>(machines.map((machine: Machine) => [machine.serialNumber, machine.name]));

    return upcoming.map(({ job, nextDue }) => ({
      jobId: job.id,
      machineName: machineNames.get(job.machineSerialNumber) || "Unknown machine",
      serialNumber: job.machineSerialNumber,
      jobType: JOB_TYPES[job.jobID] || "service",
      nextDue: nextDue.toISOString(),
    }));
  };

  /** First run of `startTime + n × daysFrequency` on or after today's midnight, within `endTime`. */
  private nextOccurrence(job: MachineScheduledJob, todayStart: Date): Date | null {
    const start = new Date(job.startTime).getTime();
    const end = new Date(job.endTime).getTime();
    const from = todayStart.getTime();
    const periodMs = Number(job.daysFrequency) * DAY_MS;

    let next: number;
    if (start >= from) {
      next = start;
    } else if (periodMs > 0) {
      next = start + Math.ceil((from - start) / periodMs) * periodMs;
    } else {
      return null;
    }
    return next <= end ? new Date(next) : null;
  }
}
