import { inject, injectable } from "inversify";
import { Transaction } from "sequelize/types";
import { AppUtils } from "../common/app-utils";
import { Logger } from "../common/logger";
import { AlreadyExistError } from "../exeptions/already-exist-error";
import { NotFoundErr } from "../exeptions/not-found-error";
import { Member } from "../models/member";
import sequelize = require("sequelize");
const { Op } = require("sequelize");
@injectable()
export class MembersRepository {
  constructor(@inject(Logger) private logger: Logger) {}

  public async getAll(gymId: number): Promise<Member[]> {
    return await Member.findAll({ where: { gymId: gymId } });
  }

  public async getByID(idsArray: number[]): Promise<Member[]> {
    return await Member.findAll({
      where: {
        id: idsArray,
        //TODO: add transaction
      },
    });
  }

  public async save(
    member: Member,
    transaction?: Transaction
  ): Promise<Member> {
    // check if exists
    const memberInDB = await Member.findOne({
      where: { email: member.email },
      transaction: transaction,
    });

    if (AppUtils.hasValue(memberInDB)) {
      throw new AlreadyExistError(
        `member with email ${memberInDB.email} allready exist`
      );
    }

    this.logger.info(`Creating member with email '${member.email}'`);

    const createdMember = await Member.create(member, {
      transaction: transaction,
    });

    this.logger.info(`created member ${JSON.stringify(createdMember)}`);

    return createdMember;
  }

  public update = async (
    member: Member,
    transaction?: Transaction
  ): Promise<Member> => {
    let memberInDB = await Member.findOne({
      where: { email: member.email },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(memberInDB)) {
      throw new NotFoundErr(`member with email ${member.email} was not fount`);
    }

    this.logger.info(`Updating member with email '${member.email}'`);

    const updatedMember = await memberInDB.update(member);

    this.logger.info(`Updated member '${JSON.stringify(updatedMember)}'`);

    return updatedMember;
  };

  public delete = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
    const toDelete: Member = await Member.findOne({
      where: { id: id },
      transaction: transaction,
    });

    if (!AppUtils.hasValue(toDelete)) {
      throw new NotFoundErr(
        `Cannot delete member: ${id} because it is not found`
      );
    }

    await Member.destroy({
      where: { id: id },
      transaction: transaction,
    });
  };

  public getAllPhones = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<any[]> => {
    // retern only the phone column
    return await Member.findAll({
      attributes: ["phone"],
      where: { gymId: gymId },
      transaction: transaction,
    });
  };

  public async getAllMales(
    gymId: number,
    transaction?: Transaction
  ): Promise<number> {
    return await Member.count({
      where: { gymId: gymId, gender: 1 },
      transaction: transaction,
    });
  }

  public async getAllFemales(
    gymId: number,
    transaction?: Transaction
  ): Promise<number> {
    return await Member.count({
      where: { gymId: gymId, gender: 2 },
      transaction: transaction,
    });
  }

  public getAddedMembersByMonth = async (
    gymId: number,
    transaction?: Transaction
  ): Promise<number[]> => {
    const currentTime = new Date();
    let year = currentTime.getFullYear();
    let result: number[] = [];
    // for each month get the count of added members
    for (let month = 1; month <= 12; month++) {
      let nextMonth: number = month + 1;
      let nextYear: number = year;

      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = nextYear + 1;
      }

      const currentMonthAddedMembers = await Member.count({
        where: {
          [Op.and]: [
            {
              joinDate: {
                [Op.gte]: new Date(`${year}-${month}-01`),
                [Op.lt]: new Date(`${nextYear}-${nextMonth}-01`),
              },
              gymId: gymId,
            },
          ],
        },
        transaction: transaction,
      });
      result.push(currentMonthAddedMembers);
    }
    return result;
  };
}
