import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  Unique,
  AllowNull,
  IsEmail,
  Length,
  ForeignKey,
  HasOne,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Gym } from "./gym";
import { Role } from "./role";

@Table({
  tableName: "users",
})

// this class represents the user table in the database
export class User extends Model<User> {
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

  @Unique
  @AllowNull(false)
  @IsEmail
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public phone: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  public birthDay: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  public address: string;

  @AllowNull(true)
  @Column(DataType.STRING(3000))
  public imageURL?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Role)
  public roleId: number;

  @AllowNull(false)
  @Length({ min: 3, max: 512 })
  @Column(DataType.STRING)
  public password: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Gym)
  public gymId: number;
}
