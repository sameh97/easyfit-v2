import { inject, injectable } from "inversify";
import { AppUtils } from "../common/app-utils";
import { NotificationsDtoMapper } from "../common/dto-mapper/notifications-dto-mapper";
import { nextOccurrence } from "../common/job-occurrence";
import { Logger } from "../common/logger";
import { InputError } from "../exeptions/input-error";
import { AppNotification } from "../models/app-notification";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { AppNotificationRepository } from "../repositories/app-notification-repository";
import { MachineSchedulerRepository } from "../repositories/scheduler-repository";
import { AppNotificationService } from "./app-notification-service";
import { JobService } from "./job-service";

const schedule = require("node-schedule");

/** The part of a node-schedule Job this class uses. */
interface ScheduledTimer {
  cancel(): boolean;
}

/**
 * Fires maintenance alerts for scheduled jobs.
 *
 * Each active job has exactly one timer, set for its next run (`startTime + n × daysFrequency`,
 * up to `endTime`). When it fires, one alert is stored and pushed, and the timer is re-armed for
 * the next run still in the future. Runs missed while the process was paused (PC asleep) or down
 * are not replayed: at most one late alert on resume, none on restart. Restarting any number of
 * times therefore never duplicates alerts; an extra guard skips a run that already has an alert.
 */
@injectable()
export class JobScheduleManager {
  public allJobs = new Map<number, ScheduledTimer>();

  constructor(
    @inject(MachineSchedulerRepository)
    private machineSchedulerRepository: MachineSchedulerRepository,
    @inject(JobService) private jobService: JobService,
    @inject(AppNotificationService)
    private appNotificationService: AppNotificationService,
    @inject(AppNotificationRepository)
    private appNotificationRepository: AppNotificationRepository,
    @inject(NotificationsDtoMapper)
    private notificationsDtoMapper: NotificationsDtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  /** (Re)arms the timer for the job's next future run. Safe to call repeatedly for the same job. */
  public runJob = async (scheduledJob: MachineScheduledJob): Promise<void> => {
    this.clearTimer(scheduledJob.id);

    if (!scheduledJob.isActive) {
      return;
    }

    // Strictly after now: a run at this very moment was either just fired or is being replaced.
    const nextRun: Date | null = nextOccurrence(scheduledJob, new Date(Date.now() + 1));
    if (!nextRun) {
      this.logger.info(`scheduled job ${scheduledJob.id} has no runs left before its end time`);
      return;
    }

    const timer: ScheduledTimer = schedule.scheduleJob(nextRun, () => this.fire(scheduledJob, nextRun));
    this.allJobs.set(scheduledJob.id, timer);
    this.logger.info(`scheduled job ${scheduledJob.id} next runs at ${nextRun.toISOString()}`);
  };

  private fire = async (scheduledJob: MachineScheduledJob, runAt: Date): Promise<void> => {
    try {
      const alreadyAlerted: boolean = await this.appNotificationRepository.existsForJobSince(
        scheduledJob.gymId,
        scheduledJob.machineSerialNumber,
        scheduledJob.id,
        runAt
      );

      if (alreadyAlerted) {
        this.logger.info(`skipping duplicate alert for job ${scheduledJob.id} run ${runAt.toISOString()}`);
      } else {
        const notificationToCreate: AppNotification = AppUtils.createNotificationToStoreInDB(scheduledJob);

        const createdNotification: AppNotification = await this.appNotificationService.create(notificationToCreate);

        // send job notification for specific machine
        this.jobService.send(scheduledJob, this.notificationsDtoMapper.asDto(createdNotification));

        // send regular notification:
        this.appNotificationService.sendGroupedNotification(scheduledJob.gymId);
      }
    } catch (error) {
      this.logger.error(`failed to fire scheduled job ${scheduledJob.id}`, error);
    } finally {
      // Re-arm for the next run that is still ahead (skips runs missed while asleep).
      if (this.allJobs.has(scheduledJob.id)) {
        await this.runJob(scheduledJob);
      }
    }
  };

  public cancelJob = async (jobID: number): Promise<void> => {
    if (!AppUtils.isInteger(jobID)) {
      throw new InputError(`cannot cancel job because the givin id must be integer`);
    }

    if (!this.allJobs.has(jobID)) {
      console.log(`cannot cancel job because its not found`);
      return;
    }

    this.clearTimer(jobID);
  };

  public updateRunningJob = async (scheduledJob: MachineScheduledJob): Promise<void> => {
    // runJob replaces any existing timer for this job
    await this.runJob(scheduledJob);
  };

  public runAllScheduledJobs = async (): Promise<void> => {
    const currentJobs: MachineScheduledJob[] = await this.machineSchedulerRepository.getAllWithoutGymId();

    if (!AppUtils.hasValue(currentJobs) || currentJobs.length === 0) {
      console.log(`there is no jobs to run!`);
      return;
    }

    for (const job of currentJobs) {
      await this.runJob(job);
    }
  };

  public deleteJobFromMap = (id: number): void => {
    if (!AppUtils.isInteger(id)) {
      throw new InputError(`cannot delete job because the givin id must be integer`);
    }

    this.clearTimer(id);
  };

  private clearTimer(id: number): void {
    const timer: ScheduledTimer | undefined = this.allJobs.get(id);
    if (timer) {
      timer.cancel();
    }
    this.allJobs.delete(id);
  }
}
