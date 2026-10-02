import { inject, injectable } from "inversify";
import { AppNotification } from "../models/app-notification";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { Logger } from "./../common/logger";
import { NotFoundErr } from "../exeptions/not-found-error";
import sequelize = require("sequelize");

const { Op } = require("sequelize");
@injectable()
export class AppNotificationRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public async getAll(gymId: number): Promise<AppNotification[]> {
    return await AppNotification.findAll({
      where: { [Op.and]: [{ seen: false, gymId: gymId }] },
    });
  }

  public async getByMachineSerialNumber(
    gymId: number,
    machineSerialNumber: string
  ): Promise<AppNotification[]> {
    // get all by machineSerialNumber
    return await AppNotification.findAll({
      where: { gymId: gymId, targetObjectId: machineSerialNumber, seen: false },
    });
  }

  public save = async (
    appNotificationMessage: AppNotification,
    transaction?: Transaction
  ): Promise<AppNotification> => {
    this.logger.info(
      `Creating notification with id ${appNotificationMessage.id}`
    );

    const createdNotification = await AppNotification.create(
      appNotificationMessage,
      { transaction: transaction }
    );

    return createdNotification;
  };

  public update = async (
    appNotificationMessage: AppNotification,
    transaction?: Transaction
  ): Promise<AppNotification> => {
    // check if exists 
    let notificationInDB = await AppNotification.findOne({
      where: {
        id: appNotificationMessage.id,
      },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(notificationInDB)) {
      throw new NotFoundErr(
        `notification with content ${appNotificationMessage.content} was not fount`
      );
    }

    this.logger.info(
      `Updating notification with content '${appNotificationMessage.content}'`
    );
    // update notificationInDB
    const updatedNotification = await notificationInDB.update(
      appNotificationMessage
    );

    this.logger.info(
      `Updated notification '${JSON.stringify(updatedNotification)}'`
    );

    return updatedNotification;
  };

  public delete = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
    // check if exists 
    const toDelete: AppNotification = await AppNotification.findOne({
      where: { id: id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete notification: ${id} because it is not found`
      );
    }
    // delete from db
    await AppNotification.destroy({
      where: { id: id },
      transaction: transaction,
    });
  };

  public deleteByGymId = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: AppNotification[] = await AppNotification.findAll({
      where: { gymId: gymId },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete notifications where gym id: ${gymId} because it is not found`
      );
    }

    await AppNotification.destroy({
      where: { gymId: gymId },
      transaction: transaction,
    });
  };

  public deleteByTargetObjectId = async (
    targetObjectId: string,
    gymId: number,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: AppNotification = await AppNotification.findOne({
      where: { [Op.and]: [{ targetObjectId: targetObjectId, gymId: gymId }] },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      return;
    }

    await AppNotification.destroy({
      where: { [Op.and]: [{ targetObjectId: targetObjectId, gymId: gymId }] },
      transaction: transaction,
    });
  };

  public deleteAllByTargetObjectId = async (
    targetObjectId: string,
    gymId: number,
    transaction?: Transaction
  ): Promise<void> => {
    // check if exists
    const toDelete: AppNotification[] = await AppNotification.findAll({
      where: { [Op.and]: [{ targetObjectId: targetObjectId, gymId: gymId }] },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete notifications: ${targetObjectId} because it is not found`
      );
      return;
    }

    await AppNotification.destroy({
      where: { [Op.and]: [{ targetObjectId: targetObjectId, gymId: gymId }] },
      transaction: transaction,
    });
  };

  public getAllGrouped = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<any[]> => {
    // get all notifications and group them by targetObjectId
    // targetObjectId = machineSerialNumber in machine notifications case,
    // this will retreve notifications count for each machine
    return await AppNotification.findAll({
      attributes: [
        "targetObjectId",

        [sequelize.fn("COUNT", sequelize.col("targetObjectId")), "cnt"],
      ],
      group: ["targetObjectId"],
      where: { [Op.and]: [{ seen: false, gymId: gymId }] },
    });
  };
}
