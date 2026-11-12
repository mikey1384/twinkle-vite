import { createContext, type Dispatch, type SetStateAction } from 'react';

// The same channel controls used by an original card, shared by its quotes in
// the message list and in the reply composer.
export interface ReplyTargetEnvironment {
  channelId: number;
  displayedThemeColor: string;
  selectedTab: string;
  currentTransactionId: number;
  partner?: { id: number; username: string };
  groupObjs: Record<number, any>;
  onSetGroupObjs: Dispatch<SetStateAction<Record<number, any>>>;
  isAICardModalShown: boolean;
  onSetAICardModalCardId: (id: number) => void;
  onSetTransactionModalShown: (shown: boolean) => void;
  onChessBoardClick: () => void;
  chessGameState: any;
  latestChessBoardMessageId: number;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (state: any) => void;
  onDeclineRewind: () => void;
  onRequestRewind: (state: any) => void;
}

export const ReplyTargetEnvironmentContext =
  createContext<ReplyTargetEnvironment | null>(null);
