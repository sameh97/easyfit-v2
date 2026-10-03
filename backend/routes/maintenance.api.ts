import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { MaintenanceController } from "../controllers/maintenance-controller";
const verifyToken = require("../middlewares/jwt-functions");

/** Read-only maintenance status (redesign.md §5.6, §7.10 Phase 3 step 5). */
@injectable()
export class MaintenanceApi implements AppRoute {
  private router: Router;

  constructor(@inject(MaintenanceController) private maintenanceController: MaintenanceController) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get("/api/maintenance/status", verifyToken, this.maintenanceController.getStatus);
  }
}
