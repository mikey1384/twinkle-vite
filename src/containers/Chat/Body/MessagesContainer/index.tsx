import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import MessageInput from './MessageInput';
import Loading from '~/components/Loading';
import Message from '../../Message';
import ChannelHeader from './ChannelHeader';
import SubjectMsgsModal from '../../Modals/SubjectMsgsModal';
import InviteUsersModal from '../../Modals/InviteUsers';
import ChessModal from '../../Modals/ChessModal';
import WordleModal from '../../Modals/WordleModal';
import SelectVideoModal from '../../Modals/SelectVideoModal';
import SelectNewOwnerModal from '../../Modals/SelectNewOwnerModal';
import TransactionModal from '../../Modals/TransactionModal';
import SettingsModal from '../../Modals/SettingsModal';
import CallScreen from './CallScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import { v1 as uuidv1 } from 'uuid';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  rewardReasons,
  AI_CARD_CHAT_TYPE,
  VOCAB_CHAT_TYPE,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { socket } from '~/constants/io';
import { isMobile, parseChannelPath } from '~/helpers';
import { useTheme } from '~/helpers/hooks';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';
import LocalContext from '../../Context';
import localize from '~/constants/localize';

const CALL_SCREEN_HEIGHT = '30%';
const unseenButtonThreshold = -1;
const deviceIsMobile = isMobile(navigator);

const leaveChatGroupLabel = localize('leaveChatGroup');

