import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import moment from 'moment';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { socket } from '~/constants/sockets/api';
import { fetchURLFromText } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useMyLevel } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isSupermod } from '~/helpers';
import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  GENERAL_CHAT_ID,
  BookmarkView
} from '~/constants/defaultValues';
import {
  getLatestBoardMessageId,
  getLatestGameBoundaryMessageId
} from '~/containers/Chat/helpers/gameMessageIds';
import MessageRewardModal from '../../Modals/MessageRewardModal';
import LocalContext from '../../Context';
import TransactionDetails from '../../TransactionDetails';
import { MessageStyle } from '../../Styles';
import ActionButtons from './ActionButtons';
import Content from './Content';
import GameOverMessage from './GameOverMessage';
import TopicMessagePreview from './TopicMessagePreview';
import TopicStartNotification from './TopicStartNotification';
import TransferMessage from './TransferMessage';
import type { MessageBodyProps } from './types';
import useOptimisticSave from './useOptimisticSave';
import WordleResult from './WordleResult';

function MessageBody({
  channelId,
  isChessCountdownActive,
  isOmokCountdownActive,
  partner,
  currentChannel,
  displayedThemeColor,
  groupObjs,
  index,
  isAIMessage,
  isCielMessage,
  isAICardModalShown,
  isApprovalRequest,
  isEditing,
  isModificationNotice,
  isLastMsg,
  isNotification,
  isRestricted,
  isBanned,
  loading,
  message,
  message: {
    id: messageId,
    chessState,
    omokState,
    content,
    fileToUpload,
    fileName,
    filePath,
    gameWinnerId,
    invitePath,
    isChessMsg,
    isAbort,
    isDraw,
    isDrawOffer,
    isNewMessage,
    isReloadedSubject,
    isSubject,
    moveViewTimeStamp,
    rewardAmount,
    subchannelId,
    subjectId,
    thumbUrl,
    timeStamp,
    uploaderLevel,
    userId,
    transferDetails,
    transactionDetails,
    wordleResult,
    isResign
  },
  nextMessageHasTopic,
  prevMessageHasTopic,
  onAcceptGroupInvitation,
  onChessBoardClick,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onDelete,
  onChessSpoilerClick,
  onOmokBoardClick,
  onOmokSpoilerClick,
  onReceiveNewMessage,
  onAiUsagePolicyUpdate,
  onOptimisticAiMessageSaveError,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetMessageToScrollTo,
  onSetGroupObjs,
  onSetChessTarget,
  onSetTransactionModalShown,
  onShowSubjectMsgsModal,
  recentThumbUrl,
  zIndex
}: MessageBodyProps) {
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const rewardColor = useKeyContext((v) => v.theme.reward.color);
  const myId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
  const myProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const level = useKeyContext((v) => v.myState.level);

  const bookmarkChatMessage = useAppContext(
    (v) => v.requestHelpers.bookmarkChatMessage
  );
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const { canDelete, canEdit, canReward } = useMyLevel();
  const spoilerClickedRef = useRef(false);
  const [highlighted, setHighlighted] = useState(false);
  const [reactionsMenuShown, setReactionsMenuShown] = useState(false);
  const [messageRewardModalShown, setMessageRewardModalShown] = useState(false);
  const extractedUrl = useMemo(() => fetchURLFromText(content), [content]);

  const {
    actions: {
      onAddBookmarkedMessage,
      onAddReactionToMessage,
      onEditMessage,
      onHideAttachment,
      onRemoveReactionFromMessage,
      onSaveMessage,
      onRemoveTempMessage,
      onSetMessageState,
      onSetIsEditing,
      onSetReplyTarget,
      onUpdateLastChessMessageId,
      onUpdateLastChessMoveViewerId,
      onUpdateRecentChessMessage,
      onUpdateLastOmokMessageId,
      onUpdateLastOmokMoveViewerId,
      onUpdateRecentOmokMessage
    },
    requests: {
      editChatMessage,
      hideChatAttachment,
      saveChatMessage,
      setChessMoveViewTimeStamp,
      setOmokMoveViewTimeStamp,
      postChatReaction,
      removeChatReaction
    },
    state: { filesBeingUploaded, socketConnected }
  } = useContext(LocalContext);
  const user = useAppContext((v) => v.user.state.userObj[userId]) || {};
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { username: memberName, profilePicUrl: memberProfilePicUrl } = user;
  const userIsUploader = useMemo(() => myId === userId, [myId, userId]);
  const isAIChat = useMemo(() => {
    return partner?.id === ZERO_TWINKLE_ID || partner?.id === CIEL_TWINKLE_ID;
  }, [partner?.id]);

  useEffect(() => {
    if (isLastMsg && isNewMessage && !userIsUploader) {
      onReceiveNewMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, isNewMessage, userIsUploader]);

  const userCanDeleteThis = useMemo(() => {
    if (isDrawOffer) return false;

    const hasEditOrDeletePermission = canEdit || canDelete;
    const isGeneralChannel = channelId === GENERAL_CHAT_ID;
    const hasRequiredLevel = level > uploaderLevel;
    const hasPermission =
      hasEditOrDeletePermission &&
      (isGeneralChannel || isSupermod(level)) &&
      hasRequiredLevel;

    return hasPermission || userIsUploader || isAIMessage;
  }, [
    canDelete,
    canEdit,
    channelId,
    isAIMessage,
    isDrawOffer,
    level,
    uploaderLevel,
    userIsUploader
  ]);

  const userCanEditThis = useMemo(() => {
    return (
      !rewardAmount &&
      !invitePath &&
      !isDrawOffer &&
      ((canEdit &&
        level > uploaderLevel &&
        (channelId === GENERAL_CHAT_ID || isSupermod(level))) ||
        userIsUploader)
    );
  }, [
    canEdit,
    channelId,
    invitePath,
    isDrawOffer,
    level,
    rewardAmount,
    uploaderLevel,
    userIsUploader
  ]);

  const userCanRewardThis = useMemo(
    () => canReward && level > uploaderLevel && myId !== userId,
    [canReward, level, myId, uploaderLevel, userId]
  );

  const [uploadStatus = {}] = useMemo(
    () =>
      filesBeingUploaded[
        channelId + (subchannelId ? `/${subchannelId}` : '')
      ]?.filter(
        ({ filePath: path }: { filePath: string }) => path === filePath
      ) || [],
    [channelId, filePath, filesBeingUploaded, subchannelId]
  );

  const { username, profilePicUrl, targetMessage, targetSubject, isCallMsg } =
    message;
  let appliedUsername = memberName || username;
  let appliedProfilePicUrl = memberProfilePicUrl || profilePicUrl;

  const hasOmokBoardState = useMemo(() => Boolean(omokState), [omokState]);
  const hasChessBoardState = useMemo(() => Boolean(chessState), [chessState]);
  const gameTypeForMessage = useMemo(() => {
    if (hasOmokBoardState) return 'omok';
    if (hasChessBoardState) return 'chess';
    if (message.gameType === 'omok') return 'omok';
    if (message.gameType === 'chess') return 'chess';
    const lowerCaseContent = (content || '').toLowerCase();
    if (lowerCaseContent.includes('omok')) return 'omok';
    if (lowerCaseContent.includes('chess')) return 'chess';
    return 'chess';
  }, [content, hasChessBoardState, hasOmokBoardState, message.gameType]);

  const isTerminalGameMessage = useMemo(
    () =>
      typeof gameWinnerId === 'number' || isDraw || isAbort || isResign,
    [gameWinnerId, isDraw, isAbort, isResign]
  );
  const isTerminalOmokMessage = useMemo(
    () => isTerminalGameMessage && gameTypeForMessage === 'omok',
    [gameTypeForMessage, isTerminalGameMessage]
  );
  const isTerminalChessMessage = useMemo(
    () => isTerminalGameMessage && gameTypeForMessage === 'chess',
    [gameTypeForMessage, isTerminalGameMessage]
  );

  if (fileToUpload && !userId) {
    userId = myId;
    appliedUsername = myUsername;
    appliedProfilePicUrl = myProfilePicUrl;
  }

  useOptimisticSave({
    channelId,
    currentChannel,
    hasChessBoardState,
    hasOmokBoardState,
    index,
    isCallMsg,
    level,
    message,
    onAiUsagePolicyUpdate,
    onOptimisticAiMessageSaveError,
    onRemoveTempMessage,
    onSaveMessage,
    onSetMessageState,
    onSetUserState,
    onUpdateRecentChessMessage,
    onUpdateRecentOmokMessage,
    partner,
    saveChatMessage,
    subjectId,
    subchannelId,
    targetMessage,
    targetSubject,
    thinkHardState,
    userIsUploader,
    userId
  });

  useEffect(() => {
    if (typeof messageId === 'number' && hasOmokBoardState) {
      onUpdateLastOmokMessageId({
        channelId,
        messageId,
        ...(isTerminalOmokMessage ? { terminalMessageId: messageId } : {})
      });
    } else if (typeof messageId === 'number' && hasChessBoardState) {
      onUpdateLastChessMessageId({
        channelId,
        messageId,
        ...(isTerminalChessMessage ? { terminalMessageId: messageId } : {})
      });
    } else if (isTerminalGameMessage) {
      if (gameTypeForMessage === 'omok') {
        onUpdateLastOmokMessageId({
          channelId,
          messageId: null,
          terminalMessageId: messageId
        });
      } else {
        onUpdateLastChessMessageId({
          channelId,
          messageId: null,
          terminalMessageId: messageId
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channelId,
    gameTypeForMessage,
    hasOmokBoardState,
    hasChessBoardState,
    isTerminalChessMessage,
    isTerminalGameMessage,
    isTerminalOmokMessage,
    messageId
  ]);

  const chessSpoilerOff = useMemo(() => {
    if (isChessCountdownActive) {
      return true;
    }

    const userMadeThisMove = chessState?.move?.by === myId;
    const latestBoardMessageId = getLatestBoardMessageId(currentChannel, 'chess');
    const latestBoundaryMessageId = getLatestGameBoundaryMessageId(
      currentChannel,
      'chess'
    );
    const userIsTheLastMoveViewer =
      currentChannel?.lastChessMoveViewerId === myId &&
      messageId === latestBoardMessageId;

    if (
      userMadeThisMove ||
      userIsTheLastMoveViewer ||
      !!moveViewTimeStamp ||
      (typeof messageId === 'number' &&
        typeof latestBoundaryMessageId === 'number' &&
        messageId < latestBoundaryMessageId)
    ) {
      return true;
    }

    return false;
  }, [
    chessState?.move?.by,
    currentChannel,
    isChessCountdownActive,
    messageId,
    moveViewTimeStamp,
    myId
  ]);

  const omokSpoilerOff = useMemo(() => {
    if (isOmokCountdownActive) {
      return true;
    }

    const userMadeThisMove = omokState?.move?.by === myId;
    const latestBoardMessageId = getLatestBoardMessageId(currentChannel, 'omok');
    const latestBoundaryMessageId = getLatestGameBoundaryMessageId(
      currentChannel,
      'omok'
    );
    const userIsTheLastMoveViewer =
      currentChannel?.lastOmokMoveViewerId === myId &&
      messageId === latestBoardMessageId;

    if (
      userMadeThisMove ||
      userIsTheLastMoveViewer ||
      !!moveViewTimeStamp ||
      (typeof messageId === 'number' &&
        typeof latestBoundaryMessageId === 'number' &&
        messageId < latestBoundaryMessageId)
    ) {
      return true;
    }

    return false;
  }, [
    currentChannel,
    isOmokCountdownActive,
    messageId,
    moveViewTimeStamp,
    myId,
    omokState?.move?.by
  ]);

  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const isCurrentlyStreaming = useMemo(
    () =>
      currentChannel?.currentlyStreamingAIMsgId &&
      currentChannel.currentlyStreamingAIMsgId === messageId,
    [currentChannel?.currentlyStreamingAIMsgId, messageId]
  );

  const isMenuButtonsAllowed = useMemo(
    () =>
      !!messageId &&
      !isApprovalRequest &&
      !isNotification &&
      !isCallMsg &&
      !isChessMsg &&
      !isEditing &&
      !fileToUpload,
    [
      fileToUpload,
      isApprovalRequest,
      isCallMsg,
      isChessMsg,
      isEditing,
      isNotification,
      messageId
    ]
  );

  const isChessDiscussion = useMemo(() => {
    return !!chessState?.isDiscussion;
  }, [chessState?.isDiscussion]);

  const isTopicPostNotification = useMemo(() => {
    if (
      currentChannel?.id === GENERAL_CHAT_ID ||
      currentChannel?.selectedTab === 'topic'
    ) {
      return false;
    }
    return !!message.isSubject;
  }, [currentChannel?.id, currentChannel?.selectedTab, message.isSubject]);

  const isTopicMessagePreview = useMemo(() => {
    if (currentChannel?.selectedTab === 'topic') {
      return false;
    }
    if (currentChannel?.id === GENERAL_CHAT_ID) {
      return false;
    }
    return !!targetSubject;
  }, [currentChannel?.id, currentChannel?.selectedTab, targetSubject]);

  const handleChessSpoilerClick = useCallback(async () => {
    if (spoilerClickedRef.current) return;
    spoilerClickedRef.current = true;
    onSetReplyTarget({ channelId: currentChannel.id, target: null });
    try {
      await setChessMoveViewTimeStamp({ channelId, message });
      onUpdateLastChessMoveViewerId({ channelId, viewerId: myId });
      onChessSpoilerClick(userId);
    } catch (error) {
      console.error(error);
    } finally {
      spoilerClickedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, message, userId]);

  const handleOmokSpoilerClick = useCallback(async () => {
    if (spoilerClickedRef.current) return;
    spoilerClickedRef.current = true;
    onSetReplyTarget({ channelId: currentChannel.id, target: null });
    try {
      await setOmokMoveViewTimeStamp({ channelId, message });
      onUpdateLastOmokMoveViewerId({ channelId, viewerId: myId });
      onOmokSpoilerClick(userId);
    } catch (error) {
      console.error(error);
    } finally {
      spoilerClickedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, message, userId]);

  const handleHideAttachment = useCallback(async () => {
    await hideChatAttachment(messageId);
    onHideAttachment({ messageId, channelId, subchannelId });
    socket.emit('hide_message_attachment', {
      channelId,
      messageId,
      subchannelId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, messageId, subchannelId]);

  const handleEditCancel = useCallback(() => {
    onSetIsEditing({
      contentId: messageId,
      contentType: 'chat',
      isEditing: false
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  const handleEditDone = useCallback(
    async (editedMessage: any) => {
      const messageIsSubject = !!isSubject || !!isReloadedSubject;
      try {
        const subjectChanged = await editChatMessage({
          editedMessage,
          messageId,
          isSubject: messageIsSubject,
          subjectId
        });
        onEditMessage({
          editedMessage,
          channelId,
          messageId,
          isSubject: messageIsSubject,
          subchannelId,
          subjectChanged
        });
        socket.emit('edit_chat_message', {
          channelId,
          editedMessage,
          subchannelId,
          messageId,
          isSubject: messageIsSubject
        });
        Promise.resolve();
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      } finally {
        onSetIsEditing({
          contentId: messageId,
          contentType: 'chat',
          isEditing: false
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, isReloadedSubject, isSubject, messageId, subjectId]
  );

  const handleAddReaction = useCallback(
    async (reaction: any) => {
      if (message.reactions) {
        for (const reactionObj of message.reactions) {
          if (reactionObj.type === reaction && reactionObj.userId === myId) {
            return;
          }
        }
      }
      onAddReactionToMessage({
        channelId,
        messageId,
        subchannelId,
        reaction,
        userId: myId
      });
      postChatReaction({ messageId, reaction });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, message?.reactions, messageId, myId]
  );

  const handleRemoveReaction = useCallback(
    async (reaction: any) => {
      onRemoveReactionFromMessage({
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId: myId
      });
      removeChatReaction({ messageId, reaction });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, messageId, myId]
  );

  if (isTopicPostNotification) {
    return (
      <TopicStartNotification
        messageId={messageId}
        channelId={channelId}
        theme={displayedThemeColor}
        onSetMessageToScrollTo={onSetMessageToScrollTo}
        topicObj={{ id: subjectId, title: message.content }}
        username={myId === userId ? 'You' : appliedUsername}
        pathId={currentChannel.pathId}
      />
    );
  }

  if (isTopicMessagePreview) {
    return (
      <TopicMessagePreview
        messageId={messageId}
        channelId={channelId}
        content={content}
        fileName={fileName}
        filePath={filePath}
        onSetMessageToScrollTo={onSetMessageToScrollTo}
        rewardAmount={rewardAmount}
        targetMessage={targetMessage}
        theme={displayedThemeColor}
        thumbUrl={thumbUrl || recentThumbUrl}
        topicObj={targetSubject}
        nextMessageHasTopic={nextMessageHasTopic}
        prevMessageHasTopic={prevMessageHasTopic}
        username={myId === userId ? 'You' : appliedUsername}
        pathId={currentChannel.pathId}
      />
    );
  }

  if (transferDetails) {
    return (
      <TransferMessage
        myId={myId}
        myUsername={myUsername}
        partner={partner}
        transferDetails={transferDetails}
        onSetAICardModalCardId={onSetAICardModalCardId}
      />
    );
  }

  if (transactionDetails) {
    return (
      <TransactionDetails
        currentTransactionId={currentChannel.currentTransactionId}
        isAICardModalShown={isAICardModalShown}
        partner={partner}
        onClick={
          !(
            transactionDetails.type === 'send' &&
            transactionDetails.from === myId
          ) &&
          currentChannel.currentTransactionId &&
          currentChannel.currentTransactionId === transactionDetails.id
            ? () => onSetTransactionModalShown(true)
            : undefined
        }
        groupObjs={groupObjs}
        onSetGroupObjs={onSetGroupObjs}
        onSetAICardModalCardId={onSetAICardModalCardId}
        transaction={transactionDetails}
      />
    );
  }

  if (!chessState && !omokState && (gameWinnerId || isDraw || isAbort)) {
    return (
      <GameOverMessage
        winnerId={gameWinnerId}
        opponentName={partner?.username}
        myId={myId}
        isAbort={!!isAbort}
        isResign={!!isResign}
        isDraw={!!isDraw}
        gameType={gameTypeForMessage as 'chess' | 'omok'}
        omokState={omokState}
      />
    );
  }

  if (wordleResult) {
    return (
      <WordleResult
        myId={myId}
        messageId={message.id}
        userId={userId}
        username={appliedUsername}
        wordleResult={wordleResult}
        onReplyClick={onReplyClick}
        channelId={currentChannel.id}
        timeStamp={timeStamp}
      />
    );
  }

  return (
    <ErrorBoundary componentPath="Chat/Message/MessageBody">
      <div
        className={css`
          width: 100%;
          display: block;
          z-index: ${zIndex};
          ${highlighted ? `background-color: ${Color.whiteGray()};` : ''}
          .menu-button {
            display: ${highlighted ? 'block' : 'none'};
          }
          &:hover {
            ${isMenuButtonsAllowed
              ? `background-color: ${Color.whiteGray()};`
              : ''}
            .menu-button {
              display: block;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            background-color: #fff;
            .menu-button {
              display: block;
            }
            &:hover {
              background-color: #fff;
            }
          }
        `}
      >
        <div className={MessageStyle.container}>
          <div className={MessageStyle.profilePic}>
            <ProfilePic
              style={{ width: '100%' }}
              userId={userId}
              profilePicUrl={appliedProfilePicUrl}
            />
          </div>
          <div
            className={css`
              width: CALC(100% - 5vw - 3rem);
              display: flex;
              flex-direction: column;
              margin-left: 2rem;
              position: relative;
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 1rem;
              }
            `}
          >
            <div>
              <UsernameText
                className={css`
                  font-size: 1.8rem;
                  line-height: 1;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.6rem;
                  }
                `}
                user={{
                  ...user,
                  id: userId,
                  username: appliedUsername
                }}
              />{' '}
              <span className={MessageStyle.timeStamp}>
                {displayedTimeStamp}
              </span>
            </div>
            <Content
              appliedUsername={appliedUsername}
              channelId={channelId}
              chessSpoilerOff={chessSpoilerOff}
              chessThemeVersion={chessThemeVersion}
              currentChannel={currentChannel}
              displayedThemeColor={displayedThemeColor}
              extractedUrl={extractedUrl}
              handleAddReaction={handleAddReaction}
              handleChessSpoilerClick={handleChessSpoilerClick}
              handleEditCancel={handleEditCancel}
              handleEditDone={handleEditDone}
              handleHideAttachment={handleHideAttachment}
              handleOmokSpoilerClick={handleOmokSpoilerClick}
              handleRemoveReaction={handleRemoveReaction}
              hasChessBoardState={hasChessBoardState}
              hasOmokBoardState={hasOmokBoardState}
              isAIMessage={isAIMessage}
              isApprovalRequest={isApprovalRequest}
              isCallMsg={isCallMsg}
              isChessCountdownActive={isChessCountdownActive}
              isChessDiscussion={isChessDiscussion}
              isCielMessage={isCielMessage}
              isCurrentlyStreaming={isCurrentlyStreaming}
              isDrawOffer={isDrawOffer}
              isEditing={isEditing}
              isLastMsg={isLastMsg}
              isMenuButtonsAllowed={isMenuButtonsAllowed}
              isModificationNotice={isModificationNotice}
              isNotification={isNotification}
              isOmokCountdownActive={isOmokCountdownActive}
              loading={loading}
              message={message}
              myId={myId}
              omokSpoilerOff={omokSpoilerOff}
              onAcceptGroupInvitation={onAcceptGroupInvitation}
              onAcceptRewind={onAcceptRewind}
              onCancelRewindRequest={onCancelRewindRequest}
              onChessBoardClick={onChessBoardClick}
              onDeclineRewind={onDeclineRewind}
              onOmokBoardClick={onOmokBoardClick}
              onRequestRewind={onRequestRewind}
              onSetChessTarget={onSetChessTarget}
              onShowSubjectMsgsModal={onShowSubjectMsgsModal}
              partner={partner}
              reactionsMenuShown={reactionsMenuShown}
              recentThumbUrl={recentThumbUrl}
              socketConnected={socketConnected}
              uploadStatus={uploadStatus}
              userCanEditThis={userCanEditThis}
              userId={userId}
            />
            <ActionButtons
              currentChannelId={currentChannel.id}
              fileName={fileName}
              filePath={filePath}
              invitePath={invitePath}
              isAIChat={isAIChat}
              isAIMessage={isAIMessage}
              isBanned={isBanned}
              isCielMessage={isCielMessage}
              isChessMsg={isChessMsg}
              isCurrentlyStreaming={!!isCurrentlyStreaming}
              isDrawOffer={isDrawOffer}
              isMenuButtonsAllowed={isMenuButtonsAllowed}
              isRestricted={isRestricted}
              message={message}
              messageId={messageId}
              myId={myId}
              onAddReaction={handleAddReaction}
              onBookmark={handleBookmarkMessage}
              onDelete={onDelete}
              onDropdownShown={setHighlighted}
              onOpenRewardModal={() => setMessageRewardModalShown(true)}
              onReplyClick={onReplyClick}
              onSetIsEditing={onSetIsEditing}
              onSetReactionsMenuShown={setReactionsMenuShown}
              onSetReplyTarget={onSetReplyTarget}
              reactionsMenuShown={reactionsMenuShown}
              recentThumbUrl={recentThumbUrl}
              rewardAmount={rewardAmount}
              rewardColor={rewardColor}
              subchannelId={subchannelId}
              targetMessage={targetMessage}
              thumbUrl={thumbUrl}
              timeStamp={timeStamp}
              userCanDeleteThis={userCanDeleteThis}
              userCanEditThis={userCanEditThis}
              userCanRewardThis={userCanRewardThis}
              userId={userId}
            />
          </div>
          {messageRewardModalShown && (
            <MessageRewardModal
              userToReward={{
                username: appliedUsername,
                id: userId
              }}
              onSubmit={({
                reasonId,
                amount
              }: {
                reasonId: number;
                amount: number;
              }) => {
                onRewardMessageSubmit({ amount, reasonId, message });
                setMessageRewardModalShown(false);
              }}
              onHide={() => setMessageRewardModalShown(false)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleBookmarkMessage(
    targetMessageId: number,
    bookmarkView: BookmarkView
  ) {
    if (!isAIChat || (!isAIMessage && userId !== myId)) {
      return;
    }
    try {
      const bookmark = await bookmarkChatMessage({
        messageId: targetMessageId,
        channelId,
        topicId: subjectId
      });
      if (bookmark) {
        onAddBookmarkedMessage({
          channelId,
          topicId: subjectId,
          bookmark,
          view: bookmarkView
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export default memo(MessageBody);
