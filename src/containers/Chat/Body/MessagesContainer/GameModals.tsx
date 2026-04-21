import React from 'react';
import ChessModal from '../../Modals/GameModals/ChessModal';
import OmokModal from '../../Modals/GameModals/OmokModal';
import WordleModal from '../../Modals/WordleModal';
import type { BoardCountdownState, ChatPartner } from './types';

export default function GameModals({
  boardCountdownObj,
  channelName,
  chessModalShown,
  currentChannel,
  displayedThemeColor,
  omokModalShown,
  onAcceptRewind,
  onCancelRewindRequest,
  onChessSpoilerClick,
  onConfirmChessMove,
  onConfirmOmokMove,
  onDeclineRewind,
  onHideChessModal,
  onHideOmokModal,
  onHideWordleModal,
  onOmokSpoilerClick,
  onScrollToBottom,
  partner,
  selectedChannelId,
  socketConnected,
  userId,
  wordleAttemptState,
  wordleGuesses,
  wordleModalShown,
  wordleSolution,
  wordleStats,
  wordleWordLevel
}: {
  boardCountdownObj: BoardCountdownState;
  channelName?: string;
  chessModalShown: boolean;
  currentChannel: any;
  displayedThemeColor: string;
  omokModalShown: boolean;
  onAcceptRewind: (...args: any[]) => void;
  onCancelRewindRequest: (...args: any[]) => void;
  onChessSpoilerClick: (senderId: number) => void;
  onConfirmChessMove: (...args: any[]) => void;
  onConfirmOmokMove: (...args: any[]) => void;
  onDeclineRewind: (...args: any[]) => void;
  onHideChessModal: () => void;
  onHideOmokModal: () => void;
  onHideWordleModal: () => void;
  onOmokSpoilerClick: (senderId: number) => void;
  onScrollToBottom: () => void;
  partner?: ChatPartner;
  selectedChannelId: number;
  socketConnected: boolean;
  userId: number;
  wordleAttemptState: any;
  wordleGuesses: any[];
  wordleModalShown: boolean;
  wordleSolution: any;
  wordleStats: any;
  wordleWordLevel: any;
}) {
  return (
    <>
      {chessModalShown && partner && (
        <ChessModal
          currentChannel={currentChannel}
          channelId={selectedChannelId}
          isCountdownActive={!!boardCountdownObj[selectedChannelId]?.chess}
          myId={userId}
          onConfirmChessMove={onConfirmChessMove}
          onHide={onHideChessModal}
          onAcceptRewind={onAcceptRewind}
          onCancelRewindRequest={onCancelRewindRequest}
          onDeclineRewind={onDeclineRewind}
          onScrollToBottom={onScrollToBottom}
          onSpoilerClick={onChessSpoilerClick}
          opponentId={partner.id}
          opponentName={partner.username}
          socketConnected={socketConnected}
        />
      )}
      {omokModalShown && partner && (
        <OmokModal
          currentChannel={currentChannel}
          channelId={selectedChannelId}
          isCountdownActive={!!boardCountdownObj[selectedChannelId]?.omok}
          myId={userId}
          opponentId={partner.id}
          opponentName={partner.username}
          onConfirmOmokMove={onConfirmOmokMove}
          onHide={onHideOmokModal}
          onSpoilerClick={onOmokSpoilerClick}
          onScrollToBottom={onScrollToBottom}
          socketConnected={socketConnected}
        />
      )}
      {wordleModalShown && (
        <WordleModal
          channelId={selectedChannelId}
          channelName={channelName}
          attemptState={wordleAttemptState}
          guesses={wordleGuesses}
          solution={wordleSolution}
          wordLevel={wordleWordLevel}
          wordleStats={wordleStats}
          onHide={onHideWordleModal}
          socketConnected={socketConnected}
          theme={displayedThemeColor}
        />
      )}
    </>
  );
}
