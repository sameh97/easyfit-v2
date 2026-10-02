import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { Gym } from "../models/gym";
import { GymRepository } from "../repositories/gym-repository";
import { AppDBConnection } from "./../config/database";

@injectable()
export class GymService {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection,
    @inject(GymRepository) private gymRepo: GymRepository
  ) {}

  public async create(gym: Gym): Promise<Gym> {
    let transaction: Transaction = null;
    try {
      // create new transaction
      transaction = await this.appDBConnection.createTransaction();

      // create gym 
      const createdGym = await this.gymRepo.save(gym, transaction);

      await transaction.commit();

      this.logger.info(`created gym with id ${createdGym.id}`);

      return createdGym;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating gym: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  }

  public getAll = async (): Promise<Gym[]> => {
    // get all gyms
    const gyms = await this.gymRepo.getAll();
    this.logger.info(`Returning ${gyms.length} gyms`);
    return gyms;
  };

  public update = async (gym: Gym): Promise<Gym> => {
    let transaction: Transaction = null;
    try {
      // create new transaction
      transaction = await this.appDBConnection.createTransaction();

      //update gym
      const updatedGym = await this.gymRepo.update(gym, transaction);

      await transaction.commit();

      this.logger.info(`updated gym with name ${updatedGym.name}`);

      return updatedGym;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      this.logger.error(
        `cannot update gym, error ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  public delete = async (id: number): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting gym with id: ${id}`);
      // create new transaction
      transaction = await this.appDBConnection.createTransaction();

      // delete gym
      await this.gymRepo.delete(id, transaction);

      //  TODO: remove the related user to this gym
      transaction.commit();

      this.logger.info(`Gym with id ${id} has been deleted`);
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while deleting gym: error: ${AppUtils.getFullException(
          error
        )}`,
        error
      );
      throw error;
    }
  };
}
