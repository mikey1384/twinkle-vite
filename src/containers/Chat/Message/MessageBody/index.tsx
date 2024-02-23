import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import Chess from '../../Chess';
import GameOverMessage from './GameOverMessage';
import TextMessage from './TextMessage';
import Icon from '~/components/Icon';
import DropdownButton from '~/components/Buttons/DropdownButton';
import TargetMessage from './TargetMessage';
import TargetSubject from './TargetSubject';
import RewardMessage from './RewardMessage';
import Invitation from './Invitation';
import DrawOffer from './DrawOffer';
import WordleResult from './WordleResult';
import MessageRewardModal from '../../Modals/MessageRewardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import LocalContext from '../../Context';
import ReactionButton from './ReactionButton';
import Reactions from './Reactions';
import localize from '~/constants/localize';
import moment from 'moment';
import FileAttachment from './FileAttachment';
import TargetChessPosition from './TargetChessPosition';
import TopicMessagePreview from './TopicMessagePreview';
import TopicStartNotification from './TopicStartNotification';
import TransferMessage from './TransferMessage';
import TransactionDetails from '../../TransactionDetails';
import ApprovalRequest from './ApprovalRequest';
import ModificationNotice from './ModificationNotice';
import { socket } from '~/constants/io';
import { MessageStyle } from '../../Styles';
import { fetchURLFromText } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { useMyLevel } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile, isSupermod } from '~/helpers';
import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  GENERAL_CHAT_ID,
  SR_MOD_LEVEL
} from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);
const replyLabel = localize('reply2');
const rewardLabel = localize('reward');
const removeLabel = localize('remove');
const editLabel = localize('edit');

