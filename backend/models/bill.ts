import {
  Table,
  Column,
  Model,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
  DataType,
  AllowNull,
  HasOne,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Gym } from "./gym";
import { Product } from "./product";

@Table({
  tableName: "bill",
})
export class Bill extends Model<Bill> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public coustomerID: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public coustomerName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public coustomerPhone: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Product)
  public productID: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public productName: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public quantity: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public totalCost: number;
}
