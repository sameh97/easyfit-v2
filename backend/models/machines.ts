import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Gym } from "./gym";
import { MachineScheduledJob } from "./machine-scheduled-job";
import { MachineType } from "./machine-type";

@Table({
  tableName: "machines",
})
export class Machine extends Model<Machine> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @AllowNull(false)
  @Column(DataType.STRING(3000))
  public description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public serialNumber: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public productionYear: number;

  @AllowNull(true)
  @Column(DataType.STRING(3000))
  public imgUrl: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public price: number;


  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

}