function MessageBody({
  channelId,
  chessCountdownNumber,
  partner,
  currentChannel,
  displayedThemeColor,
  index,
  isAIMessage,
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
    attachmentHidden,
    chessState,
    content,
    fileToUpload,
    fileName,
    filePath,
    fileSize,
    gameWinnerId,
    invitePath,
    invitationChannelId,
    isChessMsg,
    isAbort,
    isDraw,
    isDrawOffer,
    isNewMessage,
    isReloadedSubject,
    isSubject,
    linkDescription,
    linkTitle,
    linkUrl,
    moveViewTimeStamp,
    numMsgs,
    rewardAmount,
    rewardReason,
    rootId,
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
  onReceiveNewMessage,
  onReplyClick,
  onRequestRewind,
  onRewardMessageSubmit,
  onSetAICardModalCardId,
  onSetChessTarget,
  onSetTransactionModalShown,
  onScrollToBottom,
  onShowSubjectMsgsModal,
  recentThumbUrl,
  zIndex
}: {
  chessCountdownNumber: number;
  partner: any;
  channelId: number;
  currentChannel: any;
  displayedThemeColor: string;
  isAIMessage: boolean;
  isAICardModalShown: boolean;
  isApprovalRequest: boolean;
  isModificationNotice: boolean;
  message: any;
  nextMessageHasTopic: boolean;
  prevMessageHasTopic: boolean;
  onDelete: (v: any) => void;
  index: number;
  isBanned: boolean;
  isLastMsg: boolean;
  isNotification: boolean;
  isRestricted: boolean;
  isEditing: boolean;
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
  recentThumbUrl: string;
  zIndex?: number;
}) {
  const {
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);
  const {
    isAdmin,
    level,
    userId: myId,
    username: myUsername,
    profilePicUrl: myProfilePicUrl
  } = useKeyContext((v) => v.myState);
  const { canDelete, canEdit, canReward } = useMyLevel();
  const spoilerClickedRef = useRef(false);
  const [highlighted, setHighlighted] = useState(false);
  const [reactionsMenuShown, setReactionsMenuShown] = useState(false);
  const {
    actions: {
      onAddReactionToMessage,
      onEditMessage,
      onRemoveReactionFromMessage,
      onSaveMessage,
      onSetEmbeddedUrl,
      onSetActualDescription,
      onSetActualTitle,
      onSetIsEditing,
      onSetSiteUrl,
      onSetThumbUrl,
      onSetReplyTarget,
      onUpdateLastChessMessageId,
      onUpdateLastChessMoveViewerId,
      onUpdateRecentChessMessage
    },
    requests: {
      editChatMessage,
      saveChatMessage,
      setChessMoveViewTimeStamp,
      postChatReaction,
      removeChatReaction
    },
    state: { filesBeingUploaded, socketConnected }
  } = useContext(LocalContext);
  const DropdownButtonRef = useRef(null);
  const userIsUploader = useMemo(() => myId === userId, [myId, userId]);
  useEffect(() => {
    if (isLastMsg && userIsUploader) {
      onScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, userIsUploader]);
  useEffect(() => {
    if (isLastMsg && isNewMessage && !userIsUploader) {
      onReceiveNewMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastMsg, isNewMessage, userIsUploader]);
  const userCanDeleteThis = useMemo(() => {
    return (
      !isDrawOffer &&
      (((canEdit || canDelete) &&
        (channelId === GENERAL_CHAT_ID || isSupermod(level)) &&
        level > uploaderLevel) ||
        userIsUploader)
    );
  }, [
    isDrawOffer,
    canEdit,
    canDelete,
    level,
    uploaderLevel,
    channelId,
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
    rewardAmount,
    invitePath,
    isDrawOffer,
    canEdit,
    level,
    uploaderLevel,
    channelId,
    userIsUploader
  ]);
  const userCanRewardThis = useMemo(
    () =>
      canReward &&
      level >= SR_MOD_LEVEL &&
      level > uploaderLevel &&
      myId !== userId,
    [level, canReward, uploaderLevel, userId, myId]
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
  let appliedUsername = username;
  let appliedProfilePicUrl = profilePicUrl;
  const [messageRewardModalShown, setMessageRewardModalShown] = useState(false);
  const [extractedUrl, setExtractedUrl] = useState(fetchURLFromText(content));

  if (fileToUpload && !userId) {
    userId = myId;
    appliedUsername = myUsername;
    appliedProfilePicUrl = myProfilePicUrl;
  }
  useEffect(() => {
    if (isChessMsg && typeof messageId === 'number') {
      onUpdateLastChessMessageId({ channelId, messageId });
    } else if (gameWinnerId || isDraw) {
      onUpdateLastChessMessageId({
        channelId,
        messageId: currentChannel.lastChessMessageId + 1
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, isChessMsg, messageId]);

  useEffect(() => {
    if (!message.id && message.isChessMsg) {
      onUpdateRecentChessMessage({ channelId, message });
    }
    if (
      userIsUploader &&
      !message.id &&
      !message.fileToUpload &&
      !message.isSubject &&
      (!(message.isNotification && !message.chessState) || isCallMsg)
    ) {
      handleSaveMessage(message);
    }

    async function handleSaveMessage(newMessage: {
      tempMessageId: number;
      userId: number;
      isChessMsg: boolean;
      isDrawOffer: boolean;
      isDraw: boolean;
      isAbort: boolean;
      isCallMsg: boolean;
      isReloadedSubject: boolean;
      isResign: boolean;
      chessState: any;
      content: string;
      channelId: number;
      gameWinnerId: number;
      rewardReason: string;
      rewardAmount: number;
      targetMessageId: number;
      timeStamp: number;
      subchannelId?: number;
      subjectId?: number;
      username?: string;
      profilePicUrl?: string;
      targetMessage?: any;
    }) {
      const isCielChat = partner?.id === CIEL_TWINKLE_ID;
      const isZeroChat = partner?.id === ZERO_TWINKLE_ID;
      const { tempMessageId } = newMessage;
      const post = {
        userId: newMessage.userId,
        content: newMessage.content,
        channelId: newMessage.channelId,
        chessState: newMessage.chessState,
        isCallMsg: newMessage.isCallMsg,
        isChessMsg: newMessage.isChessMsg,
        isDrawOffer: newMessage.isDrawOffer,
        isDraw: newMessage.isDraw,
        isAbort: newMessage.isAbort,
        isResign: newMessage.isResign,
        isReloadedSubject: newMessage.isReloadedSubject,
        gameWinnerId: newMessage.gameWinnerId,
        rewardReason: newMessage.rewardReason,
        rewardAmount: newMessage.rewardAmount,
        targetMessageId: newMessage.targetMessageId,
        timeStamp: newMessage.timeStamp,
        subjectId: newMessage.subjectId,
        subchannelId: newMessage.subchannelId
      };
      const { messageId, timeStamp } = await saveChatMessage({
        message: post,
        targetMessageId: targetMessage?.id,
        targetSubject,
        isCielChat,
        isZeroChat
      });
      onSaveMessage({
        messageId,
        subchannelId,
        index,
        channelId,
        timeStamp,
        topicId: subjectId,
        tempMessageId
      });
      const messageToSendOverSocket = {
        ...message,
        uploaderLevel: level,
        isNewMessage: true,
        targetSubject: subjectId ? currentChannel?.topicObj[subjectId] : null,
        id: messageId
      };
      delete messageToSendOverSocket.tempMessageId;
      const channelData = {
        id: currentChannel.id,
        channelName: currentChannel.channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      };
      socket.emit('new_chat_message', {
        message: messageToSendOverSocket,
        channel: channelData
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spoilerOff = useMemo(() => {
    if (typeof chessCountdownNumber === 'number') {
      return true;
    }
    const userMadeThisMove = chessState?.move?.by === myId;
    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    if (
      userMadeThisMove ||
      userIsTheLastMoveViewer ||
      moveViewTimeStamp ||
      messageId < currentChannel.lastChessMessageId
    ) {
      return true;
    }
    return false;
  }, [
    chessCountdownNumber,
    chessState?.move?.by,
    currentChannel.lastChessMessageId,
    currentChannel.lastChessMoveViewerId,
    messageId,
    moveViewTimeStamp,
    myId
  ]);

  useEffect(() => {
    const url = fetchURLFromText(content);
    if (url) {
      setExtractedUrl(url);
      onSetEmbeddedUrl({ contentId: messageId, contentType: 'chat', url });
      if (linkDescription) {
        onSetActualDescription({
          contentId: messageId,
          contentType: 'chat',
          description: linkDescription
        });
      }
      if (linkTitle) {
        onSetActualTitle({
          contentId: messageId,
          contentType: 'chat',
          title: linkTitle
        });
      }
      if (linkUrl) {
        onSetSiteUrl({
          contentId: messageId,
          contentType: 'chat',
          siteUrl: linkUrl
        });
      }
      if (thumbUrl) {
        onSetThumbUrl({
          contentId: messageId,
          contentType: 'chat',
          thumbUrl
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const dropdownMenuItems = useMemo(() => {
    const result: any[] = [];
    if (isBanned) return result;
    if (!isRestricted) {
      result.push({
        label: (
          <>
            <Icon icon="reply" />
            <span style={{ marginLeft: '1rem' }}>{replyLabel}</span>
          </>
        ),
        onClick: () => {
          onSetReplyTarget({
            channelId: currentChannel.id,
            subchannelId,
            target: rewardAmount
              ? targetMessage
              : {
                  ...message,
                  thumbUrl: thumbUrl || recentThumbUrl,
                  timeStamp
                }
          });
          onReplyClick();
        }
      });
    }
    if (userCanEditThis) {
      result.push({
        label: (
          <>
            <Icon icon="pencil-alt"></Icon>
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () => {
          onSetIsEditing({
            contentId: messageId,
            contentType: 'chat',
            isEditing: true
          });
        }
      });
    }
    if (userCanDeleteThis) {
      result.push({
        label: (
          <>
            <Icon icon="trash-alt"></Icon>
            <span style={{ marginLeft: '1rem' }}>{removeLabel}</span>
          </>
        ),
        onClick: () => {
          onDelete({ messageId, filePath, fileName });
        }
      });
    }
    if (
      ((userCanRewardThis && channelId === 2) ||
        (isAdmin && !userIsUploader)) &&
      !rewardAmount
    ) {
      result.push({
        label: (
          <>
            <Icon icon="star" />
            <span style={{ marginLeft: '1rem' }}>{rewardLabel}</span>
          </>
        ),
        style: { color: '#fff', background: Color[rewardColor]() },
        className: css`
          opacity: 0.9;
          &:hover {
            opacity: 1 !important;
          }
        `,
        onClick: () => setMessageRewardModalShown(true)
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canDelete,
    channelId,
    isBanned,
    isAdmin,
    isDrawOffer,
    message,
    messageId,
    recentThumbUrl,
    rewardAmount,
    targetMessage,
    thumbUrl,
    userCanEditThis,
    userCanRewardThis,
    userIsUploader
  ]);

  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const dropdownButtonShown = useMemo(
    () => dropdownMenuItems?.length > 0,
    [dropdownMenuItems?.length]
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
  }, [onChessSpoilerClick, channelId, message, userId]);

  const handleRewardMessageSubmit = useCallback(
    ({ reasonId, amount }: { reasonId: number; amount: number }) => {
      onRewardMessageSubmit({ amount, reasonId, message });
    },
    [message, onRewardMessageSubmit]
  );

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
        channelId={channelId}
        theme={displayedThemeColor}
        topicObj={{ id: subjectId, title: message.content }}
        username={myId === userId ? 'You' : appliedUsername}
      />
    );
  }

  if (isTopicMessagePreview) {
    return (
      <TopicMessagePreview
        channelId={channelId}
        theme={displayedThemeColor}
        topicObj={targetSubject}
        nextMessageHasTopic={nextMessageHasTopic}
        prevMessageHasTopic={prevMessageHasTopic}
        username={myId === userId ? 'You' : appliedUsername}
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
        onSetAICardModalCardId={onSetAICardModalCardId}
        transaction={transactionDetails}
      />
    );
  }

  if (!chessState && (gameWinnerId || isDraw || isAbort)) {
    return (
      <GameOverMessage
        winnerId={gameWinnerId}
        opponentName={partner?.username}
        myId={myId}
        isAbort={!!isAbort}
        isResign={!!isResign}
        isDraw={!!isDraw}
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
        style={{
          width: '100%',
          display: 'block',
          zIndex
        }}
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
                  id: userId,
                  username: appliedUsername
                }}
              />{' '}
              <span className={MessageStyle.timeStamp}>
                {displayedTimeStamp}
              </span>
            </div>
            <div>
              {isApprovalRequest ? (
                <ApprovalRequest
                  userId={userId}
                  username={appliedUsername}
                  requestId={rootId}
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
              ) : isChessMsg ? (
                <Chess
                  loaded
                  moveViewed={!!moveViewTimeStamp}
                  channelId={channelId}
                  countdownNumber={chessCountdownNumber}
                  gameWinnerId={gameWinnerId}
                  spoilerOff={spoilerOff}
                  messageId={messageId}
                  myId={myId}
                  initialState={chessState}
                  lastChessMessageId={currentChannel.lastChessMessageId}
                  onBoardClick={onChessBoardClick}
                  onRewindClick={() =>
                    onRequestRewind({
                      ...(chessState.previousState || chessState),
                      isDiscussion: true,
                      isRewindRequest: true
                    })
                  }
                  onDiscussClick={() =>
                    onSetChessTarget({ chessState, messageId, channelId })
                  }
                  onSpoilerClick={handleChessSpoilerClick}
                  opponentId={partner?.id}
                  opponentName={partner?.username}
                  senderId={userId}
                  style={{ marginTop: '1rem', width: '100%' }}
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
                      lastChessMessageId={currentChannel.lastChessMessageId}
                      onCancelRewindRequest={onCancelRewindRequest}
                      onAcceptRewind={onAcceptRewind}
                      onDeclineRewind={onDeclineRewind}
                      onRequestRewind={onRequestRewind}
                    />
                  )}
                  {targetSubject && currentChannel?.selectedTab !== 'topic' && (
                    <TargetSubject subject={targetSubject} />
                  )}
                  {targetMessage && (
                    <TargetMessage
                      displayedThemeColor={displayedThemeColor}
                      message={targetMessage}
                    />
                  )}
                  {filePath && fileName && (
                    <FileAttachment
                      fileName={fileName}
                      filePath={filePath}
                      fileSize={fileSize}
                      messageId={messageId}
                      theme={displayedThemeColor}
                      thumbUrl={thumbUrl || recentThumbUrl}
                    />
                  )}
                  {rewardAmount ? (
                    <RewardMessage
                      rewardAmount={rewardAmount}
                      rewardReason={rewardReason}
                    />
                  ) : (
                    <TextMessage
                      attachmentHidden={!!attachmentHidden}
                      channelId={channelId}
                      content={content}
                      displayedThemeColor={displayedThemeColor}
                      extractedUrl={extractedUrl}
                      isAIMessage={isAIMessage}
                      messageId={messageId}
                      numMsgs={numMsgs}
                      isCallMsg={isCallMsg}
                      isNotification={isNotification}
                      isSubject={!!isSubject}
                      isReloadedSubject={!!isReloadedSubject}
                      MessageStyle={MessageStyle}
                      isEditing={isEditing}
                      onEditCancel={handleEditCancel}
                      onEditDone={handleEditDone}
                      onShowSubjectMsgsModal={onShowSubjectMsgsModal}
                      socketConnected={socketConnected}
                      subchannelId={subchannelId}
                      subjectId={subjectId}
                      thumbUrl={thumbUrl}
                      userCanEditThis={userCanEditThis}
                    />
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
            {isMenuButtonsAllowed && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  display: 'flex'
                }}
              >
                {!invitePath && !isDrawOffer && !isChessMsg && !isBanned && (
                  <ReactionButton
                    onReactionClick={handleAddReaction}
                    reactionsMenuShown={reactionsMenuShown}
                    onSetReactionsMenuShown={setReactionsMenuShown}
                    style={{
                      marginRight: dropdownButtonShown ? '0.5rem' : 0
                    }}
                  />
                )}
                {dropdownButtonShown && (
                  <DropdownButton
                    skeuomorphic
                    buttonStyle={{
                      fontSize: '1rem',
                      lineHeight: 1
                    }}
                    className="menu-button"
                    innerRef={DropdownButtonRef}
                    color="darkerGray"
                    icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
                    opacity={0.5}
                    menuProps={dropdownMenuItems}
                    onDropdownShown={setHighlighted}
                  />
                )}
              </div>
            )}
          </div>
          {messageRewardModalShown && (
            <MessageRewardModal
              userToReward={{
                username: appliedUsername,
                id: userId
              }}
              onSubmit={handleRewardMessageSubmit}
              onHide={() => setMessageRewardModalShown(false)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default memo(MessageBody);
