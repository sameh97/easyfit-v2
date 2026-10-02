import { SocketTopics } from '../shared/util/socket-util';

export class AppNotificationMessage {
  id: number;
  content: any;
  topic: string;
  gymId: number;
  // username: string;
  // time: Date;
  seen: boolean;
  targetObjectId: string;
  createdAt: Date;
  updatedAt: Date;
  // targetUserIds: string[];

  constructor(data: any, topic: string, gymId: number) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    this.content = data;
    this.gymId = gymId;
    // this.username = username;
    this.topic = topic;
    // this.targetUserIds = data.targetUserIds ? data.targetUserIds : null;
    // this.time = new Date();
  }
}
