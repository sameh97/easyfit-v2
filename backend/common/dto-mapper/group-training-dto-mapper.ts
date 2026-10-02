import { injectable } from "inversify";
import { GroupTrainingDto } from "../../models/dto/group-training-dto";
import { GroupTraining } from "../../models/group-training";
import { AppUtils } from "../app-utils";

@injectable()
export class GroupTrainingDtoMapper {
  public asDto(groupTraining: GroupTraining): GroupTrainingDto {
    if (!AppUtils.hasValue(groupTraining)) {
      return null;
    }

    return {
      id: groupTraining.id,
      startTime: groupTraining.startTime,
      description: groupTraining.description,
      trainerId: groupTraining.trainerId,
      gymId: groupTraining.gymId,
      members: groupTraining.members,
    } as GroupTrainingDto;
  }

  public asEntity(groupTrainingDto: GroupTrainingDto): GroupTraining {
    if (!AppUtils.hasValue(groupTrainingDto)) {
      return null;
    }

    return {
      id: groupTrainingDto.id,
      startTime: groupTrainingDto.startTime,
      description: groupTrainingDto.description,
      trainerId: groupTrainingDto.trainerId,
      gymId: groupTrainingDto.gymId,
      members: groupTrainingDto.members,
    } as GroupTraining;
  }
}
