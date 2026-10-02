import { inject, injectable } from "inversify";
import { GroupTrainingDtoMapper } from "../common/dto-mapper/group-training-dto-mapper";
import { Logger } from "../common/logger";
import { GroupTrainingDto } from "../models/dto/group-training-dto";
import { GroupTraining } from "../models/group-training";
import { GroupTrainingService } from "../services/group-training-service";

@injectable()
export class GroupTrainingController {
  constructor(
    @inject(GroupTrainingService)
    private groupTrainingService: GroupTrainingService,
    @inject(GroupTrainingDtoMapper)
    private groupTrainingDtoMapper: GroupTrainingDtoMapper,
    @inject(Logger) private logger: Logger
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      const groupTrainings: GroupTraining[] =
        await this.groupTrainingService.getAll(req.query.gymId);

      const groupTrainingsDto: GroupTrainingDto[] = groupTrainings.map(
        (groupTraining) => this.groupTrainingDtoMapper.asDto(groupTraining)
      );

      next(groupTrainingsDto);
    } catch (err) {
      this.logger.error(`cannot get all Group trainings`, err);
      next(err);
    }
  };

  public getById = async (req: any, res: any, next: any) => {
    try {
      const groupTraining: GroupTraining =
        await this.groupTrainingService.getById(req.query.gymId, req.query.id);

      const groupTrainingDto: GroupTrainingDto =
        this.groupTrainingDtoMapper.asDto(groupTraining);

      next(groupTrainingDto);
    } catch (err) {
      this.logger.error(
        `Cannot get group training with id: ${req.query.id}`,
        err
      );
      next(err);
    }
  };

  public create = async (req: any, res: any, next: any) => {
    let groupTrainingToCreate: GroupTraining = null;
    try {
      groupTrainingToCreate = this.groupTrainingDtoMapper.asEntity(req.body);

      const createdGroupTraining: GroupTraining =
        await this.groupTrainingService.create(groupTrainingToCreate);

      res.status(201);

      next(this.groupTrainingDtoMapper.asDto(createdGroupTraining));
    } catch (err) {
      this.logger.error(
        `Cannot create Group training ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let groupTrainingToUpdate: GroupTraining = null;
    try {
      groupTrainingToUpdate = this.groupTrainingDtoMapper.asEntity(req.body);

      const updatedGroupTraining: GroupTraining =
        await this.groupTrainingService.update(groupTrainingToUpdate);

      res.status(200);

      next(this.groupTrainingDtoMapper.asDto(updatedGroupTraining));
    } catch (err) {
      this.logger.error(
        `Cannot update Group training ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let id: number;
    try {
      id = req.query.id;

      await this.groupTrainingService.delete(id);

      next(`Group training with id ${id} has been deleted succesfuly`);
    } catch (err) {
      this.logger.error(`Cannot delete Group training: ${id}`, err);
      next(err);
    }
  };
}
