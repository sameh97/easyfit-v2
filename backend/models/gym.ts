import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DataType,
  AutoIncrement,
  AllowNull,
  HasOne,
  HasMany,
} from "sequelize-typescript";
import { AssociationOptions } from "sequelize/types";
import { Member } from "./member";
import { Trainer } from "./trainer";
import { Product } from "./product";
import { User } from "./user";
import { GroupTraining } from "./group-training";

@Table({
  tableName: "gym",
})
export class Gym extends Model<Gym> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  public name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public address: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public phone: string;

  @HasOne(() => User, {
    foreignKey: "gymId",
    as: "userGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public user: User;

  @HasMany(() => Member, {
    foreignKey: "gymId",
    as: "membersGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public members: Member[];

  @HasMany(() => Trainer, {
    foreignKey: "gymId",
    as: " trainersGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public trainer: Trainer[];

  @HasMany(() => Product, {
    foreignKey: "gymId",
    as: "productsGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public products: Product[];

  @HasMany(() => Trainer, {
    foreignKey: "gymId",
    as: "groupTrainingsGym",
    onDelete: "CASCADE",
  } as AssociationOptions)
  public groupTrainings: GroupTraining[];
}
