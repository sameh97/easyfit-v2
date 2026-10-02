import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AppDBConnection } from "./../config/database";
import { GroupedTraingingRepository } from "../repositories/grouped-training-repository";
import { MembersRepository } from "../repositories/members-repository";
import { GroupTraining } from "../models/group-training";
import { Member } from "./../models/member";
import { MemberParticipate } from "../models/member-participate";

@injectable()
export class GroupTrainingService {
  constructor(
    @inject(GroupedTraingingRepository)
    private groupedTraingingRepository: GroupedTraingingRepository,
    @inject(Logger) private logger: Logger,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection,
    @inject(MembersRepository) private membersRepository: MembersRepository
  ) {}

  public async create(groupTraining: GroupTraining): Promise<GroupTraining> {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const createdGroupTraining = await this.groupedTraingingRepository.save(
        groupTraining,
        transaction
      );

      await transaction.commit();

      this.logger.info(
        `created group Training with id  ${createdGroupTraining.id}`
      );

      return createdGroupTraining;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating group Training: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  }

  public async getAll(gymId: number): Promise<GroupTraining[]> {
    const groupTrainings: GroupTraining[] =
      await this.groupedTraingingRepository.getAll(gymId);
    for (let training of groupTrainings) {
      const membersFromDB: Member[] = await this.getMembersByTrainingId(
        training.id
      );

      training.members = membersFromDB;
    }

    this.logger.info(`Returning ${groupTrainings.length} Group trainings`);
    return groupTrainings;
  }

  public getById = async (
    gymId: number,
    id: number
  ): Promise<GroupTraining> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const groupTraining: GroupTraining =
        await this.groupedTraingingRepository.getById(id, gymId, transaction);

      const membersFromDB: Member[] = await this.getMembersByTrainingId(
        groupTraining.id
      );

      groupTraining.members = membersFromDB;

      await transaction.commit();

      this.logger.info(`Returning group training with id ${groupTraining.id}`);

      return groupTraining;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Cannot get group training: error: ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  private getMembersByTrainingId = async (
    groupTrainingID: number
  ): Promise<Member[]> => {
    const memberParticipate: MemberParticipate[] =
      await MemberParticipate.findAll({
        where: { groupTrainingID: groupTrainingID },
      });

    let memberIdsArray: number[] = [];

    for (let element of memberParticipate) {
      memberIdsArray.push(element.memberID);
    }

    const members: Member[] = await this.membersRepository.getByID(
      memberIdsArray
    );

    return members;
  };

  public update = async (
    groupTraining: GroupTraining
  ): Promise<GroupTraining> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const updatedGroupTraining: GroupTraining =
        await this.groupedTraingingRepository.update(
          groupTraining,
          transaction
        );

      await transaction.commit();

      this.logger.info(
        `updated group Training with id ${updatedGroupTraining.id}`
      );

      return updatedGroupTraining;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while updating group Training: error: ${AppUtils.getFullException(
          err
        )}`,
        err
      );
      throw err;
    }
  };

  public delete = async (id: number): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting group Training with id ${id}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.groupedTraingingRepository.delete(id, transaction);

      await transaction.commit();

      this.logger.info(`Group Training with id ${id} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };
}
