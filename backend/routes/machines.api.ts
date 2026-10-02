import { Router } from "express";
import { inject, injectable } from "inversify";
import { MachinesController } from "../controllers/machines-controller";
import { AppRoute } from "./../common/interfaces/app-route";
const verifyToken = require("../middlewares/jwt-functions");

@injectable()
export class MachinesApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(MachinesController) private machinesController: MachinesController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get("/api/machines", verifyToken, this.machinesController.getAll);
    this.router.post("/api/machine", verifyToken, this.machinesController.createMachine);
    this.router.put("/api/machine", verifyToken, this.machinesController.update);
    this.router.delete("/api/machine", verifyToken, this.machinesController.delete);

    this.router.get("/api/machine", verifyToken, this.machinesController.getBySerialNumber);
  }
}
