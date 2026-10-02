import { inject, injectable } from "inversify";
import { MachineScheduleDtoMapper } from "../common/dto-mapper/scheduler-dto-mapper";
import { Logger } from "../common/logger";
import { MachineScheduledJobDto } from "../models/dto/scheduler-dto";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { MachineSchedulerService } from "../services/scheduler-service";

@injectable()
export class MachineSchedulerController {
  constructor(
    @inject(MachineScheduleDtoMapper)
    private machineScheduleDtoMapper: MachineScheduleDtoMapper,
    @inject(MachineSchedulerService)
    private machineSchedulerService: MachineSchedulerService,
    @inject(Logger) private logger: Logger
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      // get all jobs 
      const machineSchedules: MachineScheduledJob[] =
        await this.machineSchedulerService.getAll(req.query.gymId);

      const machineSchedulesDto: MachineScheduledJobDto[] =
        machineSchedules.map((machineSchedule) =>
          this.machineScheduleDtoMapper.asDto(machineSchedule)
        );

      next(machineSchedulesDto);
    } catch (err) {
      this.logger.error(`cannot get all schedules`, err);
      next(err);
    }
  };

  public create = async (req: any, res: any, next: any) => {
    let scheduleToCreate: MachineScheduledJob = null;
    try {
      scheduleToCreate = this.machineScheduleDtoMapper.asEntity(req.body);

      const createdSchedule: MachineScheduledJob =
        await this.machineSchedulerService.create(scheduleToCreate);

      res.status(201);
      
      next(this.machineScheduleDtoMapper.asDto(createdSchedule));
    } catch (error) {
      this.logger.error(
        `Cannot create schedule ${JSON.stringify(req.body)}`,
        error
      );
      next(error);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let scheduleToUpdate: MachineScheduledJob = null;
    try {
      scheduleToUpdate = this.machineScheduleDtoMapper.asEntity(req.body);

      const updatedScheduledJob: MachineScheduledJob =
        await this.machineSchedulerService.update(scheduleToUpdate);

      res.status(201);

      next(this.machineScheduleDtoMapper.asDto(updatedScheduledJob));
    } catch (err) {
      this.logger.error(
        `Cannot update scheduled job ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let scheduledJobId: number = null;
    try {
      scheduledJobId = Number(req.query.id);

      await this.machineSchedulerService.delete(scheduledJobId);

      next(
        `scheduled Job with id ${scheduledJobId} has been deleted successfully`
      );
    } catch (err) {
      this.logger.error(`Cannot delete scheduled Job: ${scheduledJobId}`, err);
      next(err);
    }
  };
}

