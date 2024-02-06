import React from 'react';
import MessageBody from './MessageBody';

export default function Message({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
  forceRefreshForMobile,
  index,
  isAICardModalShown,
  isLastMsg,
  isOneOfVisibleMessages,
  isNotification,
  isRestricted,
  isBanned,
  loading,
  message,
  nextMessageHasTopic,
  prevMessageHasTopic,
  onAcceptGroupInvitation,
  onChessBoardClick,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onDelete,
  onChessSpoilerClick,
  onReceiveNewMessage,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetChessTarget,
  onSetTransactionModalShown,
  onScrollToBottom,
  onShowSubjectMsgsModal,
  zIndex
}: {
  chessCountdownNumber: number;
  partner: any;
  channelId: number;
  currentChannel: any;
  displayedThemeColor: string;
  forceRefreshForMobile: () => void;
  isAICardModalShown: boolean;
  message: any;
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  onDelete: (v: any) => void;
  index: number;
  isBanned: boolean;
  isLastMsg: boolean;
  isOneOfVisibleMessages: boolean;
  isNotification: boolean;
  isRestricted: boolean;
  loading: boolean;
  onAcceptGroupInvitation: (v: any) => void;
  onChessBoardClick: () => void;
  onChessSpoilerClick: (v: number) => void;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onReceiveNewMessage: () => void;
  onReplyClick: () => void;
  onRequestRewind: (v: any) => void;
  onSetAICardModalCardId: (v: any) => void;
  onSetChessTarget: (v: any) => void;
  onSetTransactionModalShown: (v: boolean) => void;
  onRewardMessageSubmit: (v: any) => void;
  onScrollToBottom: () => void;
  onShowSubjectMsgsModal: (v: any) => void;
  zIndex?: number;
}) {
  return (
    <MessageBody
      channelId={channelId}
      chessCountdownNumber={chessCountdownNumber}
      partner={partner}
      currentChannel={currentChannel}
      displayedThemeColor={displayedThemeColor}
      forceRefreshForMobile={forceRefreshForMobile}
      isAICardModalShown={isAICardModalShown}
      message={message}
      nextMessageHasTopic={nextMessageHasTopic}
      prevMessageHasTopic={prevMessageHasTopic}
      onDelete={onDelete}
      index={index}
      isBanned={isBanned}
      isLastMsg={isLastMsg}
      isOneOfVisibleMessages={isOneOfVisibleMessages}
      isNotification={isNotification}
      isRestricted={isRestricted}
      loading={loading}
      onAcceptGroupInvitation={onAcceptGroupInvitation}
      onChessBoardClick={onChessBoardClick}
      onChessSpoilerClick={onChessSpoilerClick}
      onCancelRewindRequest={onCancelRewindRequest}
      onAcceptRewind={onAcceptRewind}
      onDeclineRewind={onDeclineRewind}
      onReceiveNewMessage={onReceiveNewMessage}
      onReplyClick={onReplyClick}
      onRequestRewind={onRequestRewind}
      onSetAICardModalCardId={onSetAICardModalCardId}
      onSetChessTarget={onSetChessTarget}
      onSetTransactionModalShown={onSetTransactionModalShown}
      onRewardMessageSubmit={onRewardMessageSubmit}
      onScrollToBottom={onScrollToBottom}
      onShowSubjectMsgsModal={onShowSubjectMsgsModal}
      zIndex={zIndex}
    />
  );
}
