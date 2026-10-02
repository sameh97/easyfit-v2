import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { ProductDtoMapper } from "../common/dto-mapper/products-dto-mapper";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { Bill } from "../models/bill";
import { Product } from "../models/product";
import sequelize = require("sequelize");
const { Op } = require("sequelize");
@injectable()
export class ProductsRepository {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(ProductDtoMapper) private productDtoMapper: ProductDtoMapper
  ) {}

  public getAll = async (gymId: number): Promise<Product[]> => {
    return await Product.findAll({ where: { gymId: gymId } });
  };

  public getByIDs = async (idsArray: number[]): Promise<Product[]> => {
    // get all the products by ids array
    return await Product.findAll({ where: { id: idsArray } });
  };

  public save = async (
    product: Product,
    transaction?: Transaction
  ): Promise<Product> => {
    const productInDB = await Product.findOne({
      where: { code: product.code }, // TODO: check by something else than id
      transaction: transaction,
    });
    if (AppUtils.hasValue(productInDB)) {
      throw new AlreadyExistError(
        `Product with code ${productInDB.code} already exist`
      );
    }

    this.logger.info(`Creating product with code ${product.code}`);

    const createdProduct = await Product.create(product, {
      transaction: transaction,
    });

    return createdProduct;
  };

  public createBill = async (
    bill: Bill,
    transaction?: Transaction
  ): Promise<Bill> => {
    // create receipt
    const productInDB = await Product.findOne({
      where: { id: bill.productID },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(productInDB)) {
      throw new NotFoundErr(
        `Cannot create bill because product with id ${bill.productID} is not found`
      );
    }

    const productToUpdate: Product =
      this.productDtoMapper.asEntity(productInDB);

    if (productToUpdate.quantity - bill.quantity < 0) {
      throw new NotFoundErr(`Required quantity is not available`);
    }
    
    productToUpdate.quantity -= bill.quantity;

    const updatedProduct = await this.update(productToUpdate, transaction);

    const createdBill = await Bill.create(bill, { transaction: transaction });

    return createdBill;
  };

  public getAllBills = async (gymId: number): Promise<Bill[]> => {
    return await Bill.findAll({ where: { gymId: gymId } });
  };

  public update = async (
    product: Product,
    transaction?: Transaction
  ): Promise<Product> => {
    const productInDB = await Product.findOne({ where: { id: product.id } });

    if (!AppUtils.hasValue(productInDB)) {
      throw new NotFoundErr(
        `Cannot update Product with id ${product.id} because its not found`
      );
    }

    this.logger.info(`Updating product with id ${productInDB.id}`);

    const updatedProduct = await productInDB.update(product, {
      transaction: transaction,
    });

    this.logger.info(`updated product ${JSON.stringify(updatedProduct)}`);

    return updatedProduct;
  };

  public delete = async (id: number, transaction?: Transaction) => {
    const toDelete = await Product.findOne({ where: { id: id } });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete Product with id ${id} because its not found`
      );
    }

    await Product.destroy({ where: { id: id }, transaction: transaction });
  };

  public deleteBill = async (id: number, transaction?: Transaction) => {
    const toDelete = await Bill.findOne({ where: { id: id } });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete bill with id ${id} because its not found`
      );
    }

    await Bill.destroy({ where: { id: id }, transaction: transaction });
  };

  public soldProductsPeerMonth = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<number[]> => {
    const currentTime = new Date();
    let year = currentTime.getFullYear();
    let result: number[] = [];

    for (let month = 1; month <= 12; month++) {
      let nextMonth: number = month + 1;
      let nextYear: number = year;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = nextYear + 1;
      }

      const sumOfSoldProductsInMonth = await Bill.findAll({
        attributes: [[sequelize.fn("sum", sequelize.col("quantity")), "total"]],
        where: {
          [Op.and]: [
            {
              createdAt: {
                [Op.gte]: new Date(`${year}-${month}-01`),
                [Op.lt]: new Date(`${nextYear}-${nextMonth}-01`),
              },
              gymId: gymId,
            },
          ],
        },
        transaction: transaction,
      });

      const bill: any = sumOfSoldProductsInMonth[0];
      const totalSalesInMonth: number = Number(bill.dataValues.total);

      result.push(totalSalesInMonth);
    }

    return result;
  };

  public getMonthlyIncome = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<number[]> => {
    const currentTime = new Date();
    let year = currentTime.getFullYear();
    let result: number[] = [];

    for (let month = 1; month <= 12; month++) {
      let nextMonth: number = month + 1;
      let nextYear: number = year;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = nextYear + 1;
      }

      const monthlyIncome = await Bill.findAll({
        attributes: [
          [sequelize.fn("sum", sequelize.col("totalCost")), "totalIncome"],
        ],
        where: {
          [Op.and]: [
            {
              createdAt: {
                [Op.gte]: new Date(`${year}-${month}-01`),
                [Op.lt]: new Date(`${nextYear}-${nextMonth}-01`),
              },
              gymId: gymId,
            },
          ],
        },
        transaction: transaction,
      });

      const income: any = monthlyIncome[0];
      const incomeToStore: number = Number(income.dataValues.totalIncome);

      result.push(incomeToStore);
    }

    return result;
  };
}
