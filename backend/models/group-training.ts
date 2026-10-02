import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  AllowNull,
  HasOne,
  HasMany,
  ForeignKey,
  BelongsToMany,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Gym } from "./gym";
import { Member } from "./member";
import { MemberParticipate } from "./member-participate";
import { Trainer } from "./trainer";

@Table({
  tableName: "groupTraining",
})
export class GroupTraining extends Model<GroupTraining> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  public startTime: Date;

  @AllowNull(false)
  @Column(DataType.STRING(3000))
  public description: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Trainer)
  public trainerId: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

  @BelongsToMany(() => Member, () => MemberParticipate)
  public members: Member[];
}
