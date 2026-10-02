import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  IsEmail,
  IsDate,
  Model,
  PrimaryKey,
  Table,
  Unique,
  BelongsToMany,
} from "sequelize-typescript";
import { GroupTraining } from "./group-training";
import { Gym } from "./gym";
import { MemberParticipate } from "./member-participate";

@Table({
  tableName: "members",
})
export class Member extends Model<Member> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public firstName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public lastName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public phone: string;

  @AllowNull(false)
  @IsDate
  @Column(DataType.DATE)
  public birthDay: Date;

  @Unique
  @AllowNull(false)
  @IsEmail
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public address: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  public isActive: boolean;

  @IsDate
  @AllowNull(false)
  @Column(DataType.DATE)
  public joinDate: Date;

  @AllowNull(true)
  @IsDate
  @Column(DataType.DATE)
  public endOfMembershipDate: Date;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  public gender: number;

  @AllowNull(true)
  @Column(DataType.STRING(3000))
  public imageURL?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

  @BelongsToMany(() => GroupTraining, () => MemberParticipate)
  public groupTrainings: GroupTraining[];
}
