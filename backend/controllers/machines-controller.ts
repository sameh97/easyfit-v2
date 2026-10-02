import { inject, injectable } from "inversify";
import { MachineDtoMapper } from "../common/dto-mapper/machine-dto-mapper";
import { Logger } from "../common/logger";
import { MachineDto } from "../models/dto/machine-dto";
import { Machine } from "../models/machines";
import { MachinesService } from "../services/machines-service";

@injectable()
export class MachinesController {
  constructor(
    @inject(Logger) private logger: Logger,
    @inject(MachinesService) private machinesService: MachinesService,
    @inject(MachineDtoMapper) private machineDtoMapper: MachineDtoMapper
  ) {}

  public getAll = async (req: any, res: any, next: any) => {
    try {
      // get all machines 
      const machines: Machine[] = await this.machinesService.getAll(
        req.query.gymId
      );
      // map all machines to dto
      const machinesDto: MachineDto[] = machines.map((machine) =>
        this.machineDtoMapper.asDto(machine)
      );

      next(machinesDto);
    } catch (err) {
      this.logger.error(`cannot get all machines`, err);
      next(err);
    }
  };

  public getBySerialNumber = async (req: any, res: any, next: any) => {
    try {
      // get by serial number 
      const machine: Machine = await this.machinesService.getBySerialNumber(
        req.query.serialNumber
      );
      next(this.machineDtoMapper.asDto(machine));
    } catch (err) {
      this.logger.error(
        `cannot get machine with serial number ${req.query.serialNumber}`,
        err
      );
      next(err);
    }
  };

  public createMachine = async (req: any, res: any, next: any) => {
    let machineToCreate: Machine = null;
    try {
      // get machine from db
      machineToCreate = this.machineDtoMapper.asEntity(req.body);

      const createdMachine: Machine = await this.machinesService.create(
        machineToCreate
      );

      res.status(201);

      // return as dto
      next(this.machineDtoMapper.asDto(createdMachine));
    } catch (err) {
      this.logger.error(
        `Cannot create machine ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public update = async (req: any, res: any, next: any) => {
    let machineToUpdate: Machine = null;
    try {
      machineToUpdate = this.machineDtoMapper.asEntity(req.body);

      const updatedMachine: Machine = await this.machinesService.update(
        machineToUpdate
      );

      res.status(201);

      next(this.machineDtoMapper.asDto(updatedMachine));
    } catch (err) {
      this.logger.error(
        `Cannot update machine ${JSON.stringify(req.body)}`,
        err
      );
      next(err);
    }
  };

  public delete = async (req: any, res: any, next: any) => {
    let machineSerialNumber: string;
    let gymId: number;
    try {
      // get machine serial number and gym id from query params 
      machineSerialNumber = req.query.serialNumber;
      gymId = req.query.gymId;

      await this.machinesService.delete(machineSerialNumber, gymId);

      next(
        `machine with Serial number ${machineSerialNumber} has been deleted succesfuly`
      );
    } catch (err) {
      this.logger.error(`Cannot delete machine: ${machineSerialNumber}`, err);
      next(err);
    }
  };
}
