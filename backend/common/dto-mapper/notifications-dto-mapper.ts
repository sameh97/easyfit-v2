import { injectable } from "inversify";
import { AppNotification } from "../../models/app-notification";
import { AppNotificationDto } from "../../models/dto/notifications-dto";
import { AppUtils } from "../app-utils";

@injectable()
export class NotificationsDtoMapper {
  public asDto(notification: AppNotification): AppNotificationDto {
    if (!AppUtils.hasValue(notification)) {
      return null;
    }

    return {
      id: notification.id,
      content: JSON.parse(notification.content),
      topic: notification.topic,
      gymId: notification.gymId,
      seen: notification.seen,
      targetObjectId: notification.targetObjectId,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    } as AppNotificationDto;
  }

  public asEntity(notificationDto: AppNotificationDto): AppNotification {
    if (!AppUtils.hasValue(notificationDto)) {
      return null;
    }

    return {
      id: notificationDto.id,
      content: JSON.stringify(notificationDto.content),
      topic: notificationDto.topic,
      gymId: notificationDto.gymId,
      seen: notificationDto.seen,
      targetObjectId: notificationDto.targetObjectId,
    } as AppNotification;
  }
}
