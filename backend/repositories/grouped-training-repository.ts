import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { GroupTraining } from "../models/group-training";
import { MemberParticipate } from "../models/member-participate";
const { Op } = require("sequelize");

@injectable()
export class GroupedTraingingRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public async getAll(gymId: number): Promise<GroupTraining[]> {
    return await GroupTraining.findAll({ where: { gymId: gymId } });
  }

  public async getById(
    id: number,
    gymId: number,
    transaction?: Transaction
  ): Promise<GroupTraining> {
    return await GroupTraining.findOne({
      where: { [Op.and]: [{ gymId: gymId, id: id }] },
      transaction: transaction,
    });
  }

  public async save(
    groupTraining: GroupTraining,
    transaction?: Transaction
  ): Promise<GroupTraining> {
    const startTimeMinusOneHour: Date = new Date(
      AppUtils.removeHoursFromDate(groupTraining.startTime, 1)
    );

    const groupTrainingInDB = await GroupTraining.findOne({
      where: {
        [Op.and]: [
          {
            startTime: {
              [Op.gt]: new Date(startTimeMinusOneHour),
              [Op.lte]: new Date(groupTraining.startTime),
            },
            gymId: groupTraining.gymId,
            trainerId: groupTraining.trainerId,
          },
        ],
      },
      transaction: transaction,
    });

    if (AppUtils.hasValue(groupTrainingInDB)) {
      throw new AlreadyExistError(
        `Group Training with id ${groupTrainingInDB.id} allready exist`
      );
    }

    this.logger.info(
      `Creating group training: '${JSON.stringify(groupTraining)}'`
    );

    const createdGroupTraining = await GroupTraining.create(groupTraining, {
      transaction: transaction,
    });

    for (let member of groupTraining.members) {
      let memberParticipate: MemberParticipate = {
        groupTrainingID: createdGroupTraining.id,
        memberID: member.id,
      } as MemberParticipate;
      // save to the members participants table (many-to-many)
      await MemberParticipate.create(memberParticipate, {
        transaction: transaction,
      });
    }

    createdGroupTraining.members = groupTraining.members;

    this.logger.info(
      `created group training with id: ${createdGroupTraining.id}`
    );

    return createdGroupTraining;
  }

  public update = async (
    groupTraining: GroupTraining,
    transaction?: Transaction
  ): Promise<GroupTraining> => {
    const startTimeMinusOneHour: Date = new Date(
      AppUtils.removeHoursFromDate(groupTraining.startTime, 1)
    );

    let groupTrainingInDB = await GroupTraining.findOne({
      where: {
        [Op.and]: [
          {
            id: groupTraining.id,
            gymId: groupTraining.gymId,
            trainerId: groupTraining.trainerId,
          },
        ],
      },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(groupTrainingInDB)) {
      throw new NotFoundErr(
        `Group Training with ${JSON.stringify(groupTraining)} was not fount`
      );
    }

    let groupTrainingAtTheSameTimeInDB = await GroupTraining.findOne({
      where: {
        [Op.and]: [
          {
            startTime: {
              [Op.gt]: new Date(startTimeMinusOneHour),
              [Op.lte]: new Date(groupTraining.startTime),
            },
            gymId: groupTraining.gymId,
            trainerId: groupTraining.trainerId,
          },
        ],
      },
      transaction: transaction,
    });

    if (AppUtils.hasValue(groupTrainingAtTheSameTimeInDB)) {
      throw new NotFoundErr(
        `Group Training with ${JSON.stringify(
          groupTraining
        )} cannot be updated because start time not available`
      );
    }

    this.logger.info(`Updating Group Training with id '${groupTraining.id}'`);

    const updatedGroupTraining: GroupTraining = await groupTrainingInDB.update(
      groupTraining
    );

    await MemberParticipate.destroy({
      where: { groupTrainingID: groupTraining.id },
      transaction: transaction,
    });
    // also update the relationship table MemberParticipate (the forign keys)
    for (let member of groupTraining.members) {
      let memberParticipate: MemberParticipate = {
        groupTrainingID: updatedGroupTraining.id,
        memberID: member.id,
      } as MemberParticipate;
      // save to the members participants table (many-to-many)
      await MemberParticipate.create(memberParticipate, {
        transaction: transaction,
      });
    }

    updatedGroupTraining.members = groupTraining.members;

    this.logger.info(
      `Updated Group Training '${JSON.stringify(updatedGroupTraining)}'`
    );

    return updatedGroupTraining;
  };

  public delete = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: GroupTraining = await GroupTraining.findOne({
      where: { id: id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete Group Training with id: ${id} because it is not found`
      );
    }

    await GroupTraining.destroy({
      where: { id: id },
      transaction: transaction,
    });

    await MemberParticipate.destroy({
      where: { groupTrainingID: id },
      transaction: transaction,
    });
  };
}
