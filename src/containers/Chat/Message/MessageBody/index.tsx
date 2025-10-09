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
import Omok from '../../Omok';
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

import { socket } from '~/constants/sockets/api';
import { MessageStyle } from '../../Styles';
import { fetchURLFromText } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useMyLevel } from '~/helpers/hooks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile, isSupermod } from '~/helpers';
import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  GENERAL_CHAT_ID
} from '~/constants/defaultValues';
import useBoardSpoilerOff from '../hooks/useBoardSpoilerOff';
import { getUserChatSquareColors } from '~/containers/Chat/Chess/helpers/theme';

const deviceIsMobile = isMobile(navigator);
const replyLabel = localize('reply2');
const rewardLabel = localize('reward');
const removeLabel = localize('remove');
const editLabel = localize('edit');

function MessageBody({
  channelId,
  chessCountdownNumber,
  omokCountdownNumber,
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
  onOmokBoardClick,
  onOmokSpoilerClick,
  onReceiveNewMessage,
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
}: {
  chessCountdownNumber?: number | null;
  omokCountdownNumber?: number | null;
  partner: any;
  channelId: number;
  currentChannel: any;
  displayedThemeColor: string;
  groupObjs: any;
  isAIMessage: boolean;
  isCielMessage?: boolean;
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
  onOmokBoardClick: () => void;
  onOmokSpoilerClick: (v: number) => void;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onReceiveNewMessage: () => void;
  onReplyClick: (target: any) => void;
  onRequestRewind: (v: any) => void;
  onSetAICardModalCardId: (v: any) => void;
  onSetChessTarget: (v: any) => void;
  onSetGroupObjs: (v: any) => void;
  onSetMessageToScrollTo: (v: any) => void;
  onSetTransactionModalShown: (v: boolean) => void;
  onRewardMessageSubmit: (v: any) => void;
  onShowSubjectMsgsModal: (v: any) => void;
  recentThumbUrl: string;
  zIndex?: number;
}) {
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const rewardColor = useKeyContext((v) => v.theme.reward.color);
  const myId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
  const myProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const level = useKeyContext((v) => v.myState.level);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);

  const bookmarkAIMessage = useAppContext(
    (v) => v.requestHelpers.bookmarkAIMessage
  );
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const { canDelete, canEdit, canReward } = useMyLevel();
  const spoilerClickedRef = useRef(false);
  const [highlighted, setHighlighted] = useState(false);
  const [reactionsMenuShown, setReactionsMenuShown] = useState(false);
  const {
    actions: {
      onAddBookmarkedMessage,
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
      onUpdateRecentChessMessage,
      onUpdateLastOmokMessageId,
      onUpdateLastOmokMoveViewerId,
      onUpdateRecentOmokMessage
    },
    requests: {
      editChatMessage,
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
  const DropdownButtonRef = useRef(null);
  const userIsUploader = useMemo(() => myId === userId, [myId, userId]);

  // Check if this AI message has an error

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
    const isSuperMod = isSupermod(level);
    const hasRequiredLevel = level > uploaderLevel;

    const hasPermission =
      hasEditOrDeletePermission &&
      (isGeneralChannel || isSuperMod) &&
      hasRequiredLevel;

    return hasPermission || userIsUploader || isAIMessage;
  }, [
    isDrawOffer,
    canEdit,
    canDelete,
    level,
    uploaderLevel,
    channelId,
    userIsUploader,
    isAIMessage
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
    () => canReward && level > uploaderLevel && myId !== userId,
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
  let appliedUsername = memberName || username;
  let appliedProfilePicUrl = memberProfilePicUrl || profilePicUrl;
  const [messageRewardModalShown, setMessageRewardModalShown] = useState(false);
  const [extractedUrl, setExtractedUrl] = useState(fetchURLFromText(content));
  const isOmokMsg = useMemo(() => !!omokState, [omokState]);
  const isChessBoardMsg = useMemo(
    () => Boolean(isChessMsg && !isOmokMsg),
    [isChessMsg, isOmokMsg]
  );

  if (fileToUpload && !userId) {
    userId = myId;
    appliedUsername = myUsername;
    appliedProfilePicUrl = myProfilePicUrl;
  }
  useEffect(() => {
    if (isOmokMsg && typeof messageId === 'number') {
      onUpdateLastOmokMessageId({ channelId, messageId });
    } else if (isChessBoardMsg && typeof messageId === 'number') {
      onUpdateLastChessMessageId({ channelId, messageId });
    } else if (gameWinnerId || isDraw) {
      onUpdateLastChessMessageId({
        channelId,
        messageId: null
      });
      onUpdateLastOmokMessageId({
        channelId,
        messageId: null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, isOmokMsg, isChessBoardMsg, messageId, gameWinnerId, isDraw]);

  useEffect(() => {
    if (!message.id && isChessBoardMsg) {
      onUpdateRecentChessMessage({ channelId, message });
    }
    if (!message.id && isOmokMsg) {
      onUpdateRecentOmokMessage({ channelId, message });
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
      isNotification?: boolean;
      chessState: any;
      omokState: any;
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
        omokState: newMessage.omokState,
        isCallMsg: newMessage.isCallMsg,
        isChessMsg: newMessage.isChessMsg,
        isDrawOffer: newMessage.isDrawOffer,
        isDraw: newMessage.isDraw,
        isAbort: newMessage.isAbort,
        isResign: newMessage.isResign,
        isReloadedSubject: newMessage.isReloadedSubject,
        isNotification: !!newMessage.isNotification,
        gameWinnerId: newMessage.gameWinnerId,
        rewardReason: newMessage.rewardReason,
        rewardAmount: newMessage.rewardAmount,
        targetMessageId: newMessage.targetMessageId,
        timeStamp: newMessage.timeStamp,
        subjectId: newMessage.subjectId || 0,
        subchannelId: newMessage.subchannelId
      };
      const { messageId, timeStamp, netCoins } = await saveChatMessage({
        message: post,
        targetMessageId: targetMessage?.id,
        targetSubject,
        isCielChat,
        isZeroChat,
        thinkHard:
          (isCielChat &&
            (thinkHardState.ciel[subjectId] ?? thinkHardState.ciel.global)) ||
          (isZeroChat &&
            (thinkHardState.zero[subjectId] ?? thinkHardState.zero.global))
      });

      if (typeof netCoins === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: netCoins }
        });
      }
      onSaveMessage({
        messageId,
        subchannelId,
        index,
        channelId,
        timeStamp,
        topicId: subjectId || 0,
        tempMessageId
      });
      const messageToSendOverSocket = {
        ...message,
        uploaderLevel: level,
        isNewMessage: true,
        targetSubject: subjectId
          ? targetSubject || currentChannel?.topicObj[subjectId]
          : null,
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

  const chessSpoilerOff = useBoardSpoilerOff({
    countdownNumber: chessCountdownNumber,
    moveByUserId: chessState?.move?.by,
    myId,
    lastMoveViewerId: currentChannel.lastChessMoveViewerId,
    lastMessageId: currentChannel.lastChessMessageId,
    messageId,
    moveViewTimeStamp
  });

  const omokSpoilerOff = useBoardSpoilerOff({
    countdownNumber: omokCountdownNumber,
    moveByUserId: omokState?.move?.by,
    myId,
    lastMoveViewerId: currentChannel.lastOmokMoveViewerId,
    lastMessageId: currentChannel.lastOmokMessageId,
    messageId,
    moveViewTimeStamp
  });

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
          const target = rewardAmount
            ? targetMessage
            : {
                ...message,
                thumbUrl: thumbUrl || recentThumbUrl,
                timeStamp
              };
          onSetReplyTarget({
            channelId: currentChannel.id,
            subchannelId,
            target
          });
          onReplyClick(target);
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
    if (userCanRewardThis && !rewardAmount && !isAIMessage) {
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
    if (isAIMessage) {
      result.push({
        label: (
          <>
            <Icon icon="bookmark" />
            <span style={{ marginLeft: '1rem' }}>Bookmark</span>
          </>
        ),
        style: {
          color: '#fff',
          background: Color[isCielMessage ? 'magenta' : 'logoBlue']()
        },
        className: css`
          opacity: 0.9;
          &:hover {
            opacity: 1 !important;
          }
        `,
        onClick: () => handleBookmarkMessage(messageId)
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

  const gameTypeForResult = useMemo(() => {
    const lc = (content || '').toLowerCase();
    if (lc.includes('omok')) return 'omok';
    if (lc.includes('chess')) return 'chess';
    return 'chess';
  }, [content]);

  // Only show plain GameOverMessage when there is no board state to render.
  // For Omok connect-five wins, the message carries omokState; let the board render instead.
  if (!chessState && !omokState && (gameWinnerId || isDraw || isAbort)) {
    return (
      <GameOverMessage
        winnerId={gameWinnerId}
        opponentName={partner?.username}
        myId={myId}
        isAbort={!!isAbort}
        isResign={!!isResign}
        isDraw={!!isDraw}
        gameType={gameTypeForResult as 'chess' | 'omok'}
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
              ) : isOmokMsg ? (
                <Omok
                  channelId={channelId}
                  countdownNumber={omokCountdownNumber}
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
                  style={{ marginTop: '1rem', width: '100%' }}
                />
              ) : isChessBoardMsg ? (
                <Chess
                  key={chessThemeVersion}
                  loaded
                  moveViewed={!!moveViewTimeStamp}
                  channelId={channelId}
                  countdownNumber={chessCountdownNumber}
                  gameWinnerId={gameWinnerId}
                  spoilerOff={chessSpoilerOff}
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
                      lastChessMessageId={currentChannel.lastChessMessageId}
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
                      attachmentHidden={!!attachmentHidden}
                      aiThinkingStatus={aiThinkingStatus}
                      aiThoughtContent={aiThoughtContent}
                      aiThoughtIsThinkingHard={message.aiThoughtIsThinkingHard}
                      channelId={channelId}
                      content={content}
                      displayedThemeColor={displayedThemeColor}
                      extractedUrl={extractedUrl}
                      isAIMessage={isAIMessage}
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
                className={css`
                  position: absolute;
                  top: 0;
                  right: 0;
                  display: flex;
                `}
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

  async function handleBookmarkMessage(messageId: number) {
    if (!isAIMessage) {
      return;
    }
    try {
      await bookmarkAIMessage({
        messageId,
        channelId,
        topicId: subjectId
      });
      onAddBookmarkedMessage({
        channelId,
        topicId: subjectId,
        message
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export default memo(MessageBody);
