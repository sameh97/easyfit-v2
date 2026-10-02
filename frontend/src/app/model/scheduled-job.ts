export class ScheduledJob {
  public id: number;
  public jobID: number;
  public machineSerialNumber: string;
  public startTime: Date;
  public endTime: Date;
  public daysFrequency: number;
  public isActive: Boolean;
  public gymId: number;
}
