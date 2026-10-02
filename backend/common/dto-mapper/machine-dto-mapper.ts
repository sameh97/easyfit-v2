import { injectable } from "inversify";
import { MachineDto } from "../../models/dto/machine-dto";
import { Machine } from "../../models/machines";
import { AppUtils } from "../app-utils";

@injectable()
export class MachineDtoMapper {
  public asDto = (machine: Machine): MachineDto => {
    if (!AppUtils.hasValue(machine)) {
      return null;
    }

    return {
      id: machine.id,
      name: machine.name,
      description: machine.description,
      productionYear: machine.productionYear,
      serialNumber: machine.serialNumber,
      price: machine.price,
      imgUrl: machine.imgUrl,
      gymId: machine.gymId,
    } as MachineDto;
  };

  public asEntity = (machineDto: MachineDto): Machine => {
    if (!AppUtils.hasValue(machineDto)) {
      return null;
    }

    return {
      id: machineDto.id,
      name: machineDto.name,
      description: machineDto.description,
      productionYear: machineDto.productionYear,
      serialNumber: machineDto.serialNumber,
      imgUrl: machineDto.imgUrl,
      price: machineDto.price,
      gymId: machineDto.gymId,
    } as Machine;
  };
}
