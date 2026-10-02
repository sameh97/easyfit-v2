import "reflect-metadata";
import { EasyFitApp } from "./server/server";
import { AppDBConnection } from "./config/database";
import container from "./inversify.config";
import { Logger } from "./common/logger";
import { UsersApi } from "./routes/users.api";
import { GymApi } from "./routes/gym.api";
import { MembersApi } from "./routes/members.api";
import { TrainersApi } from "./routes/trainers.api";
import { ProductsApi } from "./routes/products.api";
import { MachinesApi } from "./routes/machines.api";
import { MachineSchedulerService } from "./services/scheduler-service";
import { MachineSchedulerApi } from "./routes/scheduler.api";
import { JobScheduleManager } from "./services/scheduler-manager";
import { WebSocketService } from "./services/socket.io-service";
import { MachineSchedulerRepository } from "./repositories/scheduler-repository";
import { NotificationsApi } from "./routes/notification";
import { TempUrlApi } from "./routes/temp-url-api";
import { UploadFilesApi } from "./routes/upload-file";
import { GroupTrainingApi } from "./routes/group-training-api";
import { PasswordManagerService } from "./services/password-manager-service";

// make a new instance of EasyFitApp (the server) and call start function
const app = new EasyFitApp(
  container.get(UsersApi),
  container.get(AppDBConnection),
  container.get(Logger),
  container.get(MembersApi),
  container.get(GymApi),
  container.get(ProductsApi),
  container.get(MachinesApi),
  container.get(TrainersApi),
  container.get(MachineSchedulerApi),
  container.get(MachineSchedulerService),
  container.get(JobScheduleManager),
  container.get(WebSocketService),
  container.get(MachineSchedulerRepository),
  container.get(NotificationsApi),
  container.get(TempUrlApi),
  container.get(UploadFilesApi),
  container.get(GroupTrainingApi),
  container.get(PasswordManagerService)
);

app.start();

console.log(`---  EASYFIT APP SERVICE ---`);
