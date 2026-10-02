export class AppNotificationMessage {
  id: string;
  content: any;
  topic: string;
  gymId: number;
  seen: boolean;
  targetObjectId: string;
  createdAt: Date;

  constructor(
    content: any,
    topic: string,
    gymId: number,
    seen: boolean,
    targetObjectId: string,
    createdAt: Date,
    id?: string
  ) {
    this.id = id;
    this.content = content;
    this.topic = topic;
    this.gymId = gymId;
    this.seen = seen;
    this.targetObjectId = targetObjectId;
    this.createdAt = createdAt;
  }
}
