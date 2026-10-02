import { Table, Column, Model, ForeignKey } from "sequelize-typescript";
import { GroupTraining } from "./group-training";
import { Member } from "./member";

@Table({
  tableName: "MemberParticipate",
})
export class MemberParticipate extends Model<MemberParticipate> {
  @ForeignKey(() => GroupTraining)
  @Column
  public groupTrainingID: number;

  @ForeignKey(() => Member)
  @Column
  public memberID: number;
}
