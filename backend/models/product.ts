import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Bill } from "./bill";
import { Catalog } from "./catalog";
import { Category } from "./category";
import { Gym } from "./gym";
import { TempUrl } from "./temp-url";

@Table({
  tableName: "products",
})
export class Product extends Model<Product> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @AllowNull(false)
  @Column(DataType.STRING(3500))
  public description: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public code: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public quantity: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public price: number;

  @AllowNull(false)
  @Column(DataType.STRING(3000))
  public imgUrl: string;

  @AllowNull(false)
  @ForeignKey(() => Category)
  @Column(DataType.INTEGER)
  public categoryID: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;

  @BelongsToMany(() => TempUrl, () => Catalog)
  TempUrls: TempUrl[];

  @HasOne(() => Bill, {
    foreignKey: "productID",
    as: "userGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public bill: Bill;
}
