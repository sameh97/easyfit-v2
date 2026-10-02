import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFound } from "../exeptions/notFound-exeption";
import { Trainer } from "../models/trainer";
const { Op } = require("sequelize");

@injectable()
export class TrainerRepository {
  constructor(@inject(Logger) private logger: Logger) {}
  public async getAll(gymId: number): Promise<Trainer[]> {
    return await Trainer.findAll({ where: { gymId: gymId } });
  }

  public async getById(
    gymId: number,
    trainerId: number,
    transaction?: Transaction
  ): Promise<Trainer> {
    return await Trainer.findOne({
      where: { [Op.and]: [{ gymId: gymId, id: trainerId }] },
      transaction: transaction,
    });
  }

  public async save(
    trainer: Trainer,
    transaction?: Transaction
  ): Promise<Trainer> {
    const trainerInDB = await Trainer.findOne({
      where: { email: trainer.email },
      transaction: transaction,
    });

    if (AppUtils.hasValue(trainerInDB)) {
      throw new AlreadyExistError(
        `trainer with email ${trainerInDB.email} allready exist`
      );
    }

    this.logger.info(`Creating trainer with email '${trainer.email}'`);

    const createdTrainer = await Trainer.create(trainer, {
      transaction: transaction,
    });
    this.logger.info(`created member ${JSON.stringify(createdTrainer)}`);

    return createdTrainer;
  }

  public update = async (
    trainer: Trainer,
    transaction?: Transaction
  ): Promise<Trainer> => {
    let trainerInDB = await Trainer.findOne({
      where: { email: trainer.email },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(trainerInDB)) {
      throw new NotFound(`trainer with email ${trainer.email} was not found`);
    }

    this.logger.info(`Updating trainer with email '${trainer.email}' `);

    const UpdatedTrainer = await trainerInDB.update(trainer);

    this.logger.info(`Updated trainer '${JSON.stringify(UpdatedTrainer)}'`);

    return UpdatedTrainer;
  };

  public delete = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: Trainer = await Trainer.findOne({
      where: { id: id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFound(`trainer with email ${id} was not found`);
    }

    await Trainer.destroy({
      where: { id: id },
      transaction: transaction,
    });
  };
}
