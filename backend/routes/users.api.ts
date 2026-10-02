import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { UserController } from "../controllers/user-controller";
const verifyToken = require("../middlewares/jwt-functions");
const verifyAdmin = require("../middlewares/verifyAdmin");

// TODO: use this
@injectable()
export class UsersApi implements AppRoute {
  private router: Router;

  constructor(@inject(UserController) private usersController: UserController) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.post("/api/login", this.usersController.login);
    this.router.post("/api/register" ,verifyToken , verifyAdmin , this.usersController.createUser); // TODO: add verifyToken and verifyAdmin
    this.router.get("/api/users",verifyToken , verifyAdmin , this.usersController.getAll);
    this.router.get("/api/get-user",verifyToken  , this.usersController.getByEmail);
    this.router.put("/api/user" , verifyToken ,  this.usersController.update);
    this.router.delete("/api/user", verifyToken ,verifyAdmin ,  this.usersController.delete);
  }
}
