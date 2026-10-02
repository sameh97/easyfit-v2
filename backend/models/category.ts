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
@Table({
  tableName: "categorys",
})

export class Category extends Model<Category> {
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @HasMany(() => Product, {
    foreignKey: "categoryId",
    as: "productsCategory",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public products: Product[];
}
