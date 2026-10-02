import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AppDBConnection } from "../config/database";
import { InputError } from "../exeptions/input-error";
import { Bill } from "../models/bill";
import { Product } from "../models/product";
import { ProductsRepository } from "../repositories/products-repository";

@injectable()
export class ProductsService {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(ProductsRepository) private productRepo: ProductsRepository,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection
  ) {}

  public create = async (product: Product): Promise<Product> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const createdProduct = await this.productRepo.save(product, transaction);

      await transaction.commit();

      this.logger.info(`created product with id ${createdProduct.id}`);

      return createdProduct;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating product: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  };

  public getAll = async (gymId: number): Promise<Product[]> => {
    const products: Product[] = await this.productRepo.getAll(gymId);
    this.logger.info(`Returning ${products.length} products`);
    return products;
  };

  public getAllBills = async (gymId: number): Promise<Bill[]> => {
    // get all receipts for gym
    const bills: Bill[] = await this.productRepo.getAllBills(gymId);
    this.logger.info(`Returning ${bills.length} bills`);
    return bills;
  };

  public soldProductsPeerMonth = async (gymId: number): Promise<any> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const productsSalesPeerMonth: number[] =
        await this.productRepo.soldProductsPeerMonth(gymId, transaction);

      await transaction.commit();

      this.logger.info(`Returning products sales peer month`);

      return productsSalesPeerMonth;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while retrieving products sales peer month: error: ${AppUtils.getFullException(
          error
        )}`
      );
      throw error;
    }
  };

  public getMonthlyIncome = async (gymId: number): Promise<any> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const monthlyIncome: number[] = await this.productRepo.getMonthlyIncome(
        gymId,
        transaction
      );

      await transaction.commit();

      this.logger.info(`Returning monthly income`);

      return monthlyIncome;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while retrieving monthly income: error: ${AppUtils.getFullException(
          error
        )}`
      );
      throw error;
    }
  };

  public createBill = async (bill: Bill): Promise<Bill> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const createdBill = await this.productRepo.createBill(bill, transaction);

      await transaction.commit();

      this.logger.info(`created bill with id ${createdBill.id}`);

      return createdBill;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating bill: error: ${AppUtils.getFullException(
          error
        )}`
      );
      throw error;
    }
  };

  public update = async (product: Product): Promise<Product> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const updatedProduct = await this.productRepo.update(
        product,
        transaction
      );

      await transaction.commit();

      this.logger.info(`updated product with id ${updatedProduct.id}`);

      return updatedProduct;
    } catch (err) {
      if (transaction) {
        transaction.rollback();
      }
      this.logger.error(
        `Error occurred while updating product: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  };

  public delete = async (id: number): Promise<void> => {
    if (!AppUtils.isInteger(id)) {
      throw new InputError(`Cannot delete product, the id must be an integer`);
    }

    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting product with id: ${id}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.productRepo.delete(id, transaction);

      await transaction.commit();

      this.logger.info(`Product with id ${id} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };

  public deleteBill = async (id: number): Promise<void> => {
    if (!AppUtils.isInteger(id)) {
      throw new InputError(`Cannot delete bill, the id must be an integer`);
    }

    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting bill with id: ${id}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.productRepo.deleteBill(id, transaction);

      await transaction.commit();

      this.logger.info(`Bill with id ${id} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };



  
}
