import { Router } from "express";
import { injectable, inject } from "inversify";
import { AppRoute } from "../common/interfaces/app-route";
import { UploadFileController } from "../controllers/upload-file-controller";
import { UserController } from "../controllers/user-controller";
const verifyToken = require("../middlewares/jwt-functions");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// TODO: use this
@injectable()
export class UploadFilesApi implements AppRoute {
  private router: Router;

  constructor(
    @inject(UploadFileController)
    private uploadFileController: UploadFileController
  ) {
    this.setRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private setRoutes(): void {
    this.router = Router();

    this.router.post(
      "/api/storage",
      verifyToken,
      upload.single("file"),
      this.uploadFileController.upload
    );
    this.router.get("/api/storage/:key", this.uploadFileController.get);

  }
}
