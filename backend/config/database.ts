import { injectable } from "inversify";
import { Sequelize } from "sequelize-typescript";
import { User } from "../models/user";
import { Transaction } from "sequelize/types";
import { Gym } from "../models/gym";
import { Member } from "../models/member";
import { Trainer } from "../models/trainer";
import { Product } from "../models/product";
import { Machine } from "../models/machines";
import { MachineScheduledJob } from "../models/machine-scheduled-job";
import { Job } from "../models/job";
import { AppNotification } from "../models/app-notification";
import { Category } from "../models/category";
import { Catalog } from "../models/catalog";
import { TempUrl } from "../models/temp-url";
import { Bill } from "../models/bill";
import { Role } from "../models/role";
import { GroupTraining } from "../models/group-training";
import { MemberParticipate } from "../models/member-participate";
require("dotenv").config();

@injectable()
export class AppDBConnection {
  private db: Sequelize;

  async connect(): Promise<void> {
    this.db = new Sequelize({
      database: process.env.PGSQL_DB,
      dialect: "postgres",
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      // SQL logging includes row values (e.g. password hashes); keep it out of prod logs
      logging: process.env.NODE_ENV === "production" ? false : console.log,
      dialectOptions: {
        dialectOptions: {
          ssl: false, // Disable SSL
        },
      },
    });

    this.db.addModels([
      User,
      Gym,
      Member,
      Trainer,
      Product,
      Machine,
      MachineScheduledJob,
      Job,
      AppNotification,
      Category,
      TempUrl,
      Catalog,
      Bill,
      Role,
      GroupTraining,
      MemberParticipate,
    ]);
    await this.db.authenticate();
    await this.db.sync();
  }

  public async createTransaction(): Promise<Transaction> {
    return await this.db.transaction();
  }
}
