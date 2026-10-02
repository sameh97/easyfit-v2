import { Router } from "express";
import { inject, injectable } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { TrainerController } from "../controllers/trainer-controller";
const verifyToken = require("../middlewares/jwt-functions");

@injectable()
export class TrainersApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(TrainerController) private trainerController: TrainerController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }
  private setRoutes() {
    this.router = Router();

    this.router.get(
      "/api/trainers",
      verifyToken,
      this.trainerController.getAll
    );
    this.router.get(
      "/api/trainer",
      verifyToken,
      this.trainerController.getById
    );
    this.router.post(
      "/api/add-trainer",
      verifyToken,
      this.trainerController.createTrainer
    );
    this.router.put(
      "/api/update-trainer",
      verifyToken,
      this.trainerController.Update
    );
    this.router.delete(
      "/api/delete-trainer",
      verifyToken,
      this.trainerController.delete
    );
  }
}