function MessagesContainer({
  channelName,
  partner,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  isAICardModalShown,
  onSetAICardModalCardId,
  subchannelId,
  subchannelPath
}: {
  channelName?: string;
  partner?: {
    id: number;
    username: string;
  };
  currentChannel: any;
  currentPathId: string | number;
  displayedThemeColor: string;
  isAICardModalShown: boolean;
  onSetAICardModalCardId: (arg: any) => void;
  subchannelId?: number;
  subchannelPath?: string;
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const declineChessRewind = useAppContext(
    (v) => v.requestHelpers.declineChessRewind
  );
  const cancelChessRewind = useAppContext(
    (v) => v.requestHelpers.cancelChessRewind
  );
  const rewindChessMove = useAppContext(
    (v) => v.requestHelpers.rewindChessMove
  );
  const navigate = useNavigate();
  const {
    actions: {
      onDeleteMessage,
      onEditChannelSettings,
      onEnterComment,
      onEnterChannelWithId,
      onGetRanks,
      onHideChat,
      onLeaveChannel,
      onLoadMoreMessages,
      onReceiveMessageOnDifferentChannel,
      onCreateNewDMChannel,
      onSetMessageState,
      onSetChessTarget,
      onSetChessGameState,
      onSetChessModalShown,
      onSetCreatingNewDMChannel,
      onSetFavoriteChannel,
      onSetReplyTarget,
      onSetWordleModalShown,
      onSubmitMessage,
      onUpdateChannelPathIdHash
    },
    requests: {
      acceptInvitation,
      changeChannelOwner,
      deleteChatMessage,
      editChannelSettings,
      hideChat,
      leaveChannel,
      loadChatChannel,
      loadMoreChatMessages,
      loadRankings,
      putFavoriteChannel,
      sendInvitationMessage,
      startNewDMChannel,
      updateUserXP
    },
    state: {
      channelPathIdHash,
      channelOnCall,
      chessModalShown,
      creatingNewDMChannel,
      recipientId,
      reconnecting,
      selectedChannelId,
      socketConnected,
      wordleModalShown
    },
    inputState
  } = useContext(LocalContext);
  const { banned, profilePicUrl, userId, profileTheme, isAdmin, username } =
    useKeyContext((v) => v.myState);
  const {
    currentTransactionId,
    isReloadRequired = false,
    isRespondingToSubject = false,
    messageIds = [],
    messagesObj = {},
    messagesLoadMoreButton = false,
    subchannelIds = [],
    subchannelObj,
    wordleGuesses = [],
    wordleSolution,
    wordleWordLevel,
    wordleAttemptState,
    wordleStats = {},
    subjectObj = {},
    twoPeople
  } = currentChannel;
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(twoPeople ? profileTheme : displayedThemeColor || profileTheme);
  const scrolledToBottomRef = useRef(true);
  const loadMoreButtonLock = useRef(false);
  const textForThisChannel = useMemo(
    () => inputState['chat' + selectedChannelId]?.text || '',
    [selectedChannelId, inputState]
  );
  const [chessCountdownObj, setChessCountdownObj] = useState<
    Record<string, any>
  >({});
  const [textAreaHeight, setTextAreaHeight] = useState(0);
  const [inviteUsersModalShown, setInviteUsersModalShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newUnseenMessage, setNewUnseenMessage] = useState(false);
  const [selectVideoModalShown, setSelectVideoModalShown] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    shown: boolean;
    fileName: string;
    filePath: string;
    messageId: number | null;
  }>({
    shown: false,
    fileName: '',
    filePath: '',
    messageId: null
  });
  const [subjectMsgsModal, setSubjectMsgsModal] = useState({
    shown: false,
    subjectId: 0,
    content: ''
  });
  const [TransactionModalShown, setTransactionModalShown] = useState(false);
  const [settingsModalShown, setSettingsModalShown] = useState(false);
  const [leaveConfirmModalShown, setLeaveConfirmModalShown] = useState(false);
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [hideModalShown, setHideModalShown] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [selectingNewOwner, setSelectingNewOwner] = useState(false);
  const leavingRef = useRef(false);
  const selectingNewOwnerRef = useRef(false);
  const MessagesRef: React.RefObject<any> = useRef(null);
  const ChatInputRef: React.RefObject<any> = useRef(null);
  const favoritingRef = useRef(false);
  const timerRef: React.RefObject<any> = useRef(null);
  const prevScrollPosition = useRef(null);

  const subchannel = useMemo(() => {
    if (!subchannelPath) {
      return null;
    }
    for (const subchannelId of subchannelIds) {
      if (subchannelObj[subchannelId]?.path === subchannelPath) {
        return subchannelObj[subchannelId];
      }
    }
    return null;
  }, [subchannelPath, subchannelIds, subchannelObj]);

  const appliedSubjectObj = useMemo(() => {
    if (subchannelId) {
      return subchannel?.subjectObj || {};
    }
    return subjectObj;
  }, [subchannel?.subjectObj, subchannelId, subjectObj]);

  const appliedIsRespondingToSubject = useMemo(() => {
    if (subchannelId) {
      return subchannel?.isRespondingToSubject;
    }
    return isRespondingToSubject;
  }, [isRespondingToSubject, subchannel?.isRespondingToSubject, subchannelId]);

  const chessTarget = useMemo(
    () => currentChannel?.chessTarget,
    [currentChannel?.chessTarget]
  );

  const replyTarget = useMemo(() => {
    if (subchannelId) {
      return subchannel?.replyTarget;
    }
    return currentChannel?.replyTarget;
  }, [currentChannel?.replyTarget, subchannel?.replyTarget, subchannelId]);

  const isCielChannel = useMemo(
    () => partner?.id === CIEL_TWINKLE_ID,
    [partner?.id]
  );
  const isZeroChannel = useMemo(
    () => partner?.id === ZERO_TWINKLE_ID,
    [partner?.id]
  );

  const isRestrictedChannel = useMemo(
    () => subchannel?.isRestricted && !isAdmin,
    [isAdmin, subchannel?.isRestricted]
  );
  const isChatRestricted = useMemo(
    () => !!isRestrictedChannel,
    [isRestrictedChannel]
  );
  const loadMoreButtonShown = useMemo(() => {
    if (subchannel) {
      return subchannel?.loadMoreButtonShown;
    }
    return messagesLoadMoreButton;
  }, [messagesLoadMoreButton, subchannel]);

  const messages = useMemo(() => {
    const displayedMessageIds = subchannel
      ? subchannel?.messageIds
      : messageIds;
    const displayedMessagesObj = subchannel
      ? subchannel?.messagesObj
      : messagesObj;
    const result = [];
    const dupe: { [key: string]: any } = {};
    for (const messageId of displayedMessageIds) {
      if (!dupe[messageId]) {
        const message = displayedMessagesObj[messageId];
        if (message) {
          result.push(message);
          dupe[messageId] = true;
        }
      }
    }
    return result;
  }, [messageIds, messagesObj, subchannel]);

  const selectedChannelIsOnCall = useMemo(
    () => selectedChannelId === channelOnCall.id,
    [channelOnCall.id, selectedChannelId]
  );

  const subjectId = useMemo(() => appliedSubjectObj?.id, [appliedSubjectObj]);

  const selectedChannelIdAndPathIdNotSynced = useMemo(() => {
    const pathId = Number(currentPathId);
    return (
      !isNaN(pathId) &&
      pathId !== 0 &&
      parseChannelPath(pathId) !== selectedChannelId
    );
  }, [currentPathId, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === channelOnCall.id) {
      handleScrollToBottom();
    }
  }, [channelOnCall, selectedChannelId]);

  const containerHeight = `CALC(100% - 1rem - 2px - ${
    socketConnected && textAreaHeight ? `${textAreaHeight}px - 1rem` : '5.5rem'
  }${
    socketConnected && appliedIsRespondingToSubject
      ? ' - 8rem - 2px'
      : replyTarget
      ? ' - 12rem - 2px'
      : chessTarget
      ? deviceIsMobile
        ? ' - 317px'
        : ' - 509px'
      : ''
  }
    ${selectedChannelIsOnCall ? ` - ${CALL_SCREEN_HEIGHT}` : ''})`;

  const loadingAnimationShown = useMemo(() => {
    if (
      creatingNewDMChannel ||
      reconnecting ||
      selectedChannelIdAndPathIdNotSynced
    ) {
      return true;
    }
    if (
      currentPathId === VOCAB_CHAT_TYPE ||
      currentPathId === AI_CARD_CHAT_TYPE
    ) {
      return false;
    }
    if (subchannelPath) {
      return !subchannel?.loaded;
    }
    return !currentChannel?.loaded;
  }, [
    creatingNewDMChannel,
    reconnecting,
    selectedChannelIdAndPathIdNotSynced,
    subchannelPath,
    currentPathId,
    currentChannel?.loaded,
    subchannel?.loaded
  ]);

  const chessCountdownNumber = useMemo(
    () => chessCountdownObj[selectedChannelId],
    [chessCountdownObj, selectedChannelId]
  );

  useEffect(() => {
    onSetChessModalShown(false);
    onSetWordleModalShown(false);
    setTransactionModalShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (wordleModalShown) {
      ChatInputRef.current.blur();
    }
  }, [wordleModalShown]);

  useEffect(() => {
    if (isReloadRequired) {
      reload();
    }
    async function reload() {
      const data = await loadChatChannel({
        channelId: selectedChannelId
      });
      onEnterChannelWithId(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReloadRequired, selectedChannelId]);

  useEffect(() => {
    socket.on('chess_timer_cleared', handleChessTimerCleared);
    socket.on('chess_countdown_number_received', onReceiveCountdownNumber);
    socket.on('new_message_received', handleReceiveMessage);

    function handleChessTimerCleared({ channelId }: { channelId: number }) {
      setChessCountdownObj((chessCountdownObj) => ({
        ...chessCountdownObj,
        [channelId]: null
      }));
    }

    function onReceiveCountdownNumber({
      channelId,
      number
    }: {
      channelId: number;
      number: number;
    }) {
      if (channelId === selectedChannelId) {
        if (number === 0) {
          onSetChessModalShown(false);
        }
        // this is to prevent "awaiting opponent's move" from showing up
        onSetMessageState({
          channelId,
          messageId: currentChannel?.lastChessMessageId,
          newState: {
            moveViewTimeStamp: Math.floor(Date.now() / 1000)
          }
        });
        setChessCountdownObj((chessCountdownObj) => ({
          ...chessCountdownObj,
          [channelId]: number
        }));
      }
    }
    function handleReceiveMessage({ message }: { message: any }) {
      if (message.isChessMsg) {
        setChessCountdownObj((chessCountdownObj) => ({
          ...chessCountdownObj,
          [message.channelId]: null
        }));
      }
    }

    return function cleanUp() {
      socket.removeListener('chess_timer_cleared', handleChessTimerCleared);
      socket.removeListener(
        'chess_countdown_number_received',
        onReceiveCountdownNumber
      );
      socket.removeListener('new_message_received', handleReceiveMessage);
    };
  });

  useEffect(() => {
    const MessagesContainer = MessagesRef.current;
    addEvent(MessagesContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(MessagesContainer, 'scroll', handleScroll);
    };

    function handleScroll() {
      clearTimeout(timerRef.current);
      scrolledToBottomRef.current =
        (MessagesRef.current || {}).scrollTop >= unseenButtonThreshold;
      const scrollThreshold =
        (MessagesRef.current || {}).scrollHeight -
        (MessagesRef.current || {}).offsetHeight;
      const scrollTop = (MessagesRef.current || {}).scrollTop;
      const distanceFromTop = scrollThreshold + scrollTop;
      if (distanceFromTop < 3) {
        handleLoadMore();
      }
      if (scrollTop >= unseenButtonThreshold) {
        setNewUnseenMessage(false);
      }
    }
  });

  useEffect(() => {
    favoritingRef.current = false;
  }, [selectedChannelId]);

  const handleChessModalShown = useCallback(() => {
    if (banned?.chess) {
      return;
    }
    const channelId = currentChannel?.id;
    if (chessCountdownObj[channelId] !== 0) {
      onSetReplyTarget({ channelId, target: null });
      onSetChessModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banned?.chess, chessCountdownObj, currentChannel?.id]);

  const handleWordleModalShown = useCallback(() => {
    const channelId = currentChannel?.id;
    onSetReplyTarget({ channelId, target: null });
    onSetWordleModalShown(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel?.id]);

  const handleHideChat = useCallback(async () => {
    await hideChat(selectedChannelId);
    onHideChat(selectedChannelId);
    const data = await loadChatChannel({
      channelId: GENERAL_CHAT_ID
    });
    onEnterChannelWithId(data);
    setHideModalShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  const handleSetChessTarget = useCallback(
    ({
      channelId,
      messageId,
      chessState
    }: {
      channelId: number;
      messageId: number;
      chessState: any;
    }) => {
      onSetChessTarget({ channelId, messageId, target: chessState });
      ChatInputRef.current.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleSubmitChessTargetMessage = useCallback(
    async (message: any) => {
      const messageId = uuidv1();
      onSubmitMessage({
        messageId,
        message: {
          userId,
          chessState: chessTarget,
          profilePicUrl,
          username,
          content: message,
          channelId: selectedChannelId
        }
      });
      onSetChessTarget({ channelId: selectedChannelId, target: null });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessTarget, selectedChannelId]
  );

  const handleRequestChessRewind = useCallback(
    async (chessTarget: any) => {
      const messageId = uuidv1();
      onSubmitMessage({
        messageId,
        message: {
          userId,
          chessState: chessTarget,
          profilePicUrl,
          username,
          isNotification: true,
          content: 'proposed a new game from this position',
          channelId: selectedChannelId
        }
      });
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [chessTarget, selectedChannelId]
  );

  const handleConfirmChessMove = useCallback(
    async ({
      state,
      isCheckmate,
      isStalemate,
      moveNumber,
      previousState
    }: {
      state: any;
      isCheckmate: boolean;
      isStalemate: boolean;
      moveNumber: number;
      previousState: any;
    }) => {
      const gameWinnerId = isCheckmate ? userId : isStalemate ? 0 : null;
      const params = {
        userId,
        chessState: {
          ...state,
          previousState: previousState
            ? {
                ...previousState,
                previousState: null
              }
            : null
        },
        isChessMsg: 1,
        gameWinnerId
      };
      const content = 'Made a chess move';
      try {
        if (selectedChannelId) {
          onSetReplyTarget({ channelId: selectedChannelId, target: null });
          socket.emit(
            'user_made_a_move',
            {
              userId,
              channelId: selectedChannelId,
              moveNumber
            },
            (success: boolean) => {
              if (success) {
                const messageId = uuidv1();
                onSubmitMessage({
                  messageId,
                  message: {
                    ...params,
                    profilePicUrl,
                    username,
                    content,
                    channelId: selectedChannelId
                  }
                });
              }
              onSetChessModalShown(false);
            }
          );
        } else {
          if (selectedChannelId === 0 && !recipientId) {
            reportError({
              componentPath: 'MessagesContainer/index',
              message: `handleConfirmChessMove: User is trying to send the first chess message to someone but recipient ID is missing`
            });
            return window.location.reload();
          }
          const { alreadyExists, channel, message, pathId } =
            await startNewDMChannel({
              ...params,
              content,
              recipientId
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          socket.emit('join_chat_group', message.channelId);
          socket.emit('send_bi_chat_invitation', {
            userId: recipientId,
            members: currentChannel.members,
            pathId,
            message
          });
          onUpdateChannelPathIdHash({ channelId: channel.id, pathId });
          onCreateNewDMChannel({ channel, withoutMessage: true });
          navigate(`/chat/${pathId}`, { replace: true });
          onSetChessModalShown(false);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profilePicUrl, recipientId, selectedChannelId, userId, username]
  );

  const handleDelete = useCallback(async () => {
    const { messageId } = deleteModal;
    await deleteChatMessage({ messageId });
    onDeleteMessage({
      channelId: selectedChannelId,
      messageId,
      subchannelId: subchannel?.id
    });
    setDeleteModal({
      shown: false,
      fileName: '',
      filePath: '',
      messageId: null
    });
    socket.emit('delete_chat_message', {
      channelId: selectedChannelId,
      subchannelId,
      messageId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteModal, selectedChannelId, subchannelId]);

  const handleEditSettings = useCallback(
    async ({
      editedChannelName,
      editedIsClosed,
      editedCanChangeSubject,
      editedTheme
    }: {
      editedChannelName: string;
      editedIsClosed: boolean;
      editedCanChangeSubject: boolean;
      editedTheme: string;
    }) => {
      await editChannelSettings({
        channelName: editedChannelName,
        isClosed: editedIsClosed,
        channelId: selectedChannelId,
        canChangeSubject: editedCanChangeSubject,
        theme: editedTheme
      });
      onEditChannelSettings({
        channelName: editedChannelName,
        isClosed: editedIsClosed,
        channelId: selectedChannelId,
        canChangeSubject: editedCanChangeSubject,
        theme: editedTheme
      });
      if (userId === currentChannel.creatorId) {
        socket.emit('new_channel_settings', {
          channelName: editedChannelName,
          isClosed: editedIsClosed,
          channelId: selectedChannelId,
          canChangeSubject: editedCanChangeSubject,
          theme: editedTheme
        });
      }
      setSettingsModalShown(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentChannel?.creatorId, selectedChannelId, userId]
  );

  const handleInviteUsersDone = useCallback(
    async ({
      users,
      message,
      isClass
    }: {
      users: any[];
      message: any;
      isClass: boolean;
    }) => {
      if (isClass) {
        const channelData = {
          id: selectedChannelId,
          channelName,
          pathId: currentChannel.pathId
        };
        socket.emit('new_chat_message', {
          message: {
            ...message,
            channelId: message.channelId
          },
          channel: channelData,
          newMembers: users
        });
        socket.emit(
          'send_group_chat_invitation',
          users.map((user) => user.id),
          {
            message: { ...message, messageId: message.id },
            isClass,
            pathId: currentChannel.pathId
          }
        );
      } else {
        const recipientIds = [];
        for (const user of users) {
          if (!user.id) {
            reportError({
              componentPath: 'MessagesContainer/index',
              message: `handleInviteUsersDone: User is trying to invite people to their channel but at least one of their user ID is missing. Channel ID was: ${selectedChannelId}`
            });
            return window.location.reload();
          }
          recipientIds.push(user.id);
        }
        const { channels, messages } = await sendInvitationMessage({
          recipients: recipientIds,
          origin: selectedChannelId
        });
        for (let i = 0; i < channels.length; i++) {
          onReceiveMessageOnDifferentChannel({
            message: messages[i],
            channel: channels[i].channel,
            pageVisible: true,
            usingChat: true,
            isMyMessage: true
          });
        }
      }
      setInviteUsersModalShown(false);
      if (!isClass) {
        const messageId = uuidv1();
        onSubmitMessage({
          messageId,
          message: {
            channelId: selectedChannelId,
            userId,
            username,
            id: uuidv1(),
            profilePicUrl,
            content: `sent ${
              users.length === 1 ? 'an ' : ''
            }invitation message${users.length > 1 ? 's' : ''} to ${
              users.length > 1 ? `${users.length} users` : users[0].username
            }`,
            isNotification: true
          }
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelName,
      currentChannel,
      profilePicUrl,
      selectedChannelId,
      userId,
      username
    ]
  );

  const handleLeaveChannel = useCallback(async () => {
    if (!leavingRef.current) {
      try {
        setIsLeaving(true);
        leavingRef.current = true;
        await leaveChannel(selectedChannelId);
        onLeaveChannel({ channelId: selectedChannelId, userId });
        socket.emit('leave_chat_channel', {
          channelId: selectedChannelId,
          userId,
          username,
          profilePicUrl
        });
        navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        setLeaveConfirmModalShown(false);
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setIsLeaving(false);
        leavingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePicUrl, selectedChannelId, userId, username]);

  const handleLeaveConfirm = useCallback(() => {
    try {
      if (currentChannel.creatorId === userId) {
        setLeaveConfirmModalShown(false);
        if (currentChannel.members.length === 1) {
          handleLeaveChannel();
        } else {
          setSelectNewOwnerModalShown(true);
        }
      } else {
        handleLeaveChannel();
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [
    currentChannel?.creatorId,
    currentChannel?.members?.length,
    handleLeaveChannel,
    userId
  ]);

  const handleLoadMore = useCallback(async () => {
    if (loadMoreButtonShown) {
      const messageId = messages[messages.length - 1].id;
      if (!loadMoreButtonLock.current) {
        setLoadingMore(true);
        loadMoreButtonLock.current = true;
        prevScrollPosition.current = (MessagesRef.current || {}).scrollTop;
        try {
          const {
            messageIds,
            messagesObj,
            loadedChannelId,
            loadedSubchannelId
          } = await loadMoreChatMessages({
            userId,
            messageId,
            channelId: selectedChannelId,
            subchannelId: subchannel?.id
          });
          onLoadMoreMessages({
            messageIds,
            messagesObj,
            loadedChannelId,
            loadedSubchannelId
          });
          loadMoreButtonLock.current = false;
        } catch (error) {
          console.error(error);
          loadMoreButtonLock.current = false;
        }
        if (deviceIsMobile) {
          setTimeout(
            () =>
              ((MessagesRef.current || {}).scrollTop =
                prevScrollPosition.current),
            50
          );
        }
      }
    }
    setLoadingMore(loadMoreButtonLock.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    messages,
    loadMoreButtonShown,
    selectedChannelId,
    subchannel?.id,
    userId
  ]);

  const handleAcceptGroupInvitation = useCallback(
    async (invitationChannelPath: string) => {
      const invitationChannelId =
        channelPathIdHash[invitationChannelPath] ||
        parseChannelPath(invitationChannelPath);
      if (!channelPathIdHash[invitationChannelPath]) {
        onUpdateChannelPathIdHash({
          channelId: invitationChannelId,
          pathId: invitationChannelPath
        });
      }
      const { channel, joinMessage } = await acceptInvitation(
        invitationChannelId
      );
      if (channel.id === invitationChannelId) {
        socket.emit('join_chat_group', channel.id);
        socket.emit('new_chat_message', {
          message: joinMessage,
          channel: {
            id: channel.id,
            channelName: channel.channelName,
            pathId: channel.pathId
          },
          newMembers: [{ id: userId, username, profilePicUrl }]
        });
        navigate(`/chat/${invitationChannelPath}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentChannel?.creatorId, selectedChannelId, userId]
  );

  const handleCancelRewindRequest = useCallback(async () => {
    const { messageId, cancelMessage, timeStamp } = await cancelChessRewind(
      selectedChannelId
    );
    socket.emit('cancel_chess_rewind', {
      channelId: selectedChannelId,
      messageId,
      cancelMessage,
      userId,
      username,
      profilePicUrl,
      timeStamp
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePicUrl, selectedChannelId, userId, username]);

  const handleAcceptRewind = useCallback(
    async (chessState: boolean) => {
      onSetChessGameState({
        channelId: selectedChannelId,
        newState: { rewindRequestId: null }
      });
      await rewindChessMove({
        channelId: selectedChannelId,
        chessState
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedChannelId]
  );

  const handleDeclineRewind = useCallback(async () => {
    const { messageId, declineMessage, timeStamp } = await declineChessRewind(
      selectedChannelId
    );
    socket.emit('decline_chess_rewind', {
      channelId: selectedChannelId,
      messageId,
      declineMessage,
      userId,
      username,
      profilePicUrl,
      timeStamp
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePicUrl, selectedChannelId, userId, username]);

  const handleFavoriteClick = useCallback(async () => {
    if (!favoritingRef.current) {
      favoritingRef.current = true;
      try {
        const favorited = await putFavoriteChannel(selectedChannelId);
        onSetFavoriteChannel({ channelId: selectedChannelId, favorited });
        favoritingRef.current = false;
      } catch (error) {
        console.error(error);
        favoritingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  const handleMessageSubmit = useCallback(
    async ({
      content,
      rewardAmount,
      rewardReason,
      target,
      subchannelId
    }: {
      content: string;
      rewardAmount?: number;
      rewardReason?: string;
      target: string;
      subchannelId?: number;
    }) => {
      setTextAreaHeight(0);
      if (chessTarget) {
        return handleSubmitChessTargetMessage(content);
      }
      const isFirstDirectMessage = selectedChannelId === 0;
      if (isFirstDirectMessage) {
        if (creatingNewDMChannel) return;
        if (!recipientId) {
          reportError({
            componentPath: 'MessagesContainer/index',
            message: `handleMessageSubmit: User is trying to send the first message to someone but recipient ID is missing. Content of the message was "${content}," and pathId was ${
              currentPathId ? `"${currentPathId}"` : 'empty'
            }`
          });
          return window.location.reload();
        }
        onSetCreatingNewDMChannel(true);
        try {
          const { alreadyExists, channel, message, pathId } =
            await startNewDMChannel({
              content,
              userId,
              recipientId
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          socket.emit('join_chat_group', message.channelId);
          socket.emit('send_bi_chat_invitation', {
            userId: recipientId,
            members: currentChannel.members,
            pathId,
            message
          });
          onUpdateChannelPathIdHash({ channelId: channel.id, pathId });
          navigate(`/chat/${pathId}`, { replace: true });
          onCreateNewDMChannel({ channel, message, withoutMessage: true });
          onSetCreatingNewDMChannel(false);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      }
      const message = {
        userId,
        username,
        profilePicUrl,
        content,
        channelId: selectedChannelId,
        subjectId: appliedIsRespondingToSubject ? subjectId : null
      };
      const messageId = uuidv1();
      onSubmitMessage({
        isRespondingToSubject: appliedIsRespondingToSubject,
        messageId,
        message,
        replyTarget: target,
        rewardReason,
        rewardAmount,
        subchannelId
      });
      onSetReplyTarget({
        channelId: selectedChannelId,
        subchannelId,
        target: null
      });
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chessTarget,
      creatingNewDMChannel,
      appliedIsRespondingToSubject,
      profilePicUrl,
      recipientId,
      selectedChannelId,
      subjectId,
      userId,
      username
    ]
  );

  const handleUpdateRankings = useCallback(async () => {
    const {
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    } = await loadRankings();
    onGetRanks({
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRewardMessageSubmit = useCallback(
    async ({
      amount,
      reasonId,
      message
    }: {
      amount: number;
      reasonId: string;
      message: any;
    }) => {
      handleMessageSubmit({
        content: rewardReasons[reasonId].message,
        rewardAmount: amount,
        rewardReason: reasonId,
        target: message,
        subchannelId
      });
      await updateUserXP({
        amount,
        action: 'reward',
        target: 'chat',
        targetId: message.id,
        type: 'increase',
        userId: message.userId
      });
      handleUpdateRankings();
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleMessageSubmit, handleUpdateRankings, subchannelId]
  );

  const handleSelectNewOwner = useCallback(
    async ({ newOwner, andLeave }: { newOwner: string; andLeave: boolean }) => {
      if (selectingNewOwnerRef.current) return;
      setSelectingNewOwner(true);
      selectingNewOwnerRef.current = true;
      try {
        const notificationMsg = await changeChannelOwner({
          channelId: selectedChannelId,
          newOwner
        });

        socket.emit('new_channel_owner', {
          channelId: selectedChannelId,
          userId,
          username,
          profilePicUrl,
          newOwner,
          notificationMsg
        });

        if (andLeave) {
          await handleLeaveChannel();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSelectingNewOwner(false);
        selectingNewOwnerRef.current = false;
        setSelectNewOwnerModalShown(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleLeaveChannel, profilePicUrl, selectedChannelId, userId, username]
  );

  return (
    <ErrorBoundary componentPath="MessagesContainer/index">
      {selectedChannelIsOnCall && (
        <CallScreen style={{ height: CALL_SCREEN_HEIGHT }} />
      )}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
        `}
        style={{
          height: containerHeight
        }}
      >
        <ChannelHeader
          currentChannel={currentChannel}
          displayedThemeColor={displayedThemeColor}
          onInputFocus={() => ChatInputRef.current.focus()}
          onSetInviteUsersModalShown={setInviteUsersModalShown}
          onSetLeaveConfirmModalShown={setLeaveConfirmModalShown}
          onSetSettingsModalShown={setSettingsModalShown}
          selectedChannelId={selectedChannelId}
          subchannel={subchannel}
          onFavoriteClick={handleFavoriteClick}
        />
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column-reverse',
            overflowY: 'scroll'
          }}
          ref={MessagesRef}
        >
          {loadingAnimationShown ? (
            <Loading style={{ position: 'absolute', top: '7rem' }} />
          ) : (
            <>
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  zIndex: 1000
                }}
              >
                {newUnseenMessage && (
                  <Button
                    filled
                    color="orange"
                    style={{ opacity: 0.9 }}
                    onClick={() => {
                      setNewUnseenMessage(false);
                      handleScrollToBottom();
                    }}
                  >
                    New Message
                  </Button>
                )}
              </div>
              {messages.map((message, index) => (
                <Message
                  key={message.id || message.tempMessageId}
                  channelId={selectedChannelId}
                  chessCountdownNumber={chessCountdownNumber}
                  partner={partner}
                  currentChannel={currentChannel}
                  displayedThemeColor={displayedThemeColor}
                  forceRefreshForMobile={handleForceRefreshForMobile}
                  isAICardModalShown={isAICardModalShown}
                  index={index}
                  isOneOfLastFiveMessages={index <= 4}
                  isLastMsg={index === 0}
                  isNotification={!!message.isNotification}
                  isBanned={!!banned?.chat}
                  isRestricted={isChatRestricted}
                  loading={loadingAnimationShown}
                  message={message}
                  onAcceptGroupInvitation={handleAcceptGroupInvitation}
                  onChessBoardClick={handleChessModalShown}
                  onChessSpoilerClick={handleChessSpoilerClick}
                  onCancelRewindRequest={handleCancelRewindRequest}
                  onAcceptRewind={handleAcceptRewind}
                  onDeclineRewind={handleDeclineRewind}
                  onDelete={handleShowDeleteModal}
                  onReceiveNewMessage={handleReceiveNewMessage}
                  onReplyClick={() => ChatInputRef.current.focus()}
                  onRequestRewind={handleRequestChessRewind}
                  onRewardMessageSubmit={handleRewardMessageSubmit}
                  onSetAICardModalCardId={onSetAICardModalCardId}
                  onSetChessTarget={handleSetChessTarget}
                  onSetTransactionModalShown={setTransactionModalShown}
                  onScrollToBottom={handleScrollToBottom}
                  onShowSubjectMsgsModal={({ subjectId, content }) =>
                    setSubjectMsgsModal({ shown: true, subjectId, content })
                  }
                />
              ))}
              {!loadingAnimationShown &&
                (loadMoreButtonShown ? (
                  <div>
                    <div style={{ width: '100%', height: '1rem' }} />
                    <div
                      style={{
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%'
                      }}
                    >
                      <LoadMoreButton
                        filled
                        color={loadMoreButtonColor}
                        loading={loadingMore}
                        onClick={handleLoadMore}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ paddingTop: '20rem' }} />
                ))}
            </>
          )}
        </div>
      </div>
      {hideModalShown && (
        <ConfirmModal
          onHide={() => setHideModalShown(false)}
          title="Hide Chat"
          onConfirm={handleHideChat}
        />
      )}
      {deleteModal.shown && (
        <ConfirmModal
          onHide={() =>
            setDeleteModal({
              shown: false,
              fileName: '',
              filePath: '',
              messageId: null
            })
          }
          title="Remove Message"
          onConfirm={handleDelete}
        />
      )}
      {subjectMsgsModal.shown && (
        <SubjectMsgsModal
          displayedThemeColor={displayedThemeColor}
          subjectId={subjectMsgsModal.subjectId}
          subjectTitle={subjectMsgsModal.content}
          onHide={() =>
            setSubjectMsgsModal({
              shown: false,
              subjectId: 0,
              content: ''
            })
          }
        />
      )}
      <div
        style={{
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
      >
        <MessageInput
          key={selectedChannelId}
          currentTransactionId={currentTransactionId}
          selectedChannelId={selectedChannelId}
          isZeroChannel={isZeroChannel}
          isCielChannel={isCielChannel}
          isRestrictedChannel={!!isRestrictedChannel}
          isBanned={!!banned?.chat}
          innerRef={ChatInputRef}
          inputSubmitDisabled={currentChannel.inputSubmitDisabled}
          loading={loadingAnimationShown}
          socketConnected={socketConnected}
          inputState={inputState}
          isRespondingToSubject={appliedIsRespondingToSubject}
          isTwoPeopleChannel={currentChannel.twoPeople}
          onChessButtonClick={handleChessModalShown}
          onWordleButtonClick={handleWordleModalShown}
          onMessageSubmit={({ message, subchannelId }) =>
            handleMessageSubmit({
              content: message,
              subchannelId,
              target: replyTarget
            })
          }
          onHeightChange={(height) => {
            if (height !== textAreaHeight) {
              setTextAreaHeight(height > 46 ? height : 0);
            }
          }}
          onSelectVideoButtonClick={() => setSelectVideoModalShown(true)}
          onSetTextAreaHeight={setTextAreaHeight}
          onSetTransactionModalShown={setTransactionModalShown}
          recipientId={recipientId}
          chessTarget={chessTarget}
          replyTarget={replyTarget}
          subchannelId={subchannel?.id}
          subjectId={subjectId}
          subjectObj={appliedSubjectObj}
        />
      </div>
      {chessModalShown && partner && (
        <ChessModal
          currentChannel={currentChannel}
          channelId={selectedChannelId}
          countdownNumber={chessCountdownObj[selectedChannelId]}
          myId={userId}
          onConfirmChessMove={handleConfirmChessMove}
          onHide={() => onSetChessModalShown(false)}
          onAcceptRewind={handleAcceptRewind}
          onCancelRewindRequest={handleCancelRewindRequest}
          onDeclineRewind={handleDeclineRewind}
          onSpoilerClick={handleChessSpoilerClick}
          opponentId={partner.id}
          opponentName={partner.username}
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
          onHide={() => onSetWordleModalShown(false)}
          socketConnected={socketConnected}
          theme={displayedThemeColor}
        />
      )}
      {inviteUsersModalShown && (
        <InviteUsersModal
          onHide={() => setInviteUsersModalShown(false)}
          currentChannel={currentChannel}
          selectedChannelId={selectedChannelId}
          onDone={handleInviteUsersDone}
        />
      )}
      {settingsModalShown && (
        <SettingsModal
          canChangeSubject={currentChannel.canChangeSubject}
          channelName={channelName}
          isClass={currentChannel.isClass}
          isClosed={currentChannel.isClosed}
          members={currentChannel.members}
          onHide={() => setSettingsModalShown(false)}
          onDone={handleEditSettings}
          channelId={selectedChannelId}
          onPurchaseSubject={() =>
            socket.emit('purchased_chat_subject', selectedChannelId)
          }
          onSelectNewOwner={handleSelectNewOwner}
          onScrollToBottom={handleScrollToBottom}
          selectingNewOwner={selectingNewOwner}
          theme={currentChannel.theme}
          unlockedThemes={currentChannel.unlockedThemes}
          userIsChannelOwner={currentChannel.creatorId === userId}
        />
      )}
      {leaveConfirmModalShown && (
        <ConfirmModal
          title={leaveChatGroupLabel}
          onHide={() => setLeaveConfirmModalShown(false)}
          onConfirm={handleLeaveConfirm}
          disabled={isLeaving}
        />
      )}
      {selectVideoModalShown && (
        <SelectVideoModal
          onHide={() => setSelectVideoModalShown(false)}
          onDone={(videoId) => {
            onEnterComment({
              contentType: 'chat',
              contentId: selectedChannelId,
              targetKey: subchannelId,
              text: !stringIsEmpty(textForThisChannel)
                ? `${textForThisChannel.trim()} https://www.twin-kle.com/videos/${videoId}`
                : `https://www.twin-kle.com/videos/${videoId}`
            });
            setSelectVideoModalShown(false);
          }}
        />
      )}
      {!!selectNewOwnerModalShown && (
        <SelectNewOwnerModal
          onHide={() => setSelectNewOwnerModalShown(false)}
          members={currentChannel.members}
          onSubmit={handleSelectNewOwner}
          isClass={currentChannel.isClass}
          loading={selectingNewOwner}
          andLeave
        />
      )}
      {TransactionModalShown && partner && (
        <TransactionModal
          currentTransactionId={currentTransactionId}
          channelId={selectedChannelId}
          partner={partner}
          isAICardModalShown={isAICardModalShown}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onHide={() => setTransactionModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );

  function handleChessSpoilerClick(senderId: number) {
    socket.emit('start_chess_timer', {
      currentChannel: {
        id: selectedChannelId,
        channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      },
      selectedChannelId,
      targetUserId: userId,
      winnerId: senderId,
      isResign: false
    });
    onSetChessModalShown(true);
  }

  function handleForceRefreshForMobile() {
    const currentScrollTop = (MessagesRef.current || {}).scrollTop || 0;
    (MessagesRef.current || {}).scrollTop = currentScrollTop;
    (MessagesRef.current || {}).scrollTop = currentScrollTop - 1000;
    (MessagesRef.current || {}).scrollTop = currentScrollTop;
  }

  function handleReceiveNewMessage() {
    if (MessagesRef.current && !scrolledToBottomRef.current) {
      setNewUnseenMessage(true);
    } else {
      handleScrollToBottom();
    }
  }

  function handleScrollToBottom() {
    if (MessagesRef.current) {
      if (deviceIsMobile) {
        (MessagesRef.current || {}).scrollTop = 0;
        (MessagesRef.current || {}).scrollTop = -1000;
      }
      (MessagesRef.current || {}).scrollTop = 0;
    }
  }

  function handleShowDeleteModal({
    fileName,
    filePath,
    messageId
  }: {
    fileName: string;
    filePath: string;
    messageId: number;
  }) {
    setDeleteModal({
      shown: true,
      fileName,
      filePath,
      messageId
    });
  }
}

export default memo(MessagesContainer);
