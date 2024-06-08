import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import DisplayedMessages from './DisplayedMessages';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import MessageInput from './MessageInput';
import ChannelHeader from './ChannelHeader';
import SubjectMsgsModal from '../../Modals/SubjectMsgsModal';
import InviteUsersModal from '../../Modals/InviteUsers';
import ChessModal from '../../Modals/ChessModal';
import WordleModal from '../../Modals/WordleModal';
import SelectVideoModal from '../../Modals/SelectVideoModal';
import SelectNewOwnerModal from '../../Modals/SelectNewOwnerModal';
import TransactionModal from '../../Modals/TransactionModal';
import SettingsModal from '../../Modals/SettingsModal';
import BuyTopicsModal from '../../Modals/BuyTopicsModal';
import CallScreen from './CallScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import { v1 as uuidv1 } from 'uuid';
import {
  GENERAL_CHAT_PATH_ID,
  AI_CARD_CHAT_TYPE,
  VOCAB_CHAT_TYPE,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID
} from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { socket } from '~/constants/io';
import { isMobile, isTablet, parseChannelPath } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import LocalContext from '../../Context';
import localize from '~/constants/localize';

const CALL_SCREEN_HEIGHT = '30%';
const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);
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
  subchannelPath,
  topicSelectorModalShown,
  onSetTopicSelectorModalShown
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
  onSetAICardModalCardId: (cardId: number) => void;
  subchannelId?: number;
  subchannelPath?: string;
  topicSelectorModalShown: boolean;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const declineChessRewind = useAppContext(
    (v) => v.requestHelpers.declineChessRewind
  );
  const editCanChangeTopic = useAppContext(
    (v) => v.requestHelpers.editCanChangeTopic
  );
  const cancelChessRewind = useAppContext(
    (v) => v.requestHelpers.cancelChessRewind
  );
  const rewindChessMove = useAppContext(
    (v) => v.requestHelpers.rewindChessMove
  );
  const loadTopicMessages = useAppContext(
    (v) => v.requestHelpers.loadTopicMessages
  );
  const onLoadTopicMessages = useChatContext(
    (v) => v.actions.onLoadTopicMessages
  );
  const navigate = useNavigate();
  const {
    actions: {
      onDeleteMessage,
      onEditChannelSettings,
      onEnterComment,
      onEnterChannelWithId,
      onHideChat,
      onLeaveChannel,
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
      changeChannelOwner,
      deleteChatMessage,
      editChannelSettings,
      hideChat,
      leaveChannel,
      loadChatChannel,
      putFavoriteChannel,
      sendInvitationMessage,
      startNewDMChannel
    },
    state: {
      channelOnCall,
      chessModalShown,
      creatingNewDMChannel,
      reconnecting,
      selectedChannelId,
      socketConnected,
      wordleModalShown
    },
    inputState
  } = useContext(LocalContext);
  const { banned, profilePicUrl, userId, isAdmin, username } = useKeyContext(
    (v) => v.myState
  );
  const {
    currentTransactionId,
    isReloadRequired = false,
    isRespondingToSubject = false,
    subchannelIds = [],
    subchannelObj,
    wordleGuesses = [],
    wordleSolution,
    wordleWordLevel,
    wordleAttemptState,
    wordleStats = {},
    legacyTopicObj = {},
    selectedTab = 'all'
  } = currentChannel;
  const textForThisChannel = useMemo(
    () => inputState['chat' + selectedChannelId]?.text || '',
    [selectedChannelId, inputState]
  );
  const [chessCountdownObj, setChessCountdownObj] = useState<
    Record<string, any>
  >({});
  const [textAreaHeight, setTextAreaHeight] = useState(0);
  const [inviteUsersModalShown, setInviteUsersModalShown] = useState(false);
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
  const [buyTopicModalShown, setBuyTopicModalShown] = useState(false);
  const [settingsModalShown, setSettingsModalShown] = useState(false);
  const [leaveConfirmModalShown, setLeaveConfirmModalShown] = useState(false);
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [hideModalShown, setHideModalShown] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [selectingNewOwner, setSelectingNewOwner] = useState(false);
  const leavingRef = useRef(false);
  const selectingNewOwnerRef = useRef(false);
  const MessageToScrollTo = useRef(null);
  const MessagesRef: React.RefObject<any> = useRef(null);
  const ChatInputRef: React.RefObject<any> = useRef(null);
  const favoritingRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);

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

  const appliedLegacyTopicObj = useMemo(() => {
    if (subchannelId) {
      return subchannel?.legacyTopicObj || {};
    }
    return legacyTopicObj;
  }, [subchannel?.legacyTopicObj, subchannelId, legacyTopicObj]);

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

  const selectedChannelIsOnCall = useMemo(
    () => selectedChannelId === channelOnCall.id,
    [channelOnCall.id, selectedChannelId]
  );

  const selectedChannelIdAndPathIdNotSynced = useMemo(() => {
    const pathId = Number(currentPathId);
    return (
      !isNaN(pathId) &&
      pathId !== 0 &&
      parseChannelPath(pathId) !== selectedChannelId
    );
  }, [currentPathId, selectedChannelId]);

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

  const topicObj = useMemo(() => {
    if (currentChannel.topicObj) {
      return currentChannel.topicObj;
    }
    return {};
  }, [currentChannel.topicObj]);

  const subjectId = useMemo(
    () => appliedLegacyTopicObj?.id,
    [appliedLegacyTopicObj]
  );

  const appliedTopicId = useMemo(
    () =>
      currentChannel.selectedTopicId ||
      subjectId ||
      currentChannel.featuredTopicId,
    [currentChannel.selectedTopicId, currentChannel.featuredTopicId, subjectId]
  );

  const currentlySelectedTopic = useMemo(() => {
    if (topicObj[appliedTopicId]) {
      return topicObj[appliedTopicId];
    }
    return null;
  }, [appliedTopicId, topicObj]);

  const loadingAnimationShown = useMemo(() => {
    if (
      creatingNewDMChannel ||
      reconnecting ||
      selectedChannelIdAndPathIdNotSynced ||
      currentPathId === VOCAB_CHAT_TYPE ||
      currentPathId === AI_CARD_CHAT_TYPE
    ) {
      return true;
    }
    if (subchannelPath) {
      return !subchannel?.loaded;
    }
    if (selectedTab === 'all') {
      return !currentChannel?.loaded;
    }
    return !currentlySelectedTopic?.loaded;
  }, [
    creatingNewDMChannel,
    reconnecting,
    selectedChannelIdAndPathIdNotSynced,
    currentPathId,
    subchannelPath,
    selectedTab,
    currentlySelectedTopic?.loaded,
    subchannel?.loaded,
    currentChannel?.loaded
  ]);

  useEffect(() => {
    if (selectedTab === 'topic' && !currentlySelectedTopic?.loaded) {
      handleLoadTopicMessages();
    }

    async function handleLoadTopicMessages() {
      const appliedTopicId =
        currentChannel.selectedTopicId || currentChannel.featuredTopicId;
      const { messages, loadMoreShown, topicObj } = await loadTopicMessages({
        channelId: selectedChannelId,
        topicId: appliedTopicId
      });
      onLoadTopicMessages({
        channelId: selectedChannelId,
        messages,
        loadMoreShown,
        topicObj,
        topicId: appliedTopicId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentChannel.featuredTopicId,
    currentChannel.selectedTopicId,
    currentlySelectedTopic,
    selectedChannelId,
    selectedTab
  ]);

  useEffect(() => {
    if (!deviceIsMobile) {
      ChatInputRef.current.focus();
    }
    if (!MessageToScrollTo.current || selectedTab === 'topic') {
      shouldScrollToBottomRef.current = true;
    }
  }, [selectedTab, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === channelOnCall.id) {
      handleScrollToBottom();
    }
  }, [channelOnCall, selectedChannelId]);

  useEffect(() => {
    if (!loadingAnimationShown && shouldScrollToBottomRef.current) {
      handleScrollToBottom();
      shouldScrollToBottomRef.current = false;
    }
  }, [loadingAnimationShown, selectedTab]);

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
    onSetReplyTarget({ channelId: selectedChannelId, target: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, currentChannel?.selectedTopicId, selectedChannelId]);

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
    setHideModalShown(false);
    navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, selectedChannelId]);

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
          if (selectedChannelId === 0 && !partner?.id) {
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
              recipientId: partner?.id
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          socket.emit('join_chat_group', message.channelId);
          socket.emit('send_bi_chat_invitation', {
            userId: partner?.id,
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
    [profilePicUrl, partner?.id, selectedChannelId, userId, username]
  );

  const handleDelete = useCallback(async () => {
    const { messageId } = deleteModal;
    await deleteChatMessage({ messageId });
    onDeleteMessage({
      channelId: selectedChannelId,
      messageId,
      subchannelId: subchannel?.id,
      topicId: appliedTopicId
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
      messageId,
      topicId: appliedTopicId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedTopicId, deleteModal, selectedChannelId, subchannelId]);

  const handleEditSettings = useCallback(
    async ({
      editedChannelName,
      editedDescription,
      editedIsClosed,
      editedIsPublic,
      editedCanChangeSubject,
      editedTheme,
      newThumbPath
    }: {
      editedChannelName: string;
      editedDescription: string;
      editedIsClosed: boolean;
      editedIsPublic: boolean;
      editedCanChangeSubject: boolean;
      editedTheme: string;
      newThumbPath: string;
    }) => {
      await editChannelSettings({
        channelName: editedChannelName,
        description: editedDescription,
        isClosed: editedIsClosed,
        isPublic: editedIsPublic,
        channelId: selectedChannelId,
        canChangeSubject: editedCanChangeSubject,
        theme: editedTheme,
        newThumbPath
      });
      onEditChannelSettings({
        channelName: editedChannelName,
        description: editedDescription,
        isClosed: editedIsClosed,
        isPublic: editedIsPublic,
        channelId: selectedChannelId,
        canChangeSubject: editedCanChangeSubject,
        theme: editedTheme,
        newThumbPath
      });
      if (userId === currentChannel.creatorId) {
        socket.emit('new_channel_settings', {
          channelName: editedChannelName,
          description: editedDescription,
          isClosed: editedIsClosed,
          isPublic: editedIsPublic,
          channelId: selectedChannelId,
          canChangeSubject: editedCanChangeSubject,
          theme: editedTheme,
          newThumbPath
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
    async (chessState: any) => {
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
      topicId,
      selectedTab,
      subchannelId
    }: {
      content: string;
      rewardAmount?: number;
      rewardReason?: string;
      target: string;
      topicId?: number;
      selectedTab: string;
      subchannelId?: number;
    }) => {
      setTextAreaHeight(0);
      if (chessTarget) {
        return handleSubmitChessTargetMessage(content);
      }
      const isFirstDirectMessage = selectedChannelId === 0;
      if (isFirstDirectMessage) {
        if (creatingNewDMChannel) return;
        if (!partner?.id) {
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
              recipientId: partner?.id
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          socket.emit('join_chat_group', message.channelId);
          socket.emit('send_bi_chat_invitation', {
            userId: partner?.id,
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
      const isTopicMessage =
        selectedTab === 'topic' || appliedIsRespondingToSubject;
      const message = {
        userId,
        username,
        profilePicUrl,
        content,
        channelId: selectedChannelId,
        subjectId: isTopicMessage ? topicId || appliedTopicId : null
      };
      const messageId = uuidv1();
      onSubmitMessage({
        isRespondingToSubject: appliedIsRespondingToSubject,
        messageId,
        message,
        replyTarget: target,
        rewardReason,
        rewardAmount,
        selectedTab,
        topicId: isTopicMessage ? topicId : null,
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
      partner?.id,
      selectedChannelId,
      subjectId,
      userId,
      username
    ]
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
        {!subchannel?.isRestricted && (
          <ChannelHeader
            currentChannel={currentChannel}
            displayedThemeColor={displayedThemeColor}
            onInputFocus={() => ChatInputRef.current.focus()}
            onSetInviteUsersModalShown={setInviteUsersModalShown}
            onSetLeaveConfirmModalShown={setLeaveConfirmModalShown}
            onSetBuyTopicModalShown={setBuyTopicModalShown}
            onSetSettingsModalShown={setSettingsModalShown}
            onSetTopicSelectorModalShown={onSetTopicSelectorModalShown}
            selectedChannelId={selectedChannelId}
            topicSelectorModalShown={topicSelectorModalShown}
            subchannel={subchannel}
            onFavoriteClick={handleFavoriteClick}
            onSetHideModalShown={setHideModalShown}
          />
        )}
        <DisplayedMessages
          loading={loadingAnimationShown}
          chessTarget={chessTarget}
          chessCountdownObj={chessCountdownObj}
          currentChannel={currentChannel}
          displayedThemeColor={displayedThemeColor}
          isAICardModalShown={isAICardModalShown}
          isRestrictedChannel={!!isRestrictedChannel}
          ChatInputRef={ChatInputRef}
          MessagesRef={MessagesRef}
          MessageToScrollTo={MessageToScrollTo}
          onAcceptRewind={handleAcceptRewind}
          onCancelRewindRequest={handleCancelRewindRequest}
          onChessModalShown={handleChessModalShown}
          onChessSpoilerClick={handleChessSpoilerClick}
          onDeclineRewind={handleDeclineRewind}
          onMessageSubmit={handleMessageSubmit}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onSetDeleteModal={setDeleteModal}
          onSetSubjectMsgsModalShown={setSubjectMsgsModal}
          onSetTransactionModalShown={setTransactionModalShown}
          onScrollToBottom={handleScrollToBottom}
          partner={partner}
          selectedTab={selectedTab}
          subchannel={subchannel}
        />
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
          currentlyStreamingAIMsgId={currentChannel.currentlyStreamingAIMsgId}
          loading={loadingAnimationShown}
          socketConnected={socketConnected}
          inputState={inputState}
          isRespondingToSubject={appliedIsRespondingToSubject}
          isTwoPeopleChannel={currentChannel.twoPeople}
          onChessButtonClick={handleChessModalShown}
          onWordleButtonClick={handleWordleModalShown}
          onMessageSubmit={({ message, subchannelId, selectedTab, topicId }) =>
            handleMessageSubmit({
              content: message,
              subchannelId,
              selectedTab,
              topicId,
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
          recipientId={partner?.id}
          recipientUsername={partner?.username}
          chessTarget={chessTarget}
          replyTarget={replyTarget}
          selectedTab={selectedTab}
          subchannelId={subchannel?.id}
          topicId={appliedTopicId}
          legacyTopicObj={appliedLegacyTopicObj}
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
      {buyTopicModalShown && (
        <BuyTopicsModal
          canChangeSubject={currentChannel.canChangeSubject}
          onDone={async (canChange) => {
            await editCanChangeTopic({
              channelId: selectedChannelId,
              canChangeTopic: canChange
            });
            setBuyTopicModalShown(false);
          }}
          channelId={selectedChannelId}
          onPurchaseSubject={(topic) =>
            socket.emit('purchased_chat_subject', {
              channelId: selectedChannelId,
              topic
            })
          }
          onScrollToBottom={handleScrollToBottom}
          userIsChannelOwner={currentChannel.creatorId === userId}
        />
      )}
      {settingsModalShown && (
        <SettingsModal
          canChangeSubject={currentChannel.canChangeSubject}
          channelName={channelName}
          description={currentChannel.description}
          isClass={currentChannel.isClass}
          isClosed={currentChannel.isClosed}
          isPublic={currentChannel.isPublic}
          members={currentChannel.members}
          onHide={() => setSettingsModalShown(false)}
          onDone={handleEditSettings}
          channelId={selectedChannelId}
          onPurchaseSubject={(topic) =>
            socket.emit('purchased_chat_subject', {
              channelId: selectedChannelId,
              topic
            })
          }
          onSelectNewOwner={handleSelectNewOwner}
          onScrollToBottom={handleScrollToBottom}
          selectingNewOwner={selectingNewOwner}
          theme={currentChannel.theme}
          thumbPath={currentChannel.thumbPath}
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

  async function handleScrollToBottom() {
    if (MessagesRef.current) {
      if (deviceIsMobile || deviceIsTablet) {
        (MessagesRef.current || {}).scrollTop = 0;
        (MessagesRef.current || {}).scrollTop = 1000;
        if (deviceIsTablet) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const lastMessage = MessagesRef.current.lastElementChild;
          if (lastMessage) {
            lastMessage.scrollIntoView({ block: 'end' });
          }
        }
      }
      (MessagesRef.current || {}).scrollTop = 0;
    }
  }
}

export default memo(MessagesContainer);
