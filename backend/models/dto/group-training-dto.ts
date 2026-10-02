import { Member } from "../member";

export class GroupTrainingDto {
  public id: number;
  public startTime: Date;
  public description: string;
  public trainerId: number;
  public gymId: number;
  public members: Member[];
}
