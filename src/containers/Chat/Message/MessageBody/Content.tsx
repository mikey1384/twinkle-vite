import React from 'react';
import { css } from '@emotion/css';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import Chess from '../../Chess';
import Omok from '../../Omok';
import { MessageStyle } from '../../Styles';
import ApprovalRequest from './ApprovalRequest';
import DrawOffer from './DrawOffer';
import FileAttachment from './FileAttachment';
import Invitation from './Invitation';
import ModificationNotice from './ModificationNotice';
import Reactions from './Reactions';
import RewardMessage from './RewardMessage';
import TargetChessPosition from './TargetChessPosition';
import TargetMessage from './TargetMessage';
import TargetSubject from './TargetSubject';
import TextMessage from './TextMessage';
import { getUserChatSquareColors } from '~/containers/Chat/Chess/helpers/theme';

interface Props {
  appliedUsername: string;
  channelId: number;
  chessSpoilerOff: boolean;
  chessThemeVersion: number;
  currentChannel: any;
  displayedThemeColor: string;
  extractedUrl: string;
  handleAddReaction: (reaction: any) => void;
  handleChessSpoilerClick: () => void;
  handleEditCancel: () => void;
  handleEditDone: (editedMessage: any) => Promise<any>;
  handleHideAttachment: () => Promise<void>;
  handleOmokSpoilerClick: () => void;
  handleRemoveReaction: (reaction: any) => void;
  hasChessBoardState: boolean;
  hasOmokBoardState: boolean;
  isAIMessage: boolean;
  isApprovalRequest: boolean;
  isCallMsg: boolean;
  isChessCountdownActive?: boolean;
  isChessDiscussion: boolean;
  isCielMessage?: boolean;
  isCurrentlyStreaming: boolean;
  isDrawOffer: boolean;
  isEditing: boolean;
  isLastMsg: boolean;
  isMenuButtonsAllowed: boolean;
  isModificationNotice: boolean;
  isNotification: boolean;
  isOmokCountdownActive?: boolean;
  loading: boolean;
  message: any;
  myId: number;
  omokSpoilerOff: boolean;
  onAcceptGroupInvitation: (v: any) => void;
  onAcceptRewind: (v: any) => void;
  onCancelRewindRequest: () => void;
  onChessBoardClick: () => void;
  onDeclineRewind: () => void;
  onOmokBoardClick: () => void;
  onRequestRewind: (v: any) => void;
  onSetChessTarget: (v: any) => void;
  onShowSubjectMsgsModal: (v: any) => void;
  partner: any;
  reactionsMenuShown: boolean;
  recentThumbUrl: string;
  socketConnected: boolean;
  uploadStatus: any;
  userCanEditThis: boolean;
  userId: number;
}

