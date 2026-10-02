import { AssociationOptions } from "sequelize";
import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  HasMany, 
  Table,
} from "sequelize-typescript";

import { Product } from "./product";
import { Machine } from './machines';

@Table({
  tableName: "categorys",
})

export class MachineType extends Model<MachineType> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @HasMany(() => Machine, {
    foreignKey: "machineTypeId",
    as: "machineType",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public machines: Machine[];
}




