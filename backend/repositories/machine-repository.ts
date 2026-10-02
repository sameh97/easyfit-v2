import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { Machine } from "../models/machines";

@injectable()
export class MachinesRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public getAll = async (gymId: number): Promise<Machine[]> => {
    // get all from DB
    return await Machine.findAll({ where: { gymId: gymId } });
  };

  public getBySerialNumber = async (
    machineSerialNumber: number
  ): Promise<Machine> => {
    // find machien in DB by machineSerialNumber
    return await Machine.findOne({
      where: { serialNumber: machineSerialNumber },
    });
  };

  public save = async (
    machine: Machine,
    transaction?: Transaction
  ): Promise<Machine> => {
    // check if exist 
    const machineInDB = await Machine.findOne({
      where: { serialNumber: machine.serialNumber },
      transaction: transaction,
    });

    if (AppUtils.hasValue(machineInDB)) {
      throw new AlreadyExistError(
        `cannot create machine with id: ${machineInDB.id} because it already exists`
      );
    }

    this.logger.info(`creating machine with name ${machine.name}`);

    // create
    const createdMachine = await Machine.create(machine, {
      transaction: transaction,
    });

    this.logger.info(`created machine ${JSON.stringify(createdMachine)}`);

    return createdMachine;
  };

  public update = async (
    machine: Machine,
    transaction: Transaction
  ): Promise<Machine> => {
    const machineInDB = await Machine.findOne({
      where: { id: machine.id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(machineInDB)) {
      throw new NotFoundErr(
        `cannot update machine ${JSON.stringify(machine)}
         because its not found`
      );
    }

    const updatedMachine = await machineInDB.update(machine, {
      transaction: transaction,
    });

    this.logger.info(`updated machine ${JSON.stringify(updatedMachine)}`);

    return updatedMachine;
  };

  public delete = async (
    serialNumber: string,
    transaction?: Transaction
  ): Promise<void> => {
    const machineToDelete = await Machine.findOne({
      where: { serialNumber: serialNumber },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(machineToDelete)) {
      throw new NotFoundErr(
        `cannot delete machine with serial number ${serialNumber}
         because its not found`
      );
    }

    this.logger.info(`deleting machine with serial number ${serialNumber}`);

    await Machine.destroy({
      where: { serialNumber: serialNumber },
      transaction: transaction,
    });
  };
}
