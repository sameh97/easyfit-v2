import { inject, injectable } from "inversify";
import { Json } from "sequelize/types/lib/utils";
import { MemberDtoMapper } from "../common/dto-mapper/member-dto-mapper";
import { Logger } from "../common/logger";
import { MemberDto } from "../models/dto/member-dto";
import { Member } from "../models/member";
import { MembersService } from "../services/members-service";

@injectable()
export class MemebrsController {
  constructor(
    @inject(MembersService) private membersService: MembersService,
    @inject(MemberDtoMapper) private membersDtoMapper: MemberDtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      // get all members using service
      const members: Member[] = await this.membersService.getAll(
        req.query.gymId
      );

      const memberDto: MemberDto[] = members.map((member) =>
        this.membersDtoMapper.asDto(member)
      );

      next(memberDto);
    } catch (err) {
      this.logger.error(`cannot get all members`, err);
      next(err);
    }
  };

  public createMember = async (req: any, res: any, next: any) => {
    let memberToCreate: Member = null;
    try {
      memberToCreate = this.membersDtoMapper.asEntity(req.body);

      const createdMember: Member = await this.membersService.create(
        memberToCreate
      );

      res.status(201);

      next(this.membersDtoMapper.asDto(createdMember));
    } catch (err) {
      this.logger.error(
        `Cannot create member ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let memberToUpdate: Member = null;
    try {
      memberToUpdate = this.membersDtoMapper.asEntity(req.body);

      const updatedMember: Member = await this.membersService.update(
        memberToUpdate
      );

      res.status(201);

      next(this.membersDtoMapper.asDto(updatedMember));
    } catch (err) {
      this.logger.error(
        `Cannot update member ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public getGendersNumber = async (req: any, res: any, next: any) => {
    let genders: number[] = [];
    // get genders number 
    // store then in number array, the first elemnt in the array will be
    // the number of males, and the second elem will be the number of females
    try {
      genders = await this.membersService.getGendersNumber(req.query.gymId);

      res.status(200);
      next(genders);
    } catch (err) {
      this.logger.error(`Cannot return number of genders}`, err);
      next(err);
    }
  };

  public getAllPhones = async (req: any, res: any, next: any) => {
    try {
      // get members phone numbers
      const phones: string[] = await this.membersService.getAllPhones(
        req.query.gymId
      );

      next(phones);
    } catch (error) {
      this.logger.error(`cannot get all members phones`, error);
      next(error);
    }
  };

  public getAddedMembersByMonth = async (req: any, res: any, next: any) => {
    try {
      // get added members number in all months
      // this func will return number array with size 12
      // each element in the array represents added members count in month
      // array at position 0 will be january
      const addedMembersByMonth: number[] =
        await this.membersService.getAddedMembersByMonth(req.query.gymId);

      next(addedMembersByMonth);
    } catch (error) {
      this.logger.error(`cannot get members count by month`, error);
      next(error);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let memberId: number;
    try {
      memberId = Number(req.query.id);

      await this.membersService.delete(memberId);

      next(`member with id ${memberId} has been deleted succesfuly`);
    } catch (err) {
      this.logger.error(`Cannot delete member: ${memberId}`, err);
      next(err);
    }
  };
}
