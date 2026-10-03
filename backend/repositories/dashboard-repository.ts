import { injectable } from "inversify";
import { AppNotification } from "../models/app-notification";
import { Bill } from "../models/bill";
import { GroupTraining } from "../models/group-training";
import { Gym } from "../models/gym";
import { Machine } from "../models/machines";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { Member } from "../models/member";
import { MemberParticipate } from "../models/member-participate";
import { Product } from "../models/product";
import { Trainer } from "../models/trainer";
const { Op } = require("sequelize");

/** Read-only queries behind GET /api/dashboard/summary and GET /api/maintenance/status. Every query is scoped by gymId. */
@injectable()
export class DashboardRepository {
  public getGym = async (gymId: number): Promise<Gym | null> => {
    return await Gym.findOne({ where: { id: gymId }, attributes: ["id", "name"] });
  };

  public countMembers = async (gymId: number): Promise<number> => {
    return await Member.count({ where: { gymId: gymId } });
  };

  public countActiveMembers = async (gymId: number): Promise<number> => {
    return await Member.count({ where: { gymId: gymId, isActive: true } });
  };

  public getMembersJoinedBetween = async (gymId: number, from: Date, to: Date): Promise<Member[]> => {
    return await Member.findAll({
      attributes: ["id", "joinDate"],
      where: { gymId: gymId, joinDate: { [Op.gte]: from, [Op.lt]: to } },
    });
  };

  public getActiveMembersEndingBetween = async (gymId: number, from: Date, to: Date): Promise<Member[]> => {
    return await Member.findAll({
      where: {
        gymId: gymId,
        isActive: true,
        endOfMembershipDate: { [Op.gte]: from, [Op.lt]: to },
      },
      order: [["endOfMembershipDate", "ASC"]],
    });
  };

  public getTrainingsBetween = async (gymId: number, from: Date, to: Date): Promise<GroupTraining[]> => {
    return await GroupTraining.findAll({
      attributes: ["id", "startTime", "description", "trainerId"],
      where: { gymId: gymId, startTime: { [Op.gte]: from, [Op.lt]: to } },
      order: [["startTime", "ASC"]],
    });
  };

  public getTrainers = async (gymId: number, ids: number[]): Promise<Trainer[]> => {
    if (!ids.length) {
      return [];
    }
    return await Trainer.findAll({
      attributes: ["id", "firstName", "lastName"],
      where: { gymId: gymId, id: ids },
    });
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

  public getBillsBetween = async (gymId: number, from: Date, to: Date): Promise<Bill[]> => {
    return await Bill.findAll({
      attributes: ["id", "totalCost", "quantity", "createdAt"],
      where: { gymId: gymId, createdAt: { [Op.gte]: from, [Op.lt]: to } },
    });
  };

  public getActiveJobsEndingAfter = async (gymId: number, from: Date): Promise<MachineScheduledJob[]> => {
    return await MachineScheduledJob.findAll({
      where: { gymId: gymId, isActive: true, endTime: { [Op.gte]: from } },
    });
  };

  public getMachinesBySerial = async (gymId: number, serialNumbers: string[]): Promise<Machine[]> => {
    if (!serialNumbers.length) {
      return [];
    }
    return await Machine.findAll({
      attributes: ["id", "name", "serialNumber"],
      where: { gymId: gymId, serialNumber: serialNumbers },
    });
  };

  /** Open (not marked Done) alerts created before `before`. Done deletes the row. */
  public getOpenNotificationsBefore = async (gymId: number, before: Date): Promise<AppNotification[]> => {
    return await AppNotification.findAll({
      attributes: ["id", "content"],
      where: { gymId: gymId, seen: false, createdAt: { [Op.lt]: before } },
    });
  };

  /** Every scheduled job of the gym, active or not. */
  public getAllJobs = async (gymId: number): Promise<MachineScheduledJob[]> => {
    return await MachineScheduledJob.findAll({ where: { gymId: gymId } });
  };

  /** All open (not marked Done) alerts of the gym. */
  public getOpenNotifications = async (gymId: number): Promise<AppNotification[]> => {
    return await AppNotification.findAll({
      attributes: ["id", "content", "targetObjectId", "createdAt"],
      where: { gymId: gymId, seen: false },
    });
  };

  public getLowStockProducts = async (gymId: number, maxQuantity: number, limit: number): Promise<Product[]> => {
    return await Product.findAll({
      attributes: ["id", "name", "categoryID", "price", "quantity"],
      where: { gymId: gymId, quantity: { [Op.lte]: maxQuantity } },
      order: [
        ["quantity", "ASC"],
        ["name", "ASC"],
      ],
      limit: limit,
    });
  };
}
