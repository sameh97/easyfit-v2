import { injectable } from "inversify";
import { Bill } from "../models/bill";
import { GroupTraining } from "../models/group-training";
import { Member } from "../models/member";
import { MemberParticipate } from "../models/member-participate";
import { Trainer } from "../models/trainer";
const { Op, fn, col, where, literal } = require("sequelize");

/** Bill phone with spaces and dashes removed ("054-771 2390" → "0547712390"). */
const NORMALISED_BILL_PHONE = fn("translate", col("coustomerPhone"), " -", "");

/** Read-only queries behind GET /api/members/:id/activity. Every query is scoped by gymId. */
@injectable()
export class MemberActivityRepository {
  public findMember = async (gymId: number, memberId: number): Promise<Member | null> => {
    return await Member.findOne({ where: { id: memberId, gymId: gymId }, attributes: ["id", "phone"] });
  };

  public getTrainingIds = async (memberId: number): Promise<number[]> => {
    const rows: MemberParticipate[] = await MemberParticipate.findAll({
      attributes: ["groupTrainingID"],
      where: { memberID: memberId },
    });
    return rows.map((row: MemberParticipate) => row.groupTrainingID);
  };

  public getUpcomingTrainings = async (gymId: number, ids: number[], now: Date): Promise<GroupTraining[]> => {
    if (!ids.length) {
      return [];
    }
    return await GroupTraining.findAll({
      attributes: ["id", "startTime", "description", "trainerId"],
      where: { gymId: gymId, id: ids, startTime: { [Op.gte]: now } },
      order: [["startTime", "ASC"]],
    });
  };

  public getPastTrainings = async (gymId: number, ids: number[], now: Date, limit: number): Promise<GroupTraining[]> => {
    if (!ids.length) {
      return [];
    }
    return await GroupTraining.findAll({
      attributes: ["id", "startTime", "description", "trainerId"],
      where: { gymId: gymId, id: ids, startTime: { [Op.lt]: now } },
      order: [["startTime", "DESC"]],
      limit: limit,
    });
  };

  public getTrainers = async (gymId: number, ids: number[]): Promise<Trainer[]> => {
    if (!ids.length) {
      return [];
    }
    return await Trainer.findAll({ attributes: ["id", "firstName", "lastName"], where: { gymId: gymId, id: ids } });
  };

  public getParticipations = async (trainingIds: number[]): Promise<MemberParticipate[]> => {
    if (!trainingIds.length) {
      return [];
    }
    return await MemberParticipate.findAll({
      attributes: ["groupTrainingID", "memberID"],
      where: { groupTrainingID: trainingIds },
    });
  };

  public getBillsByPhone = async (gymId: number, phone: string, limit: number): Promise<Bill[]> => {
    return await Bill.findAll({
      attributes: ["id", "productID", "productName", "quantity", "totalCost", "createdAt"],
      where: { gymId: gymId, [Op.and]: [where(NORMALISED_BILL_PHONE, phone)] },
      order: [["createdAt", "DESC"]],
      limit: limit,
    });
  };

  public getBillTotalsByPhone = async (gymId: number, phone: string): Promise<{ count: number; total: number }> => {
    const row = (await Bill.findOne({
      attributes: [
        [fn("COUNT", col("id")), "count"],
        [fn("COALESCE", fn("SUM", col("totalCost")), literal("0")), "total"],
      ],
      where: { gymId: gymId, [Op.and]: [where(NORMALISED_BILL_PHONE, phone)] },
      raw: true,
    })) as unknown as { count: string | number; total: string | number } | null;
    return { count: Number(row?.count ?? 0), total: Number(row?.total ?? 0) };
  };
}
