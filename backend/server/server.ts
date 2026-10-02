import express = require("express");
import { AppDBConnection } from "../config/database";
import { inject } from "inversify";
import { Logger } from "./../common/logger";
import { UsersApi } from "../routes/users.api";
import { MembersApi } from "../routes/members.api";
import { GymApi } from "../routes/gym.api";
import { TrainersApi } from "../routes/trainers.api";
import { ProductsApi } from "../routes/products.api";
import { appResponseHandler } from "./../middlewares/app-response-handler";
import { MachinesApi } from "../routes/machines.api";
import { MachineSchedulerService } from "../services/scheduler-service";
import { MachineSchedulerApi } from "../routes/scheduler.api";
import { Job } from "../models/job";
import { JobScheduleManager } from "../services/scheduler-manager";
import { Transaction } from "sequelize/types";
import * as cors from "cors";
import { WebSocketService } from "../services/socket.io-service";
import { Consts } from "../common/consts";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { MachineSchedulerRepository } from "../repositories/scheduler-repository";
import { AppUtils } from "../common/app-utils";
import { NotificationsApi } from "../routes/notification";
import { TempUrlApi } from "../routes/temp-url-api";
import { Role } from "../models/role";
import { UploadFilesApi } from "../routes/upload-file";
import { GroupTrainingApi } from "../routes/group-training-api";
import { User } from "../models/user";
import { Gym } from "../models/gym";
import { PasswordManagerService } from "../services/password-manager-service";
const path = require("path");
require("dotenv").config();

export class EasyFitApp {
  private app: express.Express;