export default function Content({
  appliedUsername,
  channelId,
  chessSpoilerOff,
  chessThemeVersion,
  currentChannel,
  displayedThemeColor,
  extractedUrl,
  handleAddReaction,
  handleChessSpoilerClick,
  handleEditCancel,
  handleEditDone,
  handleHideAttachment,
  handleOmokSpoilerClick,
  handleRemoveReaction,
  hasChessBoardState,
  hasOmokBoardState,
  isAIMessage,
  isApprovalRequest,
  isCallMsg,
  isChessCountdownActive,
  isChessDiscussion,
  isCielMessage,
  isCurrentlyStreaming,
  isDrawOffer,
  isEditing,
  isLastMsg,
  isMenuButtonsAllowed,
  isModificationNotice,
  isNotification,
  isOmokCountdownActive,
  loading,
  message,
  myId,
  omokSpoilerOff,
  onAcceptGroupInvitation,
  onAcceptRewind,
  onCancelRewindRequest,
  onChessBoardClick,
  onDeclineRewind,
  onOmokBoardClick,
  onRequestRewind,
  onSetChessTarget,
  onShowSubjectMsgsModal,
  partner,
  reactionsMenuShown,
  recentThumbUrl,
  socketConnected,
  uploadStatus,
  userCanEditThis,
  userId
}: Props) {
  const {
    id: messageId,
    aiThinkingStatus,
    aiThoughtContent,
    attachmentHidden,
    chessState,
    omokState,
    content,
    fileToUpload,
    fileName,
    filePath,
    fileSize,
    gameWinnerId,
    invitePath,
    invitationChannelId,
    isAbort,
    isDraw,
    isReloadedSubject,
    isSubject,
    moveViewTimeStamp,
    numMsgs,
    rewardAmount,
    rewardReason,
    rootId,
    subjectId,
    thumbUrl,
    targetMessage,
    targetSubject
  } = message;

  return (
    <div>
      {isApprovalRequest ? (
        <ApprovalRequest
          displayedThemeColor={displayedThemeColor}
          userId={userId}
          username={appliedUsername}
          requestId={rootId}
          messageId={messageId}
        />
      ) : isModificationNotice ? (
        <ModificationNotice
          modificationId={rootId}
          username={appliedUsername}
        />
      ) : invitePath ? (
        <Invitation
          sender={{ id: userId, username: appliedUsername }}
          channelId={channelId}
          invitationChannelId={invitationChannelId}
          invitePath={invitePath}
          messageId={messageId}
          onAcceptGroupInvitation={onAcceptGroupInvitation}
        />
      ) : isDrawOffer ? (
        <DrawOffer
          myId={myId}
          userId={userId}
          username={appliedUsername}
          onClick={onChessBoardClick}
        />
      ) : hasOmokBoardState ? (
        <Omok
          channelId={channelId}
          isCountdownActive={isOmokCountdownActive}
          gameWinnerId={gameWinnerId}
          initialState={omokState}
          lastOmokMessageId={currentChannel.lastOmokMessageId}
          loaded={socketConnected}
          messageId={messageId}
          moveViewed={!!moveViewTimeStamp}
          myId={myId}
          onBoardClick={onOmokBoardClick}
          onSpoilerClick={handleOmokSpoilerClick}
          opponentId={partner?.id}
          opponentName={partner?.username}
          senderId={userId}
          spoilerOff={omokSpoilerOff}
          isDraw={!!isDraw}
          isAbort={!!isAbort}
          displaySize="inline"
          style={{ marginTop: '1rem', width: '100%' }}
        />
      ) : hasChessBoardState ? (
        <Chess
          key={chessThemeVersion}
          loaded
          moveViewed={!!moveViewTimeStamp}
          channelId={channelId}
          isCountdownActive={isChessCountdownActive}
          gameWinnerId={gameWinnerId}
          spoilerOff={chessSpoilerOff}
          messageId={messageId}
          myId={myId}
          initialState={chessState}
          lastChessMessageId={currentChannel.lastChessMessageId}
          latestChessBoardMessageId={currentChannel.latestChessBoardMessageId}
          onBoardClick={onChessBoardClick}
          onRewindClick={() =>
            onRequestRewind({
              ...(chessState.previousState || chessState),
              isDiscussion: true,
              isRewindRequest: true
            })
          }
          onDiscussClick={() => {
            onSetChessTarget({
              chessState: {
                ...chessState,
                isRewinded: false,
                rewindRequestId: null,
                isRewindRequest: false
              },
              messageId,
              channelId
            });
          }}
          onSpoilerClick={handleChessSpoilerClick}
          opponentId={partner?.id}
          opponentName={partner?.username}
          senderId={userId}
          displaySize="inline"
          style={{ marginTop: '1rem', width: '100%' }}
          squareColors={getUserChatSquareColors(myId)}
        />
      ) : fileToUpload && !loading ? (
        <FileUploadStatusIndicator
          key={channelId}
          theme={displayedThemeColor}
          fileName={fileToUpload.name}
          uploadProgress={uploadStatus.uploadProgress}
        />
      ) : (
        <>
          {isChessDiscussion && (
            <TargetChessPosition
              chessState={chessState}
              channelId={channelId}
              messageId={messageId}
              myId={myId}
              userId={userId}
              username={appliedUsername}
              gameState={currentChannel?.gameState?.chess || {}}
              latestChessBoardMessageId={
                currentChannel.latestChessBoardMessageId
              }
              onCancelRewindRequest={onCancelRewindRequest}
              onAcceptRewind={onAcceptRewind}
              onDeclineRewind={onDeclineRewind}
              onRequestRewind={onRequestRewind}
            />
          )}
          {targetSubject && currentChannel?.selectedTab !== 'topic' && (
            <ErrorBoundary componentPath="Chat/Message/MessageBody/TargetSubject">
              <TargetSubject subject={targetSubject} />
            </ErrorBoundary>
          )}
          {targetMessage && (
            <ErrorBoundary componentPath="Chat/Message/MessageBody/TargetMessage">
              <TargetMessage
                displayedThemeColor={displayedThemeColor}
                message={targetMessage}
              />
            </ErrorBoundary>
          )}
          {filePath && fileName && (
            <ErrorBoundary componentPath="Chat/Message/MessageBody/FileAttachment">
              <FileAttachment
                fileName={fileName}
                filePath={filePath}
                fileSize={fileSize}
                messageId={messageId}
                theme={displayedThemeColor}
                thumbUrl={thumbUrl || recentThumbUrl}
              />
            </ErrorBoundary>
          )}
          {rewardAmount ? (
            <RewardMessage
              rewardAmount={rewardAmount}
              rewardReason={rewardReason}
            />
          ) : (
            <TextMessage
              aiThinkingStatus={aiThinkingStatus}
              aiThoughtContent={aiThoughtContent}
              aiThoughtIsThinkingHard={message.aiThoughtIsThinkingHard}
              attachmentHidden={attachmentHidden}
              content={content}
              displayedThemeColor={displayedThemeColor}
              extractedUrl={extractedUrl}
              isAIMessage={isAIMessage}
              isCurrentlyStreaming={isCurrentlyStreaming}
              messageId={messageId}
              numMsgs={numMsgs}
              isCielMessage={isCielMessage}
              isCallMsg={isCallMsg}
              isNotification={isNotification}
              isSubject={!!isSubject}
              isReloadedSubject={!!isReloadedSubject}
              MessageStyle={MessageStyle}
              isLastMsg={isLastMsg}
              isEditing={isEditing}
              onEditCancel={handleEditCancel}
              onEditDone={handleEditDone}
              onHideAttachment={handleHideAttachment}
              onShowSubjectMsgsModal={onShowSubjectMsgsModal}
              socketConnected={socketConnected}
              subjectId={subjectId}
              userCanEditThis={userCanEditThis}
            />
          )}
          {message.settings?.saveFailed && (
            <div
              className={css`
                margin-top: 0.75rem;
                color: ${Color.red()};
                font-size: 1.2rem;
                font-weight: bold;
              `}
            >
              Message failed to send. Copy it and try again.
            </div>
          )}
          {!isEditing && !isNotification && (
            <div style={{ marginTop: '2rem', height: '2.5rem' }}>
              {isMenuButtonsAllowed && (
                <Reactions
                  reactions={message.reactions}
                  reactionsMenuShown={reactionsMenuShown}
                  onRemoveReaction={handleRemoveReaction}
                  onAddReaction={handleAddReaction}
                  theme={displayedThemeColor}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
