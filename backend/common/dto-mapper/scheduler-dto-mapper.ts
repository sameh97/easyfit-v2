import { injectable } from "inversify";
import { MachineScheduledJobDto } from "../../models/dto/scheduler-dto";
import { MachineScheduledJob } from "../../models/machine-scheduled-job";
import { AppUtils } from "../app-utils";

@injectable()
export class MachineScheduleDtoMapper {
  public asDto(scheduledJob: MachineScheduledJob): MachineScheduledJobDto {
    if (!AppUtils.hasValue(scheduledJob)) {
      return null;
    }

    return {
      id: scheduledJob.id,
      startTime: scheduledJob.startTime,
      endTime: scheduledJob.endTime,
      isActive: scheduledJob.isActive,
      daysFrequency: scheduledJob.daysFrequency,
      jobID: scheduledJob.jobID,
      machineSerialNumber: scheduledJob.machineSerialNumber,
      gymId: scheduledJob.gymId,
    } as MachineScheduledJobDto;
  }

  public asEntity(
    machineScheduledJobDto: MachineScheduledJobDto
  ): MachineScheduledJob {
    if (!AppUtils.hasValue(machineScheduledJobDto)) {
      return null;
    }

    return {
      id: machineScheduledJobDto.id,
      startTime: machineScheduledJobDto.startTime,
      endTime: machineScheduledJobDto.endTime,
      isActive: machineScheduledJobDto.isActive,
      daysFrequency: machineScheduledJobDto.daysFrequency,
      jobID: machineScheduledJobDto.jobID,
      machineSerialNumber: machineScheduledJobDto.machineSerialNumber,
      gymId: machineScheduledJobDto.gymId,
    } as MachineScheduledJob;
  }
}
