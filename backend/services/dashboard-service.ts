import { inject, injectable } from "inversify";
import { MemberDtoMapper } from "../common/dto-mapper/member-dto-mapper";
import { nextOccurrence } from "../common/job-occurrence";
import { LocalCalendar } from "../common/local-calendar";
import { countMaintenanceDue } from "../common/maintenance-due";
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
    // Same days of last month as month-to-date (1–2 Oct ↔ 1–2 Sep), capped at last month's end
    // (31 Oct ↔ 1–30 Sep): the day after today's date in last month, or this month's start.
    const lastMonthSameDayEnd = cal.startOf(cal.year, cal.month - 1, cal.date + 1);
    const lastMonthPeriodEnd = lastMonthSameDayEnd < monthStart ? lastMonthSameDayEnd : monthStart;
    // Today plus the next 7 days (end of day 7 = start of day 8).
    const expiringEnd = new Date(todayStart.getTime() + 8 * DAY_MS);

    const [gym, memberCount, activeCount, joinedThisYear, expiringMembers, trainings, bills, jobs, lowStock, openAlerts] =
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
        this.dashboardRepository.getOpenNotificationsBefore(gymId, todayStart),
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
    let thisMonthToDate = 0;
    let lastMonthSamePeriod = 0;
    bills.forEach((bill: Bill) => {
      const createdAt = new Date(bill.createdAt);
      const { year, month } = cal.monthOf(createdAt);
      const total = Number(bill.totalCost) || 0;
      if (year === cal.year && month < monthsSoFar) {
        incomeByMonth[month] += total;
        productsSoldByMonth[month] += Number(bill.quantity) || 0;
      }
      // Whole days on both sides: 1st → end of today vs 1st → end of the same day last month.
      if (createdAt >= monthStart && createdAt < tomorrowStart) {
        thisMonthToDate += total;
      }
      if (createdAt >= lastMonthStart && createdAt < lastMonthPeriodEnd) {
        lastMonthSamePeriod += total;
      }
    });
    const thisMonthRevenue = thisMonthToDate;

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
        lastMonthSamePeriod: lastMonthSamePeriod,
        changePct:
          lastMonthSamePeriod > 0 ? Math.round(((thisMonthRevenue - lastMonthSamePeriod) / lastMonthSamePeriod) * 100) : null,
      },
      incomeByMonth,
      newMembersByMonth,
      productsSoldByMonth,
      maintenance: await this.buildMaintenance(gymId, jobs, todayStart),
      maintenanceDue: countMaintenanceDue(jobs, openAlerts, todayStart, tomorrowStart),
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
      .map((job: MachineScheduledJob) => ({ job, nextDue: nextOccurrence(job, todayStart) }))
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
}
