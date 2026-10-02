import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AppDBConnection } from "../config/database";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { Machine } from "../models/machines";
import { AppNotificationRepository } from "../repositories/app-notification-repository";
import { MachinesRepository } from "../repositories/machine-repository";
import { MachineSchedulerRepository } from "../repositories/scheduler-repository";
import { JobScheduleManager } from "./scheduler-manager";

@injectable()
export class MachinesService {
  constructor(
    @inject(AppDBConnection) private appDBConnection: AppDBConnection,
    @inject(Logger) private logger: Logger,
    @inject(MachinesRepository) private machinesRepository: MachinesRepository,
    @inject(MachineSchedulerRepository)
    private machineSchedulerRepository: MachineSchedulerRepository,
    @inject(AppNotificationRepository)
    private appNotificationRepository: AppNotificationRepository,
    @inject(JobScheduleManager) private jobScheduleManager: JobScheduleManager
  ) {}

  public getAll = async (gymId: number): Promise<Machine[]> => {
    // get all machines by gymId
    const machines = await this.machinesRepository.getAll(gymId);
    this.logger.info(`Returning ${machines.length} machines`);
    return machines;
  };

  public getBySerialNumber = async (
    machineSerialNumber: number
  ): Promise<Machine> => {
    const machine = await this.machinesRepository.getBySerialNumber(
      machineSerialNumber
    );
    this.logger.info(
      `Returning machine with serial number ${machineSerialNumber}`
    );
    return machine;
  };

  public create = async (machine: Machine): Promise<Machine> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      this.logger.info(`creating machine with id ${machine.id}`);

      const createdMachine = await this.machinesRepository.save(
        machine,
        transaction
      );

      this.logger.info(`created machine with id ${JSON.stringify(machine)}`);

      transaction.commit();

      return createdMachine;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      this.logger.error(
        `Error while creating machine , error: ${AppUtils.getFullException(
          error
        )}`,
        error
      );
      throw error;
    }
  };

  public update = async (machine: Machine): Promise<Machine> => {
    let transaction: Transaction = null;
    try {
      transaction = await this.appDBConnection.createTransaction();

      const updatedMachine = await this.machinesRepository.update(
        machine,
        transaction
      );

      await transaction.commit();

      this.logger.info(`updated machine with name ${updatedMachine.name}`);

      return updatedMachine;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      this.logger.error(
        `cannot update member, error ${AppUtils.getFullException(error)}`,
        error
      );
      throw error;
    }
  };

  public delete = async (
    serialNumber: string,
    gymId: number
  ): Promise<void> => {
    let transaction: Transaction = null;
    try {
      this.logger.info(`Deleting machine with serial Number: ${serialNumber}`);

      transaction = await this.appDBConnection.createTransaction();

      await this.machinesRepository.delete(serialNumber, transaction);

      // when deleting machine we need to check if there is jobs or notifications for this machine:
      await this.deleteRelatedJobsAndNotifications(
        serialNumber,
        gymId,
        transaction
      );

      transaction.commit();

      this.logger.info(
        `Machine with serial Number ${serialNumber} has been deleted`
      );
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      this.logger.error(
        `Error occurred while deleting machine: error: ${AppUtils.getFullException(
          error
        )}`,
        error
      );
      throw error;
    }
  };

  public deleteRelatedJobsAndNotifications = async (
    serialNumber: string,
    gymId: number,
    transaction?: Transaction
  ): Promise<void> => {
    // disable all jobs for this machine by serial number 
    const jobsFound: boolean = await this.findJobsByMachineSerialNumberToCancel(
      serialNumber,
      gymId,
      transaction
    );

    if (jobsFound) {
      await this.machineSchedulerRepository.deleteByMachineSerialNumber(
        serialNumber,
        gymId,
        transaction
      );
    }
  // delete all notifications for this machine 
    await this.appNotificationRepository.deleteByTargetObjectId(
      serialNumber,
      gymId,
      transaction
    );
  };

  public findJobsByMachineSerialNumberToCancel = async (
    serialNumber: string,
    gymId: number,
    transaction?: Transaction
  ): Promise<boolean> => {
    const scheduledJobsToCancel: MachineScheduledJob[] =
      await this.machineSchedulerRepository.getScheduledJobsByMachineSerial(
        serialNumber,
        gymId,
        transaction
      );

    if (scheduledJobsToCancel.length > 0) {
      // cancel all running jobs for this machine by serial number 
      for (let job of scheduledJobsToCancel) {
        this.jobScheduleManager.cancelJob(job.id);
      }
      return true;
    } else {
      return false;
    }
  };
}
