import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  AllowNull,
  HasOne,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Gym } from "./gym";
import { Job } from "./job";
import { Machine } from "./machines";

@Table({
  tableName: "Machine_scheduled_Job",
})
export class MachineScheduledJob extends Model<MachineScheduledJob> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  public startTime: Date;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  public isActive: Boolean; 

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public daysFrequency: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  public endTime: Date;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Job)
  public jobID: number;

  @AllowNull(false)
  @Column(DataType.STRING(1000))
  @ForeignKey(() => Machine)
  public machineSerialNumber: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;
}
