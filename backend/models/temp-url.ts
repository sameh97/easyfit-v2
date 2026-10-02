import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  Unique,
  AllowNull,
  ForeignKey,
  BelongsToMany,
  HasMany,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Catalog } from "./catalog";
import { Gym } from "./gym";
import { Product } from "./product";
@Table({
  tableName: "TempUrl",
})
export class TempUrl extends Model<TempUrl> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  public uuid: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public durationDays: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  public isActive: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

  @BelongsToMany(() => Product, () => Catalog)
  public products: Product[];

}
