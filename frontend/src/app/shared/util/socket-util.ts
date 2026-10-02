export enum SocketClientState {
  ATTEMPTING,
  CONNECTED,
  ERROR,
}

export interface StompMessage {
  body: string;
}

export function textHandler(message: StompMessage): string {
  return message.body;
}

export const SocketTopics = {
  TOPIC_CLEAN_MACHINE: '/clean-machine',
  TOPIC_GROUPED_NOTIFICATION: '/grouped-machine-notification',
  TOPIC_MACHINE_SERVICE: '/machine-service',
  TOPIC_SEND_CLIENT_DATA_TO_SERVER: 'send-client-data',
};
