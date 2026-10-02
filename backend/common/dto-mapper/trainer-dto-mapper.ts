import { injectable } from "inversify";
import { TrainerDto } from "../../models/dto/trainer-dto";
import { Trainer } from "../../models/trainer";
import { AppUtils } from "../app-utils";

@injectable()
export class TrainerDtoMapper{
    public asDto(trainer : Trainer) : TrainerDto{
        if(!AppUtils.hasValue(trainer)){
            return null;
        }

        return{
            id : trainer.id,
            firstName :trainer.firstName,
            lastName : trainer.lastName,
            phone : trainer.phone,
            birthDay : trainer.birthDay,
            email : trainer.email,
            address : trainer.address,
            isActive : trainer.isActive,
            joinDate : trainer.joinDate,
            imageURL: trainer.imageURL,
            certificationDate : trainer.certificationDate,
            gymId: trainer.gymId
        }as TrainerDto;
    }

    public asEntity(trainerDto : TrainerDto) : Trainer{
        if(!AppUtils.hasValue(trainerDto)){
            return null;
        }

        return {
            id: trainerDto.id,
            firstName: trainerDto.firstName,
            lastName: trainerDto.lastName,
            birthDay: trainerDto.birthDay,
            email: trainerDto.email,
            address: trainerDto.address,
            isActive: trainerDto.isActive,
            joinDate: trainerDto.joinDate,
            imageURL: trainerDto.imageURL,
            certificationDate : trainerDto.certificationDate,
            phone: trainerDto.phone,
            gymId: trainerDto.gymId,
          } as Trainer;
    }
}