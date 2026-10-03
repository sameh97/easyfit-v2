import { inject, injectable } from "inversify";
import { Bill } from "../models/bill";
import { MemberActivityDto, MemberClassDto } from "../models/dto/member-activity-dto";
import { GroupTraining } from "../models/group-training";
import { Member } from "../models/member";
import { MemberParticipate } from "../models/member-participate";
import { Trainer } from "../models/trainer";
import { MemberActivityRepository } from "../repositories/member-activity-repository";
import { NotFoundErr } from "../exeptions/not-found-error";

const PAST_CLASSES_LIMIT = 10;
const PURCHASES_LIMIT = 50;

/** Strips spaces and dashes, the same way bill phones are compared in SQL. */
export function normalisePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[\s-]/g, "");
}

/** A member's group trainings and their purchases (matched by phone). Read-only. */
@injectable()
export class MemberActivityService {
  constructor(@inject(MemberActivityRepository) private repository: MemberActivityRepository) {}

  /** @throws NotFoundErr when the member doesn't exist in this gym. */
  public getActivity = async (gymId: number, memberId: number, now: Date = new Date()): Promise<MemberActivityDto> => {
    const member: Member | null = await this.repository.findMember(gymId, memberId);
    if (!member) {
      throw new NotFoundErr(`member ${memberId} not found`);
    }

    const trainingIds: number[] = await this.repository.getTrainingIds(member.id);
    const [upcoming, past] = await Promise.all([
      this.repository.getUpcomingTrainings(gymId, trainingIds, now),
      this.repository.getPastTrainings(gymId, trainingIds, now, PAST_CLASSES_LIMIT),
    ]);
    const classes: MemberClassDto[] = await this.toClassDtos(gymId, [...upcoming, ...past]);
    const byId = new Map<number, MemberClassDto>(classes.map((dto: MemberClassDto) => [dto.id, dto]));

    const phone: string = normalisePhone(member.phone);
    const [bills, totals] = phone
      ? await Promise.all([
          this.repository.getBillsByPhone(gymId, phone, PURCHASES_LIMIT),
          this.repository.getBillTotalsByPhone(gymId, phone),
        ])
      : [[] as Bill[], { count: 0, total: 0 }];

    return {
      memberId: member.id,
      classes: {
        upcoming: upcoming.map((training: GroupTraining) => byId.get(training.id)),
        past: past.map((training: GroupTraining) => byId.get(training.id)),
      },
      purchases: {
        matchedBy: "phone",
        items: bills.map((bill: Bill) => ({
          id: bill.id,
          productId: bill.productID,
          productName: bill.productName,
          quantity: bill.quantity,
          totalCost: bill.totalCost,
          createdAt: new Date(bill.getDataValue("createdAt" as keyof Bill) as unknown as string).toISOString(),
        })),
        totalCount: totals.count,
        totalSpent: totals.total,
      },
    };
  };

  private toClassDtos = async (gymId: number, trainings: GroupTraining[]): Promise<MemberClassDto[]> => {
    const trainerIds: number[] = Array.from(new Set(trainings.map((training: GroupTraining) => training.trainerId)));
    const [trainers, participations] = await Promise.all([
      this.repository.getTrainers(gymId, trainerIds),
      this.repository.getParticipations(trainings.map((training: GroupTraining) => training.id)),
    ]);
    const trainersById = new Map<number, Trainer>(trainers.map((trainer: Trainer) => [trainer.id, trainer]));
    const counts = new Map<number, number>();
    participations.forEach((row: MemberParticipate) =>
      counts.set(row.groupTrainingID, (counts.get(row.groupTrainingID) ?? 0) + 1)
    );

    return trainings.map((training: GroupTraining) => {
      const trainer: Trainer | undefined = trainersById.get(training.trainerId);
      return {
        id: training.id,
        startTime: new Date(training.startTime).toISOString(),
        description: training.description,
        trainer: trainer ? { id: trainer.id, firstName: trainer.firstName, lastName: trainer.lastName } : null,
        participantCount: counts.get(training.id) ?? 0,
      };
    });
  };
}
