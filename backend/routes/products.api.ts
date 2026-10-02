import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { ProductsController } from "../controllers/products-controller";
const verifyToken = require("../middlewares/jwt-functions");

// TODO: use this
@injectable()
export class ProductsApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(ProductsController) private productsController: ProductsController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get(
      "/api/monthly-income",
      verifyToken,
      this.productsController.getMonthlyIncome
    );
    this.router.get(
      "/api/sold-products",
      verifyToken,
      this.productsController.soldProductsPeerMonth
    );
    this.router.get(
      "/api/products",
      verifyToken,
      this.productsController.getAll
    );
    this.router.get(
      "/api/bills",
      verifyToken,
      this.productsController.getAllBills
    );
    this.router.post(
      "/api/add-product",
      verifyToken,
      this.productsController.createProduct
    );
    this.router.post(
      "/api/add-bill",
      verifyToken,
      this.productsController.createBill
    );
    this.router.put(
      "/api/update-product",
      verifyToken,
      this.productsController.update
    );
    this.router.delete(
      "/api/delete-product",
      verifyToken,
      this.productsController.delete
    );

    this.router.delete(
      "/api/delete-bill",
      verifyToken,
      this.productsController.deleteBill
    );
  }
}
