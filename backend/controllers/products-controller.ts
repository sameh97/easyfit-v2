import { inject, injectable } from "inversify";
import { ProductDtoMapper } from "../common/dto-mapper/products-dto-mapper";
import { Logger } from "../common/logger";
import { Bill } from "../models/bill";
import { ProductDto } from "../models/dto/product-dto";
import { Product } from "../models/product";
import { ProductsService } from "../services/products-service";

@injectable()
export class ProductsController {
  constructor(
    @inject(ProductsService) private productsService: ProductsService,
    @inject(ProductDtoMapper) private productDtoMapper: ProductDtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      const products: Product[] = await this.productsService.getAll(
        req.query.gymId
      );

      const productDto: ProductDto[] = products.map((product) =>
        this.productDtoMapper.asDto(product)
      );

      next(productDto);
    } catch (err) {
      this.logger.error(`cannot get all products`, err);
      next(err);
    }
  };

  public soldProductsPeerMonth = async (req: any, res: any, next: any) => {
    try {
      const productsSalesPeerMonth: number[] =
        await this.productsService.soldProductsPeerMonth(req.query.gymId);

      next(productsSalesPeerMonth);
    } catch (error) {
      this.logger.error(
        `Cannot retrive sold products peer month ${JSON.stringify(req.body)}`,
        error
      );
      next(error);
    }
  };

  public getMonthlyIncome = async (req: any, res: any, next: any) => {
    try {
      const monthlyIncomeArray: number[] =
        await this.productsService.getMonthlyIncome(req.query.gymId);

      next(monthlyIncomeArray);
    } catch (error) {
      this.logger.error(
        `Cannot get monthly income ${JSON.stringify(req.body)}`,
        error
      );
      next(error);
    }
  };

  public createProduct = async (req: any, res: any, next: any) => {
    let productToCreate: Product = null;
    try {
      productToCreate = this.productDtoMapper.asEntity(req.body);

      const createdProduct: Product = await this.productsService.create(
        productToCreate
      );

      res.status(201);

      next(this.productDtoMapper.asDto(createdProduct));
    } catch (err) {
      this.logger.error(
        `Cannot create product ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public createBill = async (req: any, res: any, next: any) => {
    let billToCreate: Bill = null;
    try {
      billToCreate = req.body; //TODO: make dto

      const createdBill: Bill = await this.productsService.createBill(
        billToCreate
      );

      res.status(201);
      next(createdBill);
    } catch (error) {
      this.logger.error(
        `Cannot create bill ${JSON.stringify(req.body)}`,
        error
      );
      next(error);
    }
  };

  public getAllBills = async (req: any, res: any, next: any) => {
    try {
      const bills: Bill[] = await this.productsService.getAllBills(
        req.query.gymId
      );

      // TODO: make dto mapper and map all the array elements to dto

      next(bills);
    } catch (err) {
      this.logger.error(`cannot get all bills`, err);
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let productToUpdate: Product = null;
    try {
      productToUpdate = this.productDtoMapper.asEntity(req.body);

      const updatedProduct: Product = await this.productsService.update(
        productToUpdate
      );

      res.status(201);

      next(this.productDtoMapper.asDto(updatedProduct));
    } catch (err) {
      this.logger.error(
        `Cannot update product ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let productId: number = null;
    try {
      productId = Number(req.query.id);

      await this.productsService.delete(productId);

      next(`product with id ${productId} has been deleted successfully`);
    } catch (err) {
      this.logger.error(`Cannot delete product: ${productId}`, err);
      next(err);
    }
  };

  public deleteBill = async (req: any, res: any, next: any) => {
    let billId: number = null;
    try {
      billId = Number(req.query.id);

      await this.productsService.deleteBill(billId);

      next(`bill with id ${billId} has been deleted successfully`);
    } catch (err) {
      this.logger.error(`Cannot delete bill: ${billId}`, err);
      next(err);
    }
  };
}
