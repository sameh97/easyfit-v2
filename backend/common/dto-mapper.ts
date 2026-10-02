import { AppUtils } from "./app-utils";
import { injectable } from "inversify";
import { User } from "../models/user";
import { UserDto } from "../models/dto/user-dto";

@injectable()
export class DtoMapper {
  public asDto(user: User): UserDto {
    if (!AppUtils.hasValue(user)) {
      return null;
    }
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      createdAt: user.createdAt,
      imageURL: user.imageURL,
      birthDay: user.birthDay,
      address: user.address,
      gymId: user.gymId,
    } as UserDto;
  }

  public asEntity(userDto: UserDto): User {
    if (!AppUtils.hasValue(userDto)) {
      return null;
    }
    return {
      id: userDto.id,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      email: userDto.email,
      phone: userDto.phone,
      roleId: userDto.roleId,
      imageURL: userDto.imageURL,
      birthDay: userDto.birthDay,
      address: userDto.address,
      password: userDto.password,
      gymId: userDto.gymId,
    } as User;
  }
}

