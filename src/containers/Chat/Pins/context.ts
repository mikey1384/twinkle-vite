import { createContext, useContext } from 'react';
import type { ChatPinHistory, ChatPinSnapshot } from '~/helpers/chatPins';

export interface ChatPinsController {
  snapshot: ChatPinSnapshot | null;
  loading: boolean;
  loadingMore: boolean;
  savingId: number | null;
  error: string;
  dialogShown: boolean;
  history: ChatPinHistory | null;
  historyLoading: boolean;
  highlightId: number;
  showDialog: () => void;
  hideDialog: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setPin: (messageId: number, pinned: boolean) => Promise<void>;
  jump: (messageId: number) => Promise<void>;
  loadHistory: (direction: 'older' | 'newer') => Promise<void>;
  leaveHistory: () => void;
}

export const ChatPinsContext = createContext<ChatPinsController | null>(null);
export const useChatPins = () => useContext(ChatPinsContext);
