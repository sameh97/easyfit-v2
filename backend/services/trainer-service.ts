import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AppDBConnection } from "../config/database";
import { InputError } from "../exeptions/input-error";
import { Trainer } from "../models/trainer";
import { TrainerRepository } from "../repositories/trainer-repository";

@injectable()
export class TrainerService {
  constructor(
    @inject(TrainerRepository) private trainerRepository: TrainerRepository,
    @inject(Logger) private logger: Logger,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection
  ) {}
  public async create(trainer: Trainer): Promise<Trainer> {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();
      const createdTrainer = await this.trainerRepository.save(
        trainer,
        transaction
      );
      await transaction.commit();

      this.logger.info(`created trainer with id ${createdTrainer.id}`);

      return createdTrainer;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }

      this.logger.error(
        `Error occurred while creating trainer: error :${AppUtils.getFullException(
          err
        )}`
      );

      throw err;
    }
  }

  public async getAll(gymId: number): Promise<Trainer[]> {
    const trainers = await this.trainerRepository.getAll(gymId);
    this.logger.info(`Returning ${trainers.length} trainers.`);
    return trainers;
  }

  public getById = async (
    gymId: number,
    trainerId: number
  ): Promise<Trainer> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const trainerFromDB: Trainer = await this.trainerRepository.getById(
        gymId,
        trainerId,
        transaction
      );

      await transaction.commit();

      return trainerFromDB;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while retrieving trainer: error: ${AppUtils.getFullException(
          error
        )}`
      );
      throw error;
    }
  };

  public update = async (trainer: Trainer): Promise<Trainer> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const UpdatedTrainer = await this.trainerRepository.update(
        trainer,
        transaction
      );

      await transaction.commit();

      this.logger.info(`update trainer with email ${UpdatedTrainer.email}`);

      return UpdatedTrainer;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while updating trainer: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  };

  public delete = async (id: number): Promise<void> => {
    if (!AppUtils.isInteger(id)) {
      throw new InputError(`Cannot delete trainer, the id must be an integer`);
    }

    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleteing trainer with id: ${id}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.trainerRepository.delete(id, transaction);

      await transaction.commit();

      this.logger.info(`Trainer with id ${id} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };
}
