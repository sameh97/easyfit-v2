import { Member } from './member';

export class GroupTraining {
  public id: number;
  public startTime: Date;
  public description: string;
  public trainerId: number;
  public gymId: number;
  public members: Member[];
}
