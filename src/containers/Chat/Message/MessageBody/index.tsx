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
import { fetchURLFromText } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { useMyLevel } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { LOADING_INDICATOR_GRACE_PERIOD_MS } from '~/constants/ui';
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
import AICardOfferMessage from './AICardOfferMessage';
import { parseMessageSettings } from './messageSettings';
import { normalizeAICardOfferMessagePayload } from '~/helpers/aiCardOfferNotice';
import type { MessageBodyProps } from './types';
import useOptimisticSave from './hooks/useOptimisticSave';
import WordleResult from './WordleResult';
import type {
  PendingReactionMutation,
  PendingReactionMutations
} from './Reactions/types';
import {
  canUseGenericChatMessageActions
} from '~/helpers/chatMessageCapabilities';

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
  const onApplyCanonicalChatReaction = useChatContext(
    (v) => v.actions.onApplyCanonicalChatReaction
  );
  const showToast = useToast();
  const { canDelete, canEdit, canReward } = useMyLevel();
  const spoilerClickedRef = useRef(false);
  const pendingReactionMutationsRef = useRef<PendingReactionMutations>({});
  const pendingReactionIndicatorTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [highlighted, setHighlighted] = useState(false);
  const [reactionsMenuShown, setReactionsMenuShown] = useState(false);
  const [visiblePendingReactionMutations, setVisiblePendingReactionMutations] =
    useState<PendingReactionMutations>({});
  const [messageRewardModalShown, setMessageRewardModalShown] = useState(false);
  const extractedUrl = useMemo(() => fetchURLFromText(content), [content]);

  const {
    actions: {
      onAddBookmarkedMessage,
      onEditMessage,
      onHideAttachment,
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
      onUpdateRecentOmokMessage,
      refreshChatQuickAccess
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
  const genericActionsAllowed = canUseGenericChatMessageActions({
    ...message,
    isNotification: isNotification || message.isNotification
  });

  useEffect(() => {
    if (isLastMsg && isNewMessage && !userIsUploader) {
      onReceiveNewMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, isNewMessage, userIsUploader]);

  useEffect(() => {
    const pendingReactionIndicatorTimers =
      pendingReactionIndicatorTimersRef.current;
    return () => {
      for (const timer of Object.values(pendingReactionIndicatorTimers)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const userCanDeleteThis = useMemo(() => {
    if (!genericActionsAllowed || isDrawOffer) {
      return false;
    }

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
    genericActionsAllowed,
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
      genericActionsAllowed &&
      ((canEdit &&
        level > uploaderLevel &&
        (channelId === GENERAL_CHAT_ID || isSupermod(level))) ||
        userIsUploader ||
        isAIMessage)
    );
  }, [
    canEdit,
    channelId,
    genericActionsAllowed,
    invitePath,
    isAIMessage,
    isDrawOffer,
    level,
    rewardAmount,
    uploaderLevel,
    userIsUploader
  ]);

  const userCanRewardThis = useMemo(
    () =>
      genericActionsAllowed &&
      canReward &&
      level > uploaderLevel &&
      myId !== userId,
    [canReward, genericActionsAllowed, level, myId, uploaderLevel, userId]
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
  const aiCardOfferDetails = useMemo(() => {
    if (message?.rootType !== 'aiCardOffer') return null;
    const payload = parseMessageSettings(message?.settings)?.aiCardOffer;
    return normalizeAICardOfferMessagePayload(payload);
  }, [message?.rootType, message?.settings]);
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
    () => typeof gameWinnerId === 'number' || isDraw || isAbort || isResign,
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
    const latestBoardMessageId = getLatestBoardMessageId(
      currentChannel,
      'chess'
    );
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
    const latestBoardMessageId = getLatestBoardMessageId(
      currentChannel,
      'omok'
    );
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
      genericActionsAllowed &&
      !isApprovalRequest &&
      !isNotification &&
      !isCallMsg &&
      !isChessMsg &&
      !isEditing &&
      !fileToUpload,
    [
      fileToUpload,
      genericActionsAllowed,
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
    const canonicalState = await hideChatAttachment(messageId);
    onHideAttachment(canonicalState);
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
        const { messageUpdate, subjectChanged } = await editChatMessage({
          editedMessage,
          messageId,
          isSubject: messageIsSubject,
          subjectId
        });
        onEditMessage({ ...messageUpdate, subjectChanged });
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
    [channelId, isAIMessage, isReloadedSubject, isSubject, messageId, subjectId]
  );

  async function reconcileCanonicalReactionResponse({
    response,
    ownerUserId
  }: {
    response: any;
    ownerUserId: number;
  }) {
    const responseMessageId = Number(response?.messageId || 0);
    const responseChannelId = Number(response?.channelId || 0);
    const reactionStateRevision = Number(response?.reactionStateRevision || 0);
    if (
      responseMessageId !== Number(messageId) ||
      responseChannelId <= 0 ||
      reactionStateRevision <= 0 ||
      !Array.isArray(response?.reactions)
    ) {
      return false;
    }
    onApplyCanonicalChatReaction({
      update: response,
      ownerUserId,
      pageVisible: true,
      usingChat: true,
      shouldTrackUnreadActivity: false
    });

    const dmRecencyChanged =
      response.changed &&
      response.twoPeople &&
      response.channelActivity?.changed;
    if (dmRecencyChanged) {
      try {
        await refreshChatQuickAccess({ automaticOnly: true });
      } catch (error) {
        console.error(error);
      }
    }
    return true;
  }

  async function handleAddReaction(reaction: string) {
    await submitReactionMutation({ mutation: 'add', reaction });
  }

  async function handleRemoveReaction(reaction: string) {
    await submitReactionMutation({ mutation: 'remove', reaction });
  }

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

  if (aiCardOfferDetails) {
    return (
      <AICardOfferMessage
        myId={myId}
        myUsername={myUsername}
        offerDetails={aiCardOfferDetails}
        senderUsername={appliedUsername}
        timeStamp={message.timeStamp}
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
        channelId={channelId}
        messageId={message.id}
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
            ${
              isMenuButtonsAllowed
                ? `background-color: ${Color.whiteGray()};`
                : ''
            }
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
              pendingReactionMutations={visiblePendingReactionMutations}
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
          {messageRewardModalShown && genericActionsAllowed && (
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

  async function submitReactionMutation({
    mutation,
    reaction
  }: {
    mutation: PendingReactionMutation;
    reaction: string;
  }) {
    if (!messageId || !myId || pendingReactionMutationsRef.current[reaction]) {
      return;
    }

    const userAlreadyReacted = (message.reactions || []).some(
      (messageReaction: { type?: string; userId?: number }) =>
        messageReaction.type === reaction &&
        Number(messageReaction.userId) === Number(myId)
    );
    if (
      (mutation === 'add' && userAlreadyReacted) ||
      (mutation === 'remove' && !userAlreadyReacted)
    ) {
      return;
    }

    setPendingReactionMutation(reaction, mutation);
    try {
      // Track the request immediately, but only reveal its spinner after the
      // shared grace period. Reaction membership and counts stay unchanged
      // until this writer-backed snapshot supplies canonical state.
      const ownerUserId = myId;
      const response =
        mutation === 'add'
          ? await postChatReaction({ messageId, reaction })
          : await removeChatReaction({ messageId, reaction });
      const applied = await reconcileCanonicalReactionResponse({
        response,
        ownerUserId
      });
      if (!applied) {
        if (response?.success === true) {
          // A pre-revision worker confirms only that the write succeeded. Its
          // legacy socket event is reconciled separately into canonical state;
          // do not report that confirmed write as a failure or synthesize it.
          return;
        }
        throw new Error('Invalid canonical chat reaction response');
      }
    } catch (error) {
      console.error(error);
      showToast({
        message: 'Couldn’t confirm that reaction. Please try again.'
      });
    } finally {
      setPendingReactionMutation(reaction, null);
    }
  }

  function setPendingReactionMutation(
    reaction: string,
    mutation: PendingReactionMutation | null
  ) {
    const nextPendingReactionMutations = {
      ...pendingReactionMutationsRef.current
    };
    if (mutation) {
      nextPendingReactionMutations[reaction] = mutation;
    } else {
      delete nextPendingReactionMutations[reaction];
    }
    pendingReactionMutationsRef.current = nextPendingReactionMutations;

    const existingTimer = pendingReactionIndicatorTimersRef.current[reaction];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete pendingReactionIndicatorTimersRef.current[reaction];
    }

    if (mutation) {
      pendingReactionIndicatorTimersRef.current[reaction] = setTimeout(() => {
        delete pendingReactionIndicatorTimersRef.current[reaction];
        if (pendingReactionMutationsRef.current[reaction] !== mutation) return;
        setVisiblePendingReactionMutations((current) => ({
          ...current,
          [reaction]: mutation
        }));
      }, LOADING_INDICATOR_GRACE_PERIOD_MS);
      return;
    }

    setVisiblePendingReactionMutations((current) => {
      if (!current[reaction]) return current;
      const nextVisiblePendingReactionMutations = { ...current };
      delete nextVisiblePendingReactionMutations[reaction];
      return nextVisiblePendingReactionMutations;
    });
  }
}

export default memo(MessageBody);
