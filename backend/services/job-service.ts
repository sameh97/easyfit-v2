import { injectable, inject } from "inversify";
import { AppUtils } from "../common/app-utils";
import { Consts } from "../common/consts";
import { InputError } from "../exeptions/input-error";
import { NotFound } from "../exeptions/notFound-exeption";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { WebSocketService } from "./socket.io-service";
import { SocketTopics } from "./../common/socket-util";
import { MachineScheduleDtoMapper } from "../common/dto-mapper/scheduler-dto-mapper";
import { AppNotificationMessage } from "../models/app-notification-message";
import { CacheService } from "./cache-service";
import { AppNotificationService } from "./app-notification-service";
import { AppNotification } from "../models/app-notification";
import { AppNotificationDto } from "../models/dto/notifications-dto";

@injectable()
export class JobService {
  constructor(
    @inject(WebSocketService) private webSocketService: WebSocketService,
    @inject(MachineScheduleDtoMapper)
    private machineScheduleDtoMapper: MachineScheduleDtoMapper,
    @inject(CacheService)
    private cacheService: CacheService
  ) {}

  public send = async (
    schedueledJob: MachineScheduledJob,
    createdNotification: AppNotificationDto
  ): Promise<void> => {
    if (!AppUtils.hasValue(schedueledJob)) {
      throw new NotFound(
        `cannot send job because scheduled job object is not found`
      );
    }

    const topic = this.getTopicByJobId(schedueledJob.jobID);

    // get the connection of specific client that need to recive the notification:
    const socketID: string = this.cacheService.get(
      schedueledJob.gymId.toString()
    );

    this.webSocketService.emitNotificationToSpecificClient(
      socketID,
      topic,
      createdNotification as any // TODO: make only one notifications model
    );
  };

  private createNotification(
    schedueledJob: MachineScheduledJob,
    topic: string
  ): AppNotificationMessage {
    const notification = new AppNotificationMessage(
      this.machineScheduleDtoMapper.asDto(schedueledJob),
      topic,
      schedueledJob.gymId,
      null,
      schedueledJob.machineSerialNumber,
      new Date()
    );
    return notification;
  }

  private getTopicByJobId(jobId: number) {
    if (jobId === Consts.CLEAN_MACHINE_JOB_ID) {
      return SocketTopics.TOPIC_CLEAN_MACHINE;
    }

    if (jobId === Consts.MACHINE_SERVICE_JOB_ID) {
      return SocketTopics.TOPIC_MACHINE_SERVICE;
    }

    throw new InputError(`Job id is not defined`);
  }
}
