import {
  AllowNull,
  AutoIncrement,
  Model,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({
  tableName: "notifications",
})
export class AppNotification extends Model<AppNotification> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  public id: number;

  @AllowNull(false)
  @Column(DataType.STRING(2500))
  public content: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public topic: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  public gymId: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  public seen: boolean;

  @AllowNull(false)
  @Column(DataType.STRING(1000))
  public targetObjectId: string;
}
