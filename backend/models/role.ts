import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { User } from "./user";

@Table({
  tableName: "role",
})
export class Role extends Model<Role> {
  @PrimaryKey
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @HasMany(() => User, {
    foreignKey: "roleId",
    as: "userRole",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public users: User[];
}
