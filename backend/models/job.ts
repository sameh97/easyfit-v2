import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  AllowNull,
  HasMany,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { MachineScheduledJob } from "./machine-scheduled-job";

@Table({
  tableName: "job",
})
export class Job extends Model<Job> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public title: string;

  @AllowNull(false)
  @Column(DataType.STRING(1500))
  public description: string;

  @HasMany(() => MachineScheduledJob, {
    foreignKey: "jobID",
    as: "jobScheduled",
    onDelete: "CASCADE",
    constraints: false,
  } as AssociationOptions)
  public machineScheduledJobs: MachineScheduledJob[];
}
