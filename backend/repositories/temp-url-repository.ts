import { inject, injectable } from "inversify";
import { any } from "joi";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { Catalog } from "../models/catalog";
import { TempUrl } from "../models/temp-url";
const { Op } = require("sequelize");
@injectable()
export class TempUrlRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public async getAll(gymId: number): Promise<TempUrl[]> {
    return await TempUrl.findAll({ where: { gymId: gymId } });
  }

  public async getByUUID(uuid: string): Promise<TempUrl> {
    return await TempUrl.findOne({
      where: { uuid: uuid },
    });
  }

  public async save(
    tempUrl: TempUrl,
    transaction?: Transaction
  ): Promise<TempUrl> {
    const tempUrlInDB = await TempUrl.findOne({
      where: { uuid: tempUrl.uuid },
      transaction: transaction,
    });

    if (AppUtils.hasValue(tempUrlInDB)) {
      throw new AlreadyExistError(
        `Temporary URL with uuid ${tempUrlInDB.uuid} allready exist`
      );
    }

    this.logger.info(`Creating Temporary URL with uuid '${tempUrl.uuid}'`);

    const createdTempUrl = await TempUrl.create(tempUrl, {
      transaction: transaction,
    });

    for (let product of tempUrl.products) {
      let catlog: Catalog = {
        productID: product.id,
        tempUrlID: tempUrl.uuid,
      } as Catalog;
      // save in the many to many relation table (many products to many catalogs)
      await Catalog.create(catlog, { transaction: transaction });
    }

    this.logger.info(`created Temporary URL ${JSON.stringify(createdTempUrl)}`);

    return createdTempUrl;
  }

  public update = async (
    tempUrl: TempUrl,
    transaction?: Transaction
  ): Promise<TempUrl> => {
    let tempUrlInDB = await TempUrl.findOne({
      where: { uuid: tempUrl.uuid },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(tempUrlInDB)) {
      throw new NotFoundErr(
        `Temporary URL with uuid  ${tempUrl.uuid} was not fount`
      );
    }

    this.logger.info(`Updating Temporary URL with uuid '${tempUrl.uuid}'`);

    const updatedTempUrl: TempUrl = await tempUrlInDB.update(tempUrl);

    await Catalog.destroy({
      where: { tempUrlID: tempUrl.uuid },
      transaction: transaction,
    });
    // also update the relationship table (the forign keys)
    for (let product of tempUrl.products) {
      let catlog: Catalog = {
        productID: product.id,
        tempUrlID: tempUrl.uuid,
      } as Catalog;

      await Catalog.create(catlog, { transaction: transaction });
    }

    updatedTempUrl.products = tempUrl.products;

    this.logger.info(
      `Updated Temporary URL '${JSON.stringify(updatedTempUrl)}'`
    );

    return updatedTempUrl;
  };

  public delete = async (
    uuid: string,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: TempUrl = await TempUrl.findOne({
      where: { uuid: uuid },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete Temporary URL with uuid: ${uuid} because it is not found`
      );
    }

    await TempUrl.destroy({
      where: { uuid: uuid },
      transaction: transaction,
    });
  };
}
