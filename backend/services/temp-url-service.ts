import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { TempUrl } from "../models/temp-url";
import { TempUrlRepository } from "../repositories/temp-url-repository";
import { AppDBConnection } from "./../config/database";
import { v4 as uuidv4 } from "uuid";
import { Catalog } from "../models/catalog";
import { Product } from "../models/product";
import { ProductsRepository } from "../repositories/products-repository";
import { NotFound } from "../exeptions/notFound-exeption";
import { OutOfDateError } from "../exeptions/out-of-date-error";
import { parse } from "node-html-parser";
import { catalogTemplate } from "./easyfit-catalog-template";
import { catalogNotFoundTemplate } from "../templates/catalog-not-found-template";
import { catalogOutOfDateTemplate } from "../templates/catalog-out-of-date";
const wbm = require("wbm");

@injectable()
export class TempUrlService {
  constructor(
    @inject(TempUrlRepository) private tempUrlRepository: TempUrlRepository,
    @inject(Logger) private logger: Logger,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection,
    @inject(ProductsRepository) private productsRepository: ProductsRepository
  ) {}

  public async create(tempUrl: TempUrl): Promise<TempUrl> {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      // generate a uniqe uuid for the catalog url
      tempUrl.uuid = uuidv4();

      const createdTempUrl = await this.tempUrlRepository.save(
        tempUrl,
        transaction
      );

      await transaction.commit();

      this.logger.info(
        `created Temporary URL with uuid  ${createdTempUrl.uuid}`
      );

      return createdTempUrl;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating Temporary URL: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  }

  public async getAll(gymId: number): Promise<TempUrl[]> {
    const tempUrls: TempUrl[] = await this.tempUrlRepository.getAll(gymId);
    for (let url of tempUrls) {
      const productsFromDB: Product[] = await this.getCatalogProductsByUUID(
        url.uuid
      );

      url.products = productsFromDB;
    }

    this.logger.info(`Returning ${tempUrls.length} Temporary URL's`);
    return tempUrls;
  }

  public async getByUUID(uuid: string): Promise<Product[]> {
    try {
      const tempUrl: TempUrl = await this.tempUrlRepository.getByUUID(uuid);

      if (!AppUtils.hasValue(tempUrl)) {
        throw new NotFound(`Catalog URL is not found`);
      }

      let dateNow: Date = new Date();

      let endDate: Date = AppUtils.addDays(
        tempUrl.createdAt,
        tempUrl.durationDays
      );
      // if the catalog duration expired, throw error
      if (dateNow.getTime() > endDate.getTime()) {
        throw new OutOfDateError(`Catalog is no longer available`);
      }
      const products: Product[] = await this.getCatalogProductsByUUID(uuid);
      // return all the products of the catalog
      this.logger.info(`Returning Temporary URL ${tempUrl.uuid}`);
      return products;
    } catch (err) {
      this.logger.error(
        `Error occurred while getting Temporary URL: error: ${AppUtils.getFullException(
          err
        )}`,
        err
      );
      throw err;
    }
  }

  private getCatalogProductsByUUID = async (
    uuid: string
  ): Promise<Product[]> => {
    // get all the products for specfic catalog, by its url uuid
    const catalog: Catalog[] = await Catalog.findAll({
      where: { tempUrlID: uuid },
    });

    let productIDS: number[] = [];

    for (let item of catalog) {
      productIDS.push(item.productID);
    }

    const products: Product[] = await this.productsRepository.getByIDs(
      productIDS
    );

    return products;
  };

  public buildCatalogOutOfDateHtml = async (): Promise<string> => {
    const root = parse(catalogOutOfDateTemplate);

    return root.toString();
  };

  public buildCatalogNotFoundHtml = async (): Promise<string> => {
    const root = parse(catalogNotFoundTemplate);

    return root.toString();
  };

  public buildCatalogHtml = async (products: Product[]): Promise<string> => {
    const root = parse(catalogTemplate);
    // append products to html div
    for (let product of products) {
      const pro = parse(`<div class="card">
      <div class="item-flex-container">
      <div><img style="width:100px;hight:100px" src="${product.imgUrl}"></div>
      <div class="dd">
      <h2>${product.name}</h2>
      <p><b>price:</b> ${product.price}</p>
      <p><b>description:</b> ${AppUtils.addBreakLinesToString(
        product.description
      )}</p>
     
      </div>
      </div>
      </div>
        `);

      root.querySelector("#easyfit-catalog-container").appendChild(pro);
    }
    return root.toString();
  };

  public update = async (tempUrl: TempUrl): Promise<TempUrl> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const updatedTempUrl: TempUrl = await this.tempUrlRepository.update(
        tempUrl,
        transaction
      );

      await transaction.commit();

      this.logger.info(
        `updated Temporary URL with uuid ${updatedTempUrl.uuid}`
      );

      return updatedTempUrl;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while updating Temporary URL: error: ${AppUtils.getFullException(
          err
        )}`,
        err
      );
      throw err;
    }
  };

  public delete = async (uuid: string): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting Temporary URL with uuid ${uuid}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.tempUrlRepository.delete(uuid, transaction);

      await transaction.commit();

      this.logger.info(`Temporary URL with uuid ${uuid} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };

  public sendWhatsApp = async (details: any): Promise<any> => {
    // send whatsApp message:
    wbm
      .start({ showBrowser: true, qrCodeData: true, session: false })
      .then(async (qrCodeData) => {
        const phones = details.phones;
        const message = details.message;
        await wbm.waitQRCode();
        const send = await wbm.send(phones, message);
        await wbm.end();

        return send;
      })
      .catch((err) => {
        this.logger.error(
          `Error occurred while sending whatsApp: error: ${AppUtils.getFullException(
            err
          )}`,
          err
        );
        throw err;
      });
  };
}