  constructor(
    @inject(UsersApi) private usersApi: UsersApi,
    @inject(AppDBConnection) private dBconnection: AppDBConnection,
    @inject(Logger) private logger: Logger,
    @inject(MembersApi) private membersApi: MembersApi,
    @inject(GymApi) private gymApi: GymApi,
    @inject(ProductsApi) private productsApi: ProductsApi,
    @inject(MachinesApi) private machinesApi: MachinesApi,
    @inject(TrainersApi) private trainersApi: TrainersApi,
    @inject(MachineSchedulerApi)
    private machineSchedulerApi: MachineSchedulerApi,
    @inject(MachineSchedulerService)
    private machineSchedulerService: MachineSchedulerService,
    @inject(JobScheduleManager) private jobScheduleManager: JobScheduleManager,
    @inject(WebSocketService) private webSocketService: WebSocketService,
    @inject(MachineSchedulerRepository)
    private machineSchedulerRepository: MachineSchedulerRepository,
    @inject(NotificationsApi)
    private notificationsApi: NotificationsApi,
    @inject(TempUrlApi)
    private tempUrlApi: TempUrlApi,
    @inject(UploadFilesApi)
    private uploadFilesApi: UploadFilesApi,
    @inject(GroupTrainingApi)
    private groupTrainingApi: GroupTrainingApi,
    @inject(PasswordManagerService)
    private passwordManager: PasswordManagerService
  ) {
    this.app = express();
    this.app.use(express.json());
    // this tells the browser to allow requesting code from the origin
    this.app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "DELETE, POST, GET, PUT, PATCH, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "*");
      res.header("Access-Control-Expose-Headers", "*");
      next();
    });

    this.app.use(cors());
  }

  public async start(): Promise<void> {
    // this function starts the server
    this.initRoutes();
    this.handleAllResponses();
    this.initDB();
  }

  private addStaticAdmin = async (): Promise<void> => {
    const admin: User = {
      firstName: "Admin",
      lastName: "admin",
      email: "Admin@easyfit.com",
      password: process.env.ADMIN_PASSWORD,
      phone: "0542491699",
      imageURL: null,
      roleId: 2,
      birthDay: new Date("1997-04-29"),
      address: "shefamr",
      gymId: -1,
    } as User;

    const hashedPassword = await this.passwordManager.hashAndSalt(
      admin.password
    );

    admin.password = hashedPassword;

    const gym: Gym = {
      id: -1,
      name: "AdminGym",
      address: "shefamr",
      phone: "0542491698",
    } as Gym;

    let transaction: Transaction = null;
    try {
      transaction = await this.dBconnection.createTransaction();

      const createdAdminGym = await Gym.findOrCreate({
        where: { id: gym.id },
        defaults: gym,
        transaction: transaction,
      });

      const createdAdminUser = await User.findOrCreate({
        where: { gymId: admin.gymId },
        defaults: admin,
        transaction: transaction,
      });

      transaction.commit();
    } catch (error) {
      if (transaction) {
        transaction.rollback();
      }
      this.logger.error(
        `error while creating static admin user ${AppUtils.getFullException(
          error
        )}`
      );
      throw error;
    }
  };

  private addStaticRoles = async (): Promise<void> => {
    const regularRole: Role = {
      id: 1,
      name: "regular user",
    } as Role;

    const AdminRole: Role = {
      id: 2,
      name: "Admin",
    } as Role;

    let transaction: Transaction = null;
    try {
      transaction = await this.dBconnection.createTransaction();

      const createdRegRole = await Role.findOrCreate({
        where: { id: regularRole.id },
        defaults: regularRole,
        transaction: transaction,
      });

      const createdAdminRole = await Role.findOrCreate({
        where: { id: AdminRole.id },
        defaults: AdminRole,
        transaction: transaction,
      });

      transaction.commit();
    } catch (error) {
      if (transaction) {
        transaction.rollback();
      }
      this.logger.error(
        `error while creating static role ${AppUtils.getFullException(error)}`
      );
      throw error;
    }
  };

  private addStaticJob = async (): Promise<void> => {
    const job1: Job = {
      id: 1,
      title: "clean",
      description: "clean mahine",
    } as Job;

    const job2: Job = {
      id: 2,
      title: "service",
      description: "mahine service",
    } as Job;

    let transaction: Transaction = null;
    try {
      transaction = await this.dBconnection.createTransaction();

      const createdJob = await Job.findOrCreate({
        where: { id: job1.id },
        defaults: job1,
        transaction: transaction,
      });

      const createdJob2 = await Job.findOrCreate({
        where: { id: job2.id },
        defaults: job2,
        transaction: transaction,
      });

      transaction.commit();
    } catch (error) {
      if (transaction) {
        transaction.rollback();
      }

      this.logger.error(
        `error while creating static job ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  private setScheduledJobExpirationTracker(): void {
    // job tracker that looks for expired jobs and delete them, it will run every day.
    setInterval(async () => {
      try {
        // retreve all scheduled jobs from the database
        const allSchedules: MachineScheduledJob[] =
          await this.machineSchedulerRepository.getAllWithoutGymId();

        // for each job, check if the end time of the job is allready passed
        allSchedules.forEach(async (scheduledJob) => {
          const now: number = new Date().getTime();

          const scheduledJobEndTime: number = new Date(
            scheduledJob.endTime
          ).getTime();

          if (scheduledJobEndTime < now) {
            this.jobScheduleManager.deleteJobFromMap(scheduledJob.id);

            await this.machineSchedulerService.delete(scheduledJob.id);
          }
        });
      } catch (error) {
        this.logger.error(
          `error occurred while executing job expiration tracker. \n ${AppUtils.getFullException(
            error
          )}`
        );
      }
    }, Consts.ONE_DAY_IN_MILLISECONDS);
  }

  private initRoutes(): void {
    // init all the routes, use the routes middlewares,
    this.app.use(this.usersApi.getRouter());
    this.app.use(this.membersApi.getRouter());
    this.app.use(this.gymApi.getRouter());
    this.app.use(this.trainersApi.getRouter());
    this.app.use(this.productsApi.getRouter());
    this.app.use(this.machinesApi.getRouter());
    this.app.use(this.machineSchedulerApi.getRouter());
    this.app.use(this.notificationsApi.getRouter());
    this.app.use(this.tempUrlApi.getRouter());
    this.app.use(this.uploadFilesApi.getRouter());
    this.app.use(this.groupTrainingApi.getRouter());
    // Catch all other get requests
    const publicPath = express.static(path.join(__dirname, "./../easyfit"), {
      redirect: false,
    });

    this.app.use(publicPath);
    this.app.get("/*", (req, res) => {
      res.sendFile(path.join(__dirname, "../index.html"));
    });
  }

  public async initDB(): Promise<void> {
    // connect the server to the database
    this.dBconnection
      .connect()
      .then((r) => {
        console.log("success: " + JSON.stringify(r));
        this.listenToRequests();
        this.addStaticJob();
        this.addStaticRoles();
        this.addStaticAdmin();
        this.jobScheduleManager.runAllScheduledJobs();
        this.setScheduledJobExpirationTracker();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  private handleAllResponses(): void {
    // use the error handling middleware
    this.app.use(appResponseHandler);
  }

  private listenToRequests(): void {
    const http = require("http");

    const LOCAL_ADDRESS = "0.0.0.0";

    const PORT = process.env.APP_PORT || 3000;

    const server = http.createServer(this.app);

    this.webSocketService.connect(server);

    server.listen(PORT, LOCAL_ADDRESS, () => {
      console.log(`Server started on port ${PORT}`);
    });
  }
}
