import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { DashboardController } from "../controllers/dashboard-controller";
const verifyToken = require("../middlewares/jwt-functions");

/** Read-only dashboard aggregates (redesign.md §7.10 step 7). */
@injectable()
export class DashboardApi implements AppRoute {
  private router: Router;

  constructor(@inject(DashboardController) private dashboardController: DashboardController) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get("/api/dashboard/summary", verifyToken, this.dashboardController.getSummary);
  }
}
