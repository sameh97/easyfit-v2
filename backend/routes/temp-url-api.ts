import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { TempUrlController } from "../controllers/temp-url-controller";
const verifyToken = require("../middlewares/jwt-functions");

@injectable()
export class TempUrlApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(TempUrlController) private tempUrlController: TempUrlController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get(
      "/api/catalog-urls",
      verifyToken,
      this.tempUrlController.getAll
    );
    this.router.get("/api/catalog-url/:uuid", this.tempUrlController.getByUUID);
    this.router.post(
      "/api/catalog-url",
      verifyToken,
      this.tempUrlController.create
    );

    this.router.post(
      "/api/send-catalog-whatsapp",
      verifyToken,
      this.tempUrlController.sendWhatsApp
    );
    this.router.put(
      "/api/catalog-url",
      verifyToken,
      this.tempUrlController.update
    );
    this.router.delete(
      "/api/catalog-url",
      verifyToken,
      this.tempUrlController.delete
    );
  }
}
