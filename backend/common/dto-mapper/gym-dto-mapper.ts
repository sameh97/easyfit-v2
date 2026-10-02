import { injectable } from "inversify";
import { GymDto } from "../../models/dto/gym-dto";
import { MemberDto } from "../../models/dto/member-dto";
import { Gym } from "../../models/gym";
import { Member } from "../../models/member";
import { AppUtils } from "../app-utils";

@injectable()
export class GymDtoMapper {
  public asDto(gym: Gym): GymDto {
    if (!AppUtils.hasValue(gym)) {
      return null;
    }

    return {
      id: gym.id,
      name: gym.name,
      phone: gym.phone,
      address: gym.address,
      //TODO: check if we need to include user and members:
    } as GymDto;
  }

  public asEntity(gymDto: GymDto): Gym {
    if (!AppUtils.hasValue(gymDto)) {
      return null;
    }

    return {
      id: gymDto.id,
      name: gymDto.name,
      phone: gymDto.phone,
      address: gymDto.address,
    } as Gym;
  }
}
