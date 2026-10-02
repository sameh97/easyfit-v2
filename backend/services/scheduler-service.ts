import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AppDBConnection } from "../config/database";
import { InputError } from "../exeptions/input-error";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { MachineSchedulerRepository } from "../repositories/scheduler-repository";
import { JobScheduleManager } from "./scheduler-manager";

@injectable()
export class MachineSchedulerService {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(MachineSchedulerRepository)
    private machineSchedulerRepo: MachineSchedulerRepository,
    @inject(AppDBConnection) private appDBConnection: AppDBConnection,
    @inject(JobScheduleManager) private jobScheduleManager: JobScheduleManager
  ) {}

  public create = async (
    scheduleJob: MachineScheduledJob
  ): Promise<MachineScheduledJob> => {
    let transaction: Transaction = null;
    try {
      await AppUtils.validteScheduledJobEndDate(scheduleJob);

      transaction = await this.appDBConnection.createTransaction();

      const createdScheduleJob = await this.machineSchedulerRepo.save(
        scheduleJob,
        transaction
      );

      await transaction.commit();

      await this.jobScheduleManager.runJob(createdScheduleJob);

      this.logger.info(`created schedule with id ${createdScheduleJob.id}`);

      return createdScheduleJob;
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while creating schedule: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  };

  public getAll = async (gymId: number): Promise<MachineScheduledJob[]> => {
    const machineSchedules: MachineScheduledJob[] =
      await this.machineSchedulerRepo.getAll(gymId);
    this.logger.info(`Returning ${machineSchedules.length} schedules`);
    return machineSchedules;
  };

  public update = async (
    scheduleJob: MachineScheduledJob
  ): Promise<MachineScheduledJob> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const updatedScheduleJob = await this.machineSchedulerRepo.update(
        scheduleJob,
        transaction
      );

      await transaction.commit();

      this.jobScheduleManager.updateRunningJob(scheduleJob);

      this.logger.info(`updated schedule with id ${updatedScheduleJob.id}`);

      return updatedScheduleJob;
    } catch (err) {
      if (transaction) {
        transaction.rollback();
      }
      this.logger.error(
        `Error occurred while updating schedule: error: ${AppUtils.getFullException(
          err
        )}`
      );
      throw err;
    }
  };

  public delete = async (id: number): Promise<void> => {
    if (!AppUtils.isInteger(id)) {
      throw new InputError(`Cannot delete schedule, the id must be an integer`);
    }

    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting schedule with id: ${id}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.machineSchedulerRepo.delete(id, transaction);

      this.jobScheduleManager.cancelJob(id);

      await transaction.commit();
    
      this.logger.info(`Schedule with id ${id} has been deleted.`);
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };

  public deleteByMachineSerialNumber = async (
    machineSerialNumber: string,
    gymId: number
  ): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(
        `Deleting schedule with machine Serial Number: ${machineSerialNumber}`
      );

      transaction = await this.appDBConnection.createTransaction();
        // get all jobs for specifc machine before deleting in order to disable them
      const scheduledJobsToCancel: MachineScheduledJob[] =
        await this.machineSchedulerRepo.getScheduledJobsByMachineSerial(
          machineSerialNumber,
          gymId,
          transaction
        );
    // delete jobs by serial number 
      await this.machineSchedulerRepo.deleteByMachineSerialNumber(
        machineSerialNumber,
        gymId,
        transaction
      );

     // disable all the running jobs
      if (scheduledJobsToCancel.length > 0) {
        for (let job of scheduledJobsToCancel) {
          this.jobScheduleManager.cancelJob(job.id);
        }
      }

      await transaction.commit();

      this.logger.info(
        `Schedule with machine Serial Number ${machineSerialNumber} has been deleted.`
      );
    } catch (err) {
      if (transaction) {
        await transaction.rollback();
      }
      throw err;
    }
  };

 
}
