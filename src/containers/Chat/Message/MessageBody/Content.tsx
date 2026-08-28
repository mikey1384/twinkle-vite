import React from 'react';
import { css } from '@emotion/css';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import Chess from '../../Chess';
import ChessGameRecord from '../../Chess/GameRecord';
import Omok from '../../Omok';
import { MessageStyle } from '../../Styles';
import ApprovalRequest from './ApprovalRequest';
import BuildCollaborationRequest from './BuildCollaborationRequest';
import BuildContributionSubmission from './BuildContributionSubmission';
import BuildThumbnailSuggestion from './BuildThumbnailSuggestion';
import BuildContributionInvite from './BuildContributionInvite';
import BuildProjectLimitRequest from './BuildProjectLimitRequest';
import DrawOffer from './DrawOffer';
import FileAttachment from './FileAttachment';
import Invitation from './Invitation';
import ModificationNotice from './ModificationNotice';
import Reactions from './Reactions';
import type { PendingReactionMutations } from './Reactions/types';
import RewardMessage from './RewardMessage';
import TargetChessPosition from './TargetChessPosition';
import TargetMessage from './TargetMessage';
import TargetSubject from './TargetSubject';
import TextMessage from './TextMessage';
import { parseMessageSettings } from './messageSettings';
import { getUserChatSquareColors } from '~/containers/Chat/Chess/helpers/theme';

interface Props {
  appliedUsername: string;
  channelId: number;
  chessSpoilerOff: boolean;
  chessThemeVersion: number;
  currentChannel: any;
  displayedThemeColor: string;
  extractedUrl: string;
  handleAddReaction: (reaction: string) => void;
  handleChessSpoilerClick: () => void;
  handleEditCancel: () => void;
  handleEditDone: (editedMessage: any) => Promise<any>;
  handleHideAttachment: () => Promise<void>;
  handleOmokSpoilerClick: () => void;
  handleRemoveReaction: (reaction: string) => void;
  hasChessBoardState: boolean;
  hasOmokBoardState: boolean;
  isAIMessage: boolean;
  isApprovalRequest: boolean;
  isCallMsg: boolean;
  isChessCountdownActive?: boolean;
  isChessDiscussion: boolean;
  isCielMessage?: boolean;
  isCurrentlyStreaming: boolean;
  isDeleteOnlyBuildSuggestion: boolean;
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
  pendingReactionMutations: PendingReactionMutations;
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
  isDeleteOnlyBuildSuggestion,
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
  pendingReactionMutations,
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
    profileTheme,
    rewardAmount,
    rewardReason,
    rootType,
    rootId,
    settings,
    subjectId,
    thumbUrl,
    targetMessage,
    targetSubject
  } = message;
  const parsedSettings = parseMessageSettings(settings);

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
      ) : rootType === 'buildContributionInvite' && rootId ? (
        <BuildContributionInvite
          channelId={channelId}
          content={content}
          invite={parsedSettings?.buildContributionInvite}
          myId={myId}
          sender={{
            id: userId,
            username: appliedUsername,
            profileTheme
          }}
        />
      ) : rootType === 'buildCollaborationRequest' && rootId ? (
        <BuildCollaborationRequest
          content={content}
          request={parsedSettings?.buildCollaborationRequest}
          myId={myId}
          sender={{
            id: userId,
            username: appliedUsername,
            profileTheme
          }}
        />
      ) : rootType === 'buildThumbnailSuggestion' && rootId ? (
        <BuildThumbnailSuggestion
          content={content}
          messageId={messageId}
          suggestion={parsedSettings?.buildThumbnailSuggestion}
          myId={myId}
          sender={{
            id: userId,
            username: appliedUsername,
            profileTheme
          }}
        />
      ) : rootType === 'buildContributionSubmission' && rootId ? (
        <BuildContributionSubmission
          content={content}
          submission={parsedSettings?.buildContributionSubmission}
          myId={myId}
          sender={{
            id: userId,
            username: appliedUsername,
            profileTheme
          }}
        />
      ) : rootType === 'buildProjectLimitRequest' && rootId ? (
        <BuildProjectLimitRequest
          request={parsedSettings?.buildProjectLimitRequest}
          myId={myId}
          sender={{
            id: userId,
            username: appliedUsername,
            profileTheme
          }}
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
        <>
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
          {!chessState?.isDiscussion && !chessState?.isRewindRequest && (
            <ChessGameRecord
              channelId={channelId}
              messageId={messageId}
              showPgn={Boolean(
                gameWinnerId ||
                isDraw ||
                isAbort ||
                chessState?.isCheckmate ||
                chessState?.isStalemate ||
                chessState?.isDraw
              )}
              style={{ marginTop: '0.5rem' }}
            />
          )}
        </>
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
              isAIEdited={!!parsedSettings?.aiEdit || !!message.isAIEdited}
              isCurrentlyStreaming={isCurrentlyStreaming}
              messageId={messageId}
              numMsgs={numMsgs}
              isCielMessage={isCielMessage}
              isCallMsg={isCallMsg}
              isGenerationConfirmed={
                parsedSettings?.aiGenerationStatus === 'generating'
              }
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
          {parsedSettings?.saveFailed && (
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
          {!isEditing &&
            isMenuButtonsAllowed &&
            !isDeleteOnlyBuildSuggestion && (
              <div style={{ marginTop: '2rem', height: '2.5rem' }}>
                <Reactions
                  pendingReactionMutations={pendingReactionMutations}
                  reactions={message.reactions}
                  reactionsMenuShown={reactionsMenuShown}
                  onRemoveReaction={handleRemoveReaction}
                  onAddReaction={handleAddReaction}
                  theme={displayedThemeColor}
                />
              </div>
            )}
        </>
      )}
    </div>
  );
}
