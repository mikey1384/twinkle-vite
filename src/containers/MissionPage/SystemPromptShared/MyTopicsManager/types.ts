export interface MyTopic {
  id: number;
  channelId: number;
  content: string;
  customInstructions: string;
  isSharedWithOtherUsers: boolean;
  sharedAt: number | null;
  timeStamp: number;
  cloneCount?: number;
  messageCount?: number;
  numComments?: number;
}

