import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { Gym } from "../models/gym";

@injectable()
export class GymRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public async save(gym: Gym, transaction?: Transaction): Promise<Gym> {
    //TODO: check if phone is a good key for searching for gym in DB
    //check if the gym exist 
    const gymInDB = await Gym.findOne({
      where: { phone: gym.phone },
    });

    if (AppUtils.hasValue(gymInDB)) {
      throw new AlreadyExistError(
        `gym with name '${gymInDB.name} allready exist`
      );
    }

    this.logger.info(`Creating gym : '${gym}'`);
    // create new gym in DB
    const createdGym = await Gym.create(gym);

    this.logger.info(`created gym ${JSON.stringify(createdGym)}`);

    return createdGym;
  }

  public async getAll(): Promise<Gym[]> {
    return await Gym.findAll({});
  }

  public update = async (gym: Gym, transaction?: Transaction): Promise<Gym> => {
     //check if the gym exist 
    let gymInDB = await Gym.findOne({
      where: { id: gym.id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(gymInDB)) {
      throw new NotFoundErr(`gym with id ${gym.id} was not fount`);
    }

    this.logger.info(`Updating gym with id '${gym.id}'`);

    const updatedGym = await gymInDB.update(gym);

    this.logger.info(`Updated gym '${JSON.stringify(updatedGym)}'`);

    return updatedGym;
  };

  public delete = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
     //check if the gym exist 
    const toDelete: Gym = await Gym.findOne({
      where: { id: id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(`Cannot delete gym: ${id} because it is not found`);
    }

    await Gym.destroy({
      where: { id: id },
      transaction: transaction,
    });
  };
}
