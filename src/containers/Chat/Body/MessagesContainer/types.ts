import type { RefObject } from 'react';

export interface ChatPartner {
  id: number;
  username: string;
}

export interface MessagesContainerProps {
  channelName?: string;
  partner?: ChatPartner;
  currentChannel: any;
  currentPathId: string | number;
  displayedThemeColor: string;
  isAICardModalShown: boolean;
  MessagesRef: RefObject<any>;
  onSetAICardModalCardId: (cardId: number) => void;
  subchannelId?: number;
  subchannelPath?: string;
  topicSelectorModalShown: boolean;
  onScrollToBottom: () => void;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
}

export interface DeleteModalState {
  shown: boolean;
  fileName: string;
  filePath: string;
  messageId: number | null;
}

export interface SubjectMsgsModalState {
  shown: boolean;
  subjectId: number;
  content: string;
}

export type BoardCountdownState = Record<
  number,
  Partial<Record<'chess' | 'omok', number | null>>
>;

export interface AiMessageSaveErrorPayload {
  content?: string;
  error?: any;
  aiUsagePolicy?: any;
  channelId?: number;
  subchannelId?: number;
  topicId?: number;
}

export type MessageInputSetTextHandler = (text: string) => void;
export type AiUsagePolicyUpdateHandler = (policy?: any) => void;
export type AiMessageSaveErrorHandler = (
  payload: AiMessageSaveErrorPayload
) => void;
