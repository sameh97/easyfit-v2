import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { AppNotificationsController } from "../controllers/notifications-controller";
const verifyToken = require("../middlewares/jwt-functions");

// TODO: use this
@injectable()
export class NotificationsApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(AppNotificationsController)
    private appNotificationsController: AppNotificationsController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get(
      "/api/notifications",
      verifyToken,
      this.appNotificationsController.getAll
    );
    this.router.get(
      "/api/machine/notifications",
      verifyToken,
      this.appNotificationsController.getByMachineSerialNumber
    );
    this.router.get(
      "/api/machine/all-notifications",
      verifyToken,
      this.appNotificationsController.getAllGrouped
    );
    this.router.put(
      "/api/notification",
      verifyToken,
      this.appNotificationsController.update
    );
    this.router.delete(
      "/api/notification",
      verifyToken,
      this.appNotificationsController.delete
    );
    this.router.delete(
      "/api/gym-notifications",
      verifyToken,
      this.appNotificationsController.deleteByGymId
    );

    this.router.delete(
      "/api/machine-notifications",
      verifyToken,
      this.appNotificationsController.deleteAllByTargetObjectId
    );
  }
}
