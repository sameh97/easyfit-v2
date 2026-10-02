import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { MemebrsController } from "../controllers/members-controller";
const verifyToken = require("../middlewares/jwt-functions");

// TODO: use this
@injectable()
export class MembersApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(MemebrsController) private membersController: MemebrsController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.get("/api/members", verifyToken , this.membersController.getAll);
    this.router.get(
      "/api/members-count", verifyToken ,
      this.membersController.getAddedMembersByMonth
    );
    this.router.get("/api/genders", verifyToken, this.membersController.getGendersNumber);
    this.router.get("/api/members-phones", verifyToken, this.membersController.getAllPhones);
    this.router.post("/api/add-member", verifyToken ,this.membersController.createMember);
    this.router.put("/api/update-member", verifyToken,this.membersController.update);
    this.router.delete("/api/member",verifyToken, this.membersController.delete);
  }
}
