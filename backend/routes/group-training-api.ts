import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { GroupTrainingController } from "../controllers/group-training-controller";
import { TempUrlController } from "../controllers/temp-url-controller";
const verifyToken = require("../middlewares/jwt-functions");

@injectable()
export class GroupTrainingApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(GroupTrainingController)
    private groupTrainingController: GroupTrainingController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get(
      "/api/group-trainings",
      verifyToken,
      this.groupTrainingController.getAll
    );

    this.router.get(
      "/api/group-training",
      verifyToken,
      this.groupTrainingController.getById
    );

    this.router.post(
      "/api/group-training",
      verifyToken,
      this.groupTrainingController.create
    );

    this.router.put(
      "/api/group-training",
      verifyToken,
      this.groupTrainingController.update
    );
    this.router.delete(
      "/api/group-training",
      verifyToken,
      this.groupTrainingController.delete
    );
  }
}
