import { injectable } from "inversify";
import { TempUrlDto } from "../../models/dto/temp-url-dto";
import { TempUrl } from "../../models/temp-url";
import { AppUtils } from "../app-utils";

@injectable()
export class TempUrlDtoMapper {
  public asDto(tempUrl: TempUrl): TempUrlDto {
    if (!AppUtils.hasValue(tempUrl)) {
      return null;
    }

    return {
      uuid: tempUrl.uuid,
      durationDays: tempUrl.durationDays,
      isActive: tempUrl.isActive,
      gymId: tempUrl.gymId,
      products: tempUrl.products,
      createdAt: tempUrl.createdAt,
    } as TempUrlDto;
  }

  public asEntity(tempUrlDto: TempUrlDto): TempUrl {
    if (!AppUtils.hasValue(tempUrlDto)) {
      return null;
    }

    return {
      uuid: tempUrlDto.uuid,
      durationDays: tempUrlDto.durationDays,
      isActive: tempUrlDto.isActive,
      gymId: tempUrlDto.gymId,
      products: tempUrlDto.products,
    } as TempUrl;
  }
}
