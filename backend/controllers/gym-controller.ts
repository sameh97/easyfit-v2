import { inject, injectable } from "inversify";
import { Logger } from "../common/logger";
import { GymDto } from "../models/dto/gym-dto";
import { Gym } from "../models/gym";
import { GymDtoMapper } from "./../common/dto-mapper/gym-dto-mapper";
import { GymService } from "./../services/gym-service";

@injectable()
export class GymController {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(GymDtoMapper) private gymDtoMapper: GymDtoMapper,
    @inject(GymService) private gymService: GymService
  ) {}

  public createGym = async (req: any, res: any, next: any) => {
    let gymToCreate: Gym = null;
    try {
      // get gym obj from body 
      gymToCreate = this.gymDtoMapper.asEntity(req.body);

      const createdGym: Gym = await this.gymService.create(gymToCreate);

      res.status(201);

      // return the created gym to the client as dto
      next(this.gymDtoMapper.asDto(createdGym));
    } catch (err) {
      this.logger.error(
        `Cannot create gym ${JSON.stringify(gymToCreate)}`,
        err
      );
      next(err);
    }
  };

  public getAll = async (req: any, res: any, next: any) => {
    try {
      // get all the gyms in the system from DB
      const gyms: Gym[] = await this.gymService.getAll();

      const gymsDto: GymDto[] = gyms.map((gym) => this.gymDtoMapper.asDto(gym));

      next(gymsDto);
    } catch (err) {
      this.logger.error(`cannot get all gyms`, err);
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let gymToUpdate: Gym = null;
    try {
       // get gym obj from body 
      gymToUpdate = this.gymDtoMapper.asEntity(req.body);

      const updatedGym: Gym = await this.gymService.update(gymToUpdate);

      res.status(201);

      next(this.gymDtoMapper.asDto(updatedGym));
    } catch (err) {
      this.logger.error(`Cannot update gym ${JSON.stringify(req.body)}`, err);
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let gymId: number;
    try {
      // get id form query params
      gymId = Number(req.query.id);

      await this.gymService.delete(gymId);

      next(`gym with id ${gymId} has been deleted succesfuly`);
    } catch (err) {
      this.logger.error(`Cannot delete gym: ${gymId}`, err);
      next(err);
    }
  };
}
