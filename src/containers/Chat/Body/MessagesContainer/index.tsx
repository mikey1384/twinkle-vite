import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { countdownStore } from '~/contexts/GameCountdown';
import { v1 as uuidv1 } from 'uuid';
import {
  GENERAL_CHAT_PATH_ID,
  AI_CARD_CHAT_TYPE,
  VOCAB_CHAT_TYPE,
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  GENERAL_CHAT_ID
} from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { isMobile, parseChannelPath } from '~/helpers';
import { useNavigate } from 'react-router-dom';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { User } from '~/types';
import {
  getLatestGameBoundaryMessageId,
  getPendingTerminalToken
} from '~/containers/Chat/helpers/gameMessageIds';
import CallScreens from './CallScreens';
import { CALL_SCREEN_HEIGHT } from './constants';
import Content from './Content';
import Modals from './Modals';
import type {
  DeleteModalState,
  MessagesContainerProps,
  SubjectMsgsModalState
} from './types';
import useMessageInputBridge from './useMessageInputBridge';
import useMessageSearch from './useMessageSearch';
import LocalContext from '../../Context';
const deviceIsMobile = isMobile(navigator);

export default function MessagesContainer({
  channelName,
  partner,
  currentChannel,
  currentPathId,
  displayedThemeColor,
  isAICardModalShown,
  MessagesRef,
  onSetAICardModalCardId,
  subchannelId,
  subchannelPath,
  topicSelectorModalShown,
  onScrollToBottom,
  onSetTopicSelectorModalShown
}: MessagesContainerProps) {
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
  const searchChatMessages = useAppContext(
    (v) => v.requestHelpers.searchChatMessages
  );
  const loadTopicMessages = useAppContext(
    (v) => v.requestHelpers.loadTopicMessages
  );
  const saveChatMessage = useAppContext(
    (v) => v.requestHelpers.saveChatMessage
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
      onRegisterSaveScrollPositionForAll,
      onSeachChatMessages,
      onSetChessTarget,
      onSetChessGameState,
      onSetChessModalShown,
      onSetOmokModalShown,
      onSetCreatingNewDMChannel,
      onSetFavoriteChannel,
      onSetReplyTarget,
      onSetWordleModalShown,
      onSubmitMessage,
      onUpdateChannelPathIdHash,
      onUpdateLastChessMessageId,
      onUpdateLastChessMoveViewerId,
      onUpdateLastOmokMessageId,
      onUpdateLastOmokMoveViewerId,
      onUpdateRecentChessMessage,
      onUpdateRecentOmokMessage
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
      omokModalShown,
      creatingNewDMChannel,
      reconnecting,
      selectedChannelId,
      aiCallChannelId,
      socketConnected,
      wordleModalShown
    }
  } = useContext(LocalContext);
  const banned = useKeyContext((v) => v.myState.banned);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const userId = useKeyContext((v) => v.myState.userId);
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const username = useKeyContext((v) => v.myState.username);

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
  const textForThisChannel = useInputContext(
    (v) => v.state['chat' + selectedChannelId]?.text || ''
  );
  const [boardCountdownObj, setBoardCountdownObj] = useState<
    Record<number, Partial<Record<'chess' | 'omok', number | null>>>
  >({});
  const [textAreaHeight, setTextAreaHeight] = useState(0);
  const [aiUsagePolicyHeight, setAiUsagePolicyHeight] = useState(0);
  const [inviteUsersModalShown, setInviteUsersModalShown] = useState(false);
  const [selectVideoModalShown, setSelectVideoModalShown] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    shown: false,
    fileName: '',
    filePath: '',
    messageId: null
  });
  const [subjectMsgsModal, setSubjectMsgsModal] =
    useState<SubjectMsgsModalState>({
      shown: false,
      subjectId: 0,
      content: ''
    });
  const [groupObjs, setGroupObjs] = useState<any>({});
  const [transactionModalShown, setTransactionModalShown] = useState(false);
  const [buyTopicModalShown, setBuyTopicModalShown] = useState(false);
  const [settingsModalShown, setSettingsModalShown] = useState(false);
  const [leaveConfirmModalShown, setLeaveConfirmModalShown] = useState(false);
  const [selectNewOwnerModalShown, setSelectNewOwnerModalShown] =
    useState(false);
  const [hideModalShown, setHideModalShown] = useState(false);
  const [isLoadingTopicMessages, setIsLoadingTopicMessages] = useState(false);
  const onSetGroupMemberState = useHomeContext(
    (v) => v.actions.onSetGroupMemberState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [isLeaving, setIsLeaving] = useState(false);
  const [selectingNewOwner, setSelectingNewOwner] = useState(false);
  const leavingRef = useRef(false);
  const selectingNewOwnerRef = useRef(false);
  const MessageToScrollToFromAll = useRef<number | null>(null);
  const MessageToScrollToFromTopic = useRef<number | null>(null);
  const ChatInputRef: React.RefObject<any> = useRef(null);
  const favoritingRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);
  const visibleMessageIdRef = useRef<number | null>(null);
  // Used only to ignore stale countdown ticks after a newer game event (move or
  // terminal result) has already arrived for the same channel/game type.
  const latestBoardMessageIdRef = useRef<
    Record<number, Partial<Record<'chess' | 'omok', number>>>
  >({});
  const pendingTerminalTokenRef = useRef<
    Record<number, Partial<Record<'chess' | 'omok', string>>>
  >({});

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

  const replyTargetRef = useRef<any>(null);
  useEffect(() => {
    replyTargetRef.current = replyTarget;
  }, [replyTarget]);

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

  const selectedChannelIsOnAICall = useMemo(
    () => selectedChannelId === aiCallChannelId,
    [aiCallChannelId, selectedChannelId]
  );

  const {
    handleAiUsagePolicyUpdate,
    handleOptimisticAiMessageSaveError,
    handleRegisterAiMessageSaveError,
    handleRegisterAiUsagePolicyUpdate,
    handleRegisterMessageInputSetText,
    messageInputSetTextRef
  } = useMessageInputBridge({
    selectedChannelId,
    subchannelId
  });

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
    aiUsagePolicyHeight ? ` - ${aiUsagePolicyHeight}px` : ''
  }${
    socketConnected && appliedIsRespondingToSubject
      ? ' - 8rem - 2px'
      : replyTarget
        ? ' - 12rem - 2px'
        : chessTarget
          ? ' - 24rem - 2px'
          : ''
  }
    ${
      selectedChannelIsOnCall || selectedChannelIsOnAICall
        ? ` - ${CALL_SCREEN_HEIGHT}`
        : ''
    })`;

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
  const { handleSearch, searchText, searching } = useMessageSearch({
    appliedTopicId,
    onSeachChatMessages,
    searchChatMessages,
    selectedChannelId,
    selectedTab
  });

  const currentlySelectedTopic = useMemo(() => {
    if (topicObj[appliedTopicId]) {
      return topicObj[appliedTopicId];
    }
    return null;
  }, [appliedTopicId, topicObj]);

  const isOnlyOwnerPostingTopic = useMemo(() => {
    if (currentlySelectedTopic && selectedTab === 'topic') {
      return !!currentlySelectedTopic?.settings?.isOwnerPostingOnly;
    }
    return false;
  }, [currentlySelectedTopic, selectedTab]);

  const isAIChannel = useMemo(() => {
    return isZeroChannel || isCielChannel;
  }, [isZeroChannel, isCielChannel]);

  const pageLoading = useMemo(() => {
    if (
      isAIChannel &&
      !selectedChannelIdAndPathIdNotSynced &&
      !creatingNewDMChannel &&
      currentPathId !== VOCAB_CHAT_TYPE &&
      currentPathId !== AI_CARD_CHAT_TYPE
    ) {
      if (selectedTab === 'all') {
        return !currentChannel?.loaded;
      }
      return !currentlySelectedTopic?.loaded;
    }
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
    isAIChannel,
    creatingNewDMChannel,
    reconnecting,
    selectedChannelIdAndPathIdNotSynced,
    currentPathId,
    subchannelPath,
    selectedTab,
    currentlySelectedTopic?.loaded,
    currentChannel?.loaded,
    subchannel?.loaded
  ]);

  useEffect(() => {
    const topicMessageIds =
      currentChannel.topicObj?.[appliedTopicId]?.messageIds || [];

    const isTargetMessageIncluded = topicMessageIds.includes(
      MessageToScrollToFromTopic.current
    );
    const isTopicTab = selectedTab === 'topic';

    const topicNeedsInitialLoad = !currentlySelectedTopic?.loaded;
    const targetMessageNotLoaded =
      MessageToScrollToFromTopic.current && !isTargetMessageIncluded;
    const loadMoreShownAtBottomButNoTargetMessage =
      currentlySelectedTopic?.loadMoreShownAtBottom &&
      !MessageToScrollToFromTopic.current;

    const shouldLoadTopic =
      isTopicTab &&
      appliedTopicId &&
      (topicNeedsInitialLoad ||
        targetMessageNotLoaded ||
        loadMoreShownAtBottomButNoTargetMessage);

    if (shouldLoadTopic) {
      loadTopicMessagesAndUpdate(MessageToScrollToFromTopic.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    appliedTopicId,
    selectedChannelId,
    selectedTab,
    currentChannel.selectedTopicId,
    currentChannel.featuredTopicId
  ]);

  useEffect(() => {
    if (!deviceIsMobile) {
      ChatInputRef.current?.focus();
    }
    const hasMessageToScrollTo =
      (selectedTab !== 'topic' && MessageToScrollToFromAll.current) ||
      (selectedTab === 'topic' && MessageToScrollToFromTopic.current);

    if (hasMessageToScrollTo) {
      shouldScrollToBottomRef.current = false;
    } else {
      shouldScrollToBottomRef.current = true;
    }
  }, [selectedTab, selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId === channelOnCall.id) {
      onScrollToBottom();
    }
  }, [channelOnCall, onScrollToBottom, selectedChannelId]);

  useEffect(() => {
    if (!pageLoading && shouldScrollToBottomRef.current) {
      onScrollToBottom();
      shouldScrollToBottomRef.current = false;
    }
  }, [pageLoading, onScrollToBottom, selectedTab]);

  useEffect(() => {
    onSetChessModalShown(false);
    if (selectedChannelId !== GENERAL_CHAT_ID) {
      onSetWordleModalShown(false);
    }
    setTransactionModalShown(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (wordleModalShown) {
      ChatInputRef.current.blur();
    }
  }, [wordleModalShown]);

  useEffect(() => {
    const channelId = Number(currentChannel?.id || selectedChannelId || 0);
    if (!channelId) return;
    const latestChessMessageId = Number(
      getLatestGameBoundaryMessageId(currentChannel, 'chess') || 0
    );
    const latestOmokMessageId = Number(
      getLatestGameBoundaryMessageId(currentChannel, 'omok') || 0
    );
    setPendingTerminalToken({
      channelId,
      gameType: 'chess',
      token: getPendingTerminalToken(currentChannel, 'chess')
    });
    setPendingTerminalToken({
      channelId,
      gameType: 'omok',
      token: getPendingTerminalToken(currentChannel, 'omok')
    });
    if (latestChessMessageId > 0) {
      setLatestBoardMessageId({
        channelId,
        gameType: 'chess',
        messageId: latestChessMessageId
      });
    }
    if (latestOmokMessageId > 0) {
      setLatestBoardMessageId({
        channelId,
        gameType: 'omok',
        messageId: latestOmokMessageId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentChannel?.id,
    currentChannel?.lastChessMessageId,
    currentChannel?.lastChessTerminalMessageId,
    currentChannel?.lastChessPendingTerminalToken,
    currentChannel?.lastOmokMessageId,
    currentChannel?.lastOmokTerminalMessageId,
    currentChannel?.lastOmokPendingTerminalToken,
    currentChannel?.latestChessBoardMessageId,
    currentChannel?.latestOmokBoardMessageId,
    selectedChannelId
  ]);

  useEffect(() => {
    if (isReloadRequired) {
      reload();
    }
    async function reload() {
      const data = await loadChatChannel({
        channelId: selectedChannelId
      });
      onEnterChannelWithId(data);
      for (const member of data?.channel?.members || []) {
        onSetUserState({
          userId: member.id,
          newState: member
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReloadRequired, selectedChannelId]);

  useEffect(() => {
    socket.on('chess_timer_cleared', handleBoardTimerCleared);
    socket.on('chess_countdown_number_received', handleCountdownUpdate);
    socket.on('new_message_received', handleReceiveMessage);

    function handleBoardTimerCleared({
      channelId,
      gameType = 'chess'
    }: {
      channelId: number;
      gameType?: 'chess' | 'omok';
    }) {
      // Clear the countdown store so CountdownDisplay stops showing the value
      countdownStore.set(channelId, gameType, null);
      setBoardCountdownObj((prev) => ({
        ...prev,
        [channelId]: {
          ...(prev[channelId] || {}),
          [gameType]: null
        }
      }));
    }

    function handleCountdownUpdate({
      channelId,
      number,
      gameType = 'chess',
      startMessageId
    }: {
      channelId: number;
      number: number;
      gameType?: 'chess' | 'omok';
      startMessageId?: number;
    }) {
      if (hasPendingTerminalBoundary(channelId, gameType)) {
        // A live terminal row arrived before MySQL assigned a numeric id. Any
        // later countdown packet belongs to the finished game and must be ignored.
        clearBoardCountdown(channelId, gameType);
        return;
      }
      const normalizedStartMessageId = Number(startMessageId || 0);
      const latestKnownMessageId = getLatestBoardMessageId(channelId, gameType);
      if (
        normalizedStartMessageId > 0 &&
        latestKnownMessageId > normalizedStartMessageId
      ) {
        // Ignore delayed stale timer ticks after a newer move has already been saved.
        clearBoardCountdown(channelId, gameType);
        return;
      }
      if (channelId === selectedChannelId) {
        if (gameType === 'chess' && number === 0) {
          onSetChessModalShown(false);
        }
        if (gameType === 'omok' && number === 0) {
          onSetOmokModalShown(false);
        }
      }
      // Update store for countdown display (triggers only display re-render)
      countdownStore.set(channelId, gameType, number);
      // Only update React state when countdown activity changes (starts/ends)
      // This prevents game board re-renders on every tick
      setBoardCountdownObj((prev) => {
        const wasActive =
          typeof prev[channelId]?.[gameType] === 'number' &&
          (prev[channelId]?.[gameType] ?? 0) > 0;
        const isActive = typeof number === 'number' && number > 0;
        if (wasActive !== isActive) {
          return {
            ...prev,
            [channelId]: {
              ...(prev[channelId] || {}),
              // When countdown expires (0), keep it as 0 to block modal reopening
              // Only timer-cleared events set this to null
              [gameType]: isActive ? number : 0
            }
          };
        }
        return prev;
      });
    }

    function handleReceiveMessage({ message }: { message: any }) {
      if (message.isChessMsg) {
        // Determine game type, respecting explicit server tag first
        const content: string = message?.content || '';
        const normalizedChannelId = Number(message?.channelId || 0);
        const normalizedMessageId = Number(message?.id || 0);
        let gameType: 'chess' | 'omok';
        if (message.gameType === 'omok') {
          gameType = 'omok';
        } else if (message.gameType === 'chess') {
          gameType = 'chess';
        } else if (message.omokState) {
          gameType = 'omok';
        } else if (/omok/i.test(content)) {
          gameType = 'omok';
        } else {
          gameType = 'chess';
        }
        const isTerminalMessage =
          typeof message?.gameWinnerId === 'number' ||
          !!message?.isDraw ||
          !!message?.isAbort ||
          !!message?.isResign;
        if (normalizedChannelId > 0 && normalizedMessageId > 0) {
          setLatestBoardMessageId({
            channelId: normalizedChannelId,
            gameType,
            messageId: normalizedMessageId
          });
          if (isTerminalMessage) {
            setPendingTerminalToken({
              channelId: normalizedChannelId,
              gameType,
              token: null
            });
          }
        } else if (normalizedChannelId > 0 && isTerminalMessage) {
          setPendingTerminalToken({
            channelId: normalizedChannelId,
            gameType,
            token: getPendingTerminalBoundaryToken({
              channelId: normalizedChannelId,
              gameType,
              message
            })
          });
        }
        // Clear the countdown store so CountdownDisplay stops showing the value
        countdownStore.set(message.channelId, gameType, null);
        setBoardCountdownObj((prev) => ({
          ...prev,
          [message.channelId]: {
            ...(prev[message.channelId] || {}),
            [gameType]: null
          }
        }));
      }
    }

    return function cleanUp() {
      socket.off('chess_timer_cleared', handleBoardTimerCleared);
      socket.off('chess_countdown_number_received', handleCountdownUpdate);
      socket.off('new_message_received', handleReceiveMessage);
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
    const currentCountdown = boardCountdownObj[channelId]?.chess;
    if (currentCountdown !== 0) {
      onSetReplyTarget({ channelId, target: null });
      onSetChessModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banned?.chess, boardCountdownObj, currentChannel?.id]);

  const handleOmokModalShown = useCallback(() => {
    if (banned?.chess) {
      return;
    }
    const channelId = currentChannel?.id;
    const currentCountdown = boardCountdownObj[channelId]?.omok;
    if (currentCountdown !== 0) {
      onSetReplyTarget({ channelId, target: null });
      onSetOmokModalShown(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banned?.chess, boardCountdownObj, currentChannel?.id]);

  const handleWordleModalShown = useCallback(() => {
    const channelId = currentChannel?.id;
    onSetReplyTarget({ channelId, target: null });
    onSetWordleModalShown(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannel?.id]);

  const handleSaveScrollPositionForAll = useCallback(() => {
    // If user is at the bottom, don't save a scroll position
    // This allows the default "scroll to bottom" behavior to work when returning
    const scrollTop = MessagesRef.current?.scrollTop ?? 0;
    const isAtBottom = scrollTop >= -1;
    if (isAtBottom) {
      MessageToScrollToFromAll.current = null;
      return;
    }
    if (visibleMessageIdRef.current) {
      MessageToScrollToFromAll.current = visibleMessageIdRef.current;
    }
  }, [MessagesRef]);

  const handleSetVisibleMessageId = useCallback((messageId: number) => {
    visibleMessageIdRef.current = messageId;
  }, []);

  useEffect(() => {
    // Register the save scroll position function with the parent context
    onRegisterSaveScrollPositionForAll?.(handleSaveScrollPositionForAll);
    return () => {
      onRegisterSaveScrollPositionForAll?.(null);
    };
  }, [onRegisterSaveScrollPositionForAll, handleSaveScrollPositionForAll]);

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
      onScrollToBottom();
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
      previousState
    }: {
      state: any;
      isCheckmate: boolean;
      isStalemate: boolean;
      previousState: any;
    }) => {
      const gameWinnerId = isCheckmate ? userId : isStalemate ? 0 : null;
      const chessState = {
        ...state,
        previousState: previousState
          ? {
              ...previousState,
              previousState: null
            }
          : null
      };
      const content = 'Made a chess move';
      try {
        if (selectedChannelId) {
          onSetReplyTarget({ channelId: selectedChannelId, target: null });
          // Save via HTTP API - this also triggers socket broadcast on the server
          const { messageId, timeStamp } = await saveChatMessage({
            message: {
              userId,
              content,
              channelId: selectedChannelId,
              chessState,
              isChessMsg: true,
              gameWinnerId
            }
          });
          setLatestBoardMessageId({
            channelId: selectedChannelId,
            gameType: 'chess',
            messageId: Number(messageId)
          });
          clearBoardCountdown(selectedChannelId, 'chess');
          const messagePayload = {
            id: messageId,
            userId,
            chessState,
            isChessMsg: 1,
            gameWinnerId,
            profilePicUrl,
            username,
            content,
            channelId: selectedChannelId,
            timeStamp
          };
          onSubmitMessage({
            messageId,
            message: messagePayload
          });
          onUpdateLastChessMessageId({
            channelId: selectedChannelId,
            messageId: Number(messageId),
            ...(typeof gameWinnerId === 'number'
              ? { terminalMessageId: Number(messageId) }
              : {})
          });
          onUpdateLastChessMoveViewerId({
            channelId: selectedChannelId,
            viewerId: userId
          });
          onUpdateRecentChessMessage({
            channelId: selectedChannelId,
            message: messagePayload
          });
          onScrollToBottom();
          onSetChessModalShown(false);
        } else {
          if (selectedChannelId === 0 && !partner?.id) {
            reportError({
              componentPath: 'MessagesContainer/index',
              message: `handleConfirmChessMove: User is trying to send the first chess message to someone but recipient ID is missing`
            });
            return window.location.reload();
          }
          const { alreadyExists, channel, message, pathId, aiUsagePolicy } =
            await startNewDMChannel({
              userId,
              chessState,
              isChessMsg: 1,
              gameWinnerId,
              content,
              recipientId: partner?.id
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          if (aiUsagePolicy) {
            handleAiUsagePolicyUpdate(aiUsagePolicy);
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
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentChannel?.members,
      currentChannel?.pathId,
      currentChannel?.twoPeople,
      channelName,
      partner?.id,
      profilePicUrl,
      selectedChannelId,
      userId,
      username
    ]
  );

  const handleConfirmOmokMove = useCallback(
    async ({
      state,
      isWinning,
      moveNumber: _moveNumber,
      previousState
    }: {
      state: any;
      isWinning: boolean;
      moveNumber?: number;
      previousState?: any;
    }) => {
      const omokState = {
        ...state,
        previousState: previousState
          ? {
              ...previousState,
              previousState: null
            }
          : null
      };
      const gameWinnerId = isWinning ? userId : null;
      const content = 'Made an omok move';
      try {
        if (selectedChannelId) {
          onSetReplyTarget({ channelId: selectedChannelId, target: null });
          // Save via HTTP API - this also triggers socket broadcast on the server
          const { messageId, timeStamp } = await saveChatMessage({
            message: {
              userId,
              content,
              channelId: selectedChannelId,
              omokState,
              isChessMsg: true,
              gameWinnerId
            }
          });
          setLatestBoardMessageId({
            channelId: selectedChannelId,
            gameType: 'omok',
            messageId: Number(messageId)
          });
          clearBoardCountdown(selectedChannelId, 'omok');
          const messagePayload = {
            id: messageId,
            userId,
            omokState,
            isChessMsg: 1,
            gameWinnerId,
            profilePicUrl,
            username,
            content,
            channelId: selectedChannelId,
            timeStamp
          };
          onSubmitMessage({
            messageId,
            message: messagePayload
          });
          onUpdateLastOmokMessageId({
            channelId: selectedChannelId,
            messageId: Number(messageId),
            ...(typeof gameWinnerId === 'number'
              ? { terminalMessageId: Number(messageId) }
              : {})
          });
          onUpdateLastOmokMoveViewerId({
            channelId: selectedChannelId,
            viewerId: userId
          });
          onUpdateRecentOmokMessage({
            channelId: selectedChannelId,
            message: messagePayload
          });
          onSetOmokModalShown(false);
          onScrollToBottom();
        } else {
          if (selectedChannelId === 0 && !partner?.id) {
            reportError({
              componentPath: 'MessagesContainer/index',
              message:
                'handleConfirmOmokMove: User is trying to send the first omok message but recipient ID is missing'
            });
            return window.location.reload();
          }
          const { alreadyExists, channel, message, pathId, aiUsagePolicy } =
            await startNewDMChannel({
              userId,
              omokState,
              isChessMsg: 1,
              gameWinnerId,
              content,
              recipientId: partner?.id
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          if (aiUsagePolicy) {
            handleAiUsagePolicyUpdate(aiUsagePolicy);
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
          onSetOmokModalShown(false);
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentChannel?.members,
      currentChannel?.pathId,
      currentChannel?.twoPeople,
      channelName,
      partner?.id,
      profilePicUrl,
      selectedChannelId,
      userId,
      username
    ]
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
      editedOnlyOwnerCanPost,
      editedTheme,
      newThumbPath
    }: {
      editedChannelName: string;
      editedDescription: string;
      editedIsClosed: boolean;
      editedIsPublic: boolean;
      editedCanChangeSubject: boolean;
      editedOnlyOwnerCanPost: boolean;
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
        isOwnerPostingOnly: editedOnlyOwnerCanPost,
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
        isOwnerPostingOnly: editedOnlyOwnerCanPost,
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
          isOwnerPostingOnly: editedOnlyOwnerCanPost,
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
              users.length > 1
                ? `${users.length} users`
                : users[0]?.username || 'User'
            }`,
            isNotification: true
          }
        });
        onScrollToBottom();
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
        onSetGroupMemberState({
          groupId: selectedChannelId,
          action: 'remove',
          memberId: userId
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
    const { messageId, cancelMessage, timeStamp } =
      await cancelChessRewind(selectedChannelId);
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
    const { messageId, declineMessage, timeStamp } =
      await declineChessRewind(selectedChannelId);
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
          const { alreadyExists, channel, message, pathId, aiUsagePolicy } =
            await startNewDMChannel({
              content,
              userId,
              recipientId: partner?.id
            });
          if (alreadyExists) {
            return window.location.reload();
          }
          if (aiUsagePolicy) {
            handleAiUsagePolicyUpdate(aiUsagePolicy);
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
          return Promise.resolve();
        } catch (error: any) {
          if (error?.aiUsagePolicy) {
            handleAiUsagePolicyUpdate(error.aiUsagePolicy);
          }
          return Promise.reject(error);
        } finally {
          onSetCreatingNewDMChannel(false);
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
      onScrollToBottom();
      return Promise.resolve();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      chessTarget,
      creatingNewDMChannel,
      appliedIsRespondingToSubject,
      profilePicUrl,
      partner?.id,
      selectedTab,
      selectedChannelId,
      subjectId,
      userId,
      username
    ]
  );

  const handleSelectNewOwner = useCallback(
    async ({ newOwner, andLeave }: { newOwner: User; andLeave?: boolean }) => {
      if (selectingNewOwnerRef.current) return;
      setSelectingNewOwner(true);
      selectingNewOwnerRef.current = true;
      try {
        const { notificationMsg, messageId } = await changeChannelOwner({
          channelId: selectedChannelId,
          newOwner
        });

        // Update local state using the same pattern as chess/omok
        const timeStamp = Math.floor(Date.now() / 1000);
        const messagePayload = {
          id: messageId,
          channelId: selectedChannelId,
          userId,
          username,
          profilePicUrl,
          content: notificationMsg,
          isNotification: true,
          notificationType: 'owner_change',
          newOwner,
          timeStamp
        };

        onSubmitMessage({
          messageId,
          message: messagePayload
        });

        // Broadcast the message - the reducer will update creatorId from newOwner
        socket.emit('new_chat_message', {
          message: messagePayload,
          channel: {
            id: selectedChannelId,
            ...(currentChannel.twoPeople
              ? { twoPeople: true, members: currentChannel.members }
              : { channelName }),
            pathId: currentChannel.pathId
          }
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
    [
      currentChannel?.members,
      currentChannel?.pathId,
      currentChannel?.twoPeople,
      channelName,
      handleLeaveChannel,
      profilePicUrl,
      selectedChannelId,
      userId,
      username
    ]
  );

  const isSearchActive = useMemo(() => {
    if (currentChannel.selectedTab === 'all' || !currentChannel.selectedTab) {
      return currentChannel.isSearchActive;
    }
    if (currentChannel.selectedTab === 'topic' && currentChannel.topicObj) {
      return currentChannel.topicObj[currentChannel.selectedTopicId]
        ?.isSearchActive;
    }
    return false;
  }, [
    currentChannel.isSearchActive,
    currentChannel.selectedTab,
    currentChannel.selectedTopicId,
    currentChannel.topicObj
  ]);

  const loadMoreShownAtBottom = useMemo(() => {
    if (isLoadingTopicMessages) return false;
    if (selectedTab === 'topic') {
      return (
        currentChannel.topicObj?.[appliedTopicId]?.loadMoreShownAtBottom &&
        !isSearchActive
      );
    }
    return false;
  }, [
    appliedTopicId,
    currentChannel.topicObj,
    isLoadingTopicMessages,
    selectedTab,
    isSearchActive
  ]);

  const channelHeaderProps = {
    currentChannel,
    displayedThemeColor,
    isAIChannel,
    isSearchActive,
    onInputFocus: () => ChatInputRef.current?.focus(),
    onSaveScrollPositionForAll: handleSaveScrollPositionForAll,
    onSetInviteUsersModalShown: setInviteUsersModalShown,
    onSetLeaveConfirmModalShown: setLeaveConfirmModalShown,
    onSetBuyTopicModalShown: setBuyTopicModalShown,
    onSetSettingsModalShown: setSettingsModalShown,
    onSetTopicSelectorModalShown,
    onSearch: handleSearch,
    searchText,
    selectedChannelId,
    topicSelectorModalShown,
    subchannel,
    onFavoriteClick: handleFavoriteClick,
    onSetHideModalShown: setHideModalShown
  };

  const displayedMessagesProps = {
    pageLoading,
    loadMoreShownAtBottom,
    isLoadingTopicMessages,
    isReconnecting: reconnecting,
    isConnecting: !selectedChannelIdAndPathIdNotSynced,
    isLoadingChannel: !currentChannel?.loaded,
    chessTarget,
    boardCountdownObj,
    currentChannel,
    displayedThemeColor,
    groupObjs,
    onSetGroupObjs: setGroupObjs,
    isAICardModalShown,
    isRestrictedChannel:
      !!isRestrictedChannel ||
      (isOnlyOwnerPostingTopic && currentChannel.creatorId !== userId) ||
      (currentChannel.isOwnerPostingOnly &&
        selectedTab !== 'topic' &&
        currentChannel.creatorId !== userId),
    isSearching: searching,
    isSearchActive,
    ChatInputRef,
    MessagesRef,
    MessageToScrollToFromAll,
    MessageToScrollToFromTopic,
    onAcceptRewind: handleAcceptRewind,
    onCancelRewindRequest: handleCancelRewindRequest,
    onChessModalShown: handleChessModalShown,
    onChessSpoilerClick: handleChessSpoilerClick,
    onOmokModalShown: handleOmokModalShown,
    onOmokSpoilerClick: handleOmokSpoilerClick,
    onDeclineRewind: handleDeclineRewind,
    onMessageSubmit: handleMessageSubmit,
    onAiUsagePolicyUpdate: handleAiUsagePolicyUpdate,
    onOptimisticAiMessageSaveError: handleOptimisticAiMessageSaveError,
    onReplyTargetSelected: (target: any) => {
      replyTargetRef.current = target;
    },
    onSetAICardModalCardId,
    onSetDeleteModal: setDeleteModal,
    onSetSubjectMsgsModalShown: setSubjectMsgsModal,
    onSetTransactionModalShown: setTransactionModalShown,
    onScrollToBottom,
    onSetVisibleMessageId: handleSetVisibleMessageId,
    partner,
    searchText,
    selectedTab,
    subchannel
  };

  const messageInputProps = {
    currentTopic: currentlySelectedTopic,
    partner,
    currentTransactionId,
    selectedChannelId,
    isZeroChannel,
    isCielChannel,
    isRestrictedChannel: !!isRestrictedChannel,
    isBanned: !!banned?.chat,
    isOwner: currentChannel.creatorId === userId,
    isOnlyOwnerPostingTopic,
    isOwnerPostingOnly: currentChannel.isOwnerPostingOnly,
    innerRef: ChatInputRef,
    currentlyStreamingAIMsgId: currentChannel.currentlyStreamingAIMsgId,
    loading: pageLoading,
    socketConnected,
    isRespondingToSubject: appliedIsRespondingToSubject,
    isTwoPeopleChannel: currentChannel.twoPeople,
    onChessButtonClick: handleChessModalShown,
    onOmokButtonClick: handleOmokModalShown,
    onScrollToBottom,
    onWordleButtonClick: handleWordleModalShown,
    onMessageSubmit: async ({
      message,
      subchannelId,
      selectedTab,
      topicId
    }: {
      message: string;
      subchannelId?: number;
      selectedTab?: string;
      topicId?: number;
    }) => {
      if (loadMoreShownAtBottom) {
        await loadTopicMessagesAndUpdate();
      }
      await handleMessageSubmit({
        content: message,
        subchannelId,
        selectedTab: selectedTab || 'all',
        topicId,
        target: replyTargetRef.current || replyTarget
      });
    },
    onHeightChange: (height: number) => {
      if (height !== textAreaHeight) {
        setTextAreaHeight(height > 46 ? height : 0);
      }
    },
    onAiUsagePolicyHeightChange: (height: number) => {
      setAiUsagePolicyHeight((currentHeight) =>
        currentHeight === height ? currentHeight : height
      );
    },
    onSelectVideoButtonClick: () => setSelectVideoModalShown(true),
    onSetTextAreaHeight: setTextAreaHeight,
    onSetTransactionModalShown: setTransactionModalShown,
    onRegisterSetText: handleRegisterMessageInputSetText,
    onRegisterAiUsagePolicyUpdate: handleRegisterAiUsagePolicyUpdate,
    onRegisterAiMessageSaveError: handleRegisterAiMessageSaveError,
    recipientId: partner?.id,
    recipientUsername: partner?.username,
    chessTarget,
    replyTarget,
    selectedTab,
    subchannelId: subchannel?.id,
    topicId: appliedTopicId,
    legacyTopicObj: appliedLegacyTopicObj
  };

  return (
    <ErrorBoundary componentPath="MessagesContainer/index">
      <CallScreens
        partner={partner}
        selectedChannelIsOnAICall={selectedChannelIsOnAICall}
        selectedChannelIsOnCall={selectedChannelIsOnCall}
      />
      <Content
        containerHeight={containerHeight}
        subchannel={subchannel}
        channelHeaderProps={channelHeaderProps}
        displayedMessagesProps={displayedMessagesProps}
        messageInputKey={selectedChannelId}
        messageInputProps={messageInputProps}
      />
      <Modals
        boardCountdownObj={boardCountdownObj}
        buyTopicModalShown={buyTopicModalShown}
        channelName={channelName}
        chessModalShown={chessModalShown}
        currentChannel={currentChannel}
        currentTransactionId={currentTransactionId}
        deleteModal={deleteModal}
        displayedThemeColor={displayedThemeColor}
        editCanChangeTopic={editCanChangeTopic}
        groupObjs={groupObjs}
        hideModalShown={hideModalShown}
        inputText={textForThisChannel}
        inviteUsersModalShown={inviteUsersModalShown}
        isAICardModalShown={isAICardModalShown}
        isLeaving={isLeaving}
        leaveConfirmModalShown={leaveConfirmModalShown}
        omokModalShown={omokModalShown}
        partner={partner}
        selectNewOwnerModalShown={!!selectNewOwnerModalShown}
        selectVideoModalShown={selectVideoModalShown}
        selectingNewOwner={selectingNewOwner}
        selectedChannelId={selectedChannelId}
        settingsModalShown={settingsModalShown}
        socketConnected={socketConnected}
        subjectMsgsModal={subjectMsgsModal}
        transactionModalShown={transactionModalShown}
        userId={userId}
        wordleAttemptState={wordleAttemptState}
        wordleGuesses={wordleGuesses}
        wordleModalShown={wordleModalShown}
        wordleSolution={wordleSolution}
        wordleStats={wordleStats}
        wordleWordLevel={wordleWordLevel}
        onAcceptRewind={handleAcceptRewind}
        onBuyTopicDone={() => setBuyTopicModalShown(false)}
        onCancelRewindRequest={handleCancelRewindRequest}
        onChessSpoilerClick={handleChessSpoilerClick}
        onConfirmChessMove={handleConfirmChessMove}
        onConfirmDelete={handleDelete}
        onConfirmHideChat={handleHideChat}
        onConfirmLeave={handleLeaveConfirm}
        onConfirmOmokMove={handleConfirmOmokMove}
        onDeclineRewind={handleDeclineRewind}
        onHideChessModal={() => onSetChessModalShown(false)}
        onHideDeleteModal={() =>
          setDeleteModal({
            shown: false,
            fileName: '',
            filePath: '',
            messageId: null
          })
        }
        onHideHideModal={() => setHideModalShown(false)}
        onHideInviteUsersModal={() => setInviteUsersModalShown(false)}
        onHideLeaveConfirmModal={() => setLeaveConfirmModalShown(false)}
        onHideOmokModal={() => onSetOmokModalShown(false)}
        onHideSelectNewOwnerModal={() => setSelectNewOwnerModalShown(false)}
        onHideSelectVideoModal={() => setSelectVideoModalShown(false)}
        onHideSettingsModal={() => setSettingsModalShown(false)}
        onHideSubjectMessagesModal={() =>
          setSubjectMsgsModal({
            shown: false,
            subjectId: 0,
            content: ''
          })
        }
        onHideTransactionModal={() => setTransactionModalShown(false)}
        onHideWordleModal={() => onSetWordleModalShown(false)}
        onInviteUsersDone={handleInviteUsersDone}
        onMessageTextSelected={(text) => {
          messageInputSetTextRef.current?.(text);
        }}
        onOmokSpoilerClick={handleOmokSpoilerClick}
        onPurchaseSubject={(topic) =>
          socket.emit('purchased_chat_subject', {
            channelId: selectedChannelId,
            topic
          })
        }
        onScrollToBottom={onScrollToBottom}
        onSelectNewOwner={handleSelectNewOwner}
        onSetAICardModalCardId={onSetAICardModalCardId}
        onSetGroupObjs={setGroupObjs}
        onSetTopicVideoComment={(text) => {
          onEnterComment({
            contentType: 'chat',
            contentId: selectedChannelId,
            targetKey: subchannelId,
            text
          });
        }}
        onSettingsDone={handleEditSettings}
      />
    </ErrorBoundary>
  );

  async function loadTopicMessagesAndUpdate(
    messageIdToScrollTo?: number | null
  ) {
    setIsLoadingTopicMessages(true);
    try {
      const { messages, loadMoreShown, loadMoreShownAtBottom, topicObj } =
        await loadTopicMessages({
          messageIdToScrollTo,
          channelId: selectedChannelId,
          topicId: appliedTopicId
        });

      onLoadTopicMessages({
        channelId: selectedChannelId,
        messages,
        loadMoreShown,
        loadMoreShownAtBottom,
        topicObj,
        topicId: appliedTopicId
      });
    } catch (error) {
      console.error('Error loading topic messages:', error);
    } finally {
      setIsLoadingTopicMessages(false);
    }
  }

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

  function handleOmokSpoilerClick(senderId: number) {
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
      isResign: false,
      gameType: 'omok'
    });
    onSetOmokModalShown(true);
  }

  function setLatestBoardMessageId({
    channelId,
    gameType,
    messageId
  }: {
    channelId: number;
    gameType: 'chess' | 'omok';
    messageId: number;
  }) {
    const normalizedChannelId = Number(channelId || 0);
    const normalizedMessageId = Number(messageId || 0);
    if (!normalizedChannelId || normalizedMessageId <= 0) return;
    const latestForType = getLatestBoardMessageId(
      normalizedChannelId,
      gameType
    );
    if (normalizedMessageId <= latestForType) return;
    latestBoardMessageIdRef.current[normalizedChannelId] = {
      ...(latestBoardMessageIdRef.current[normalizedChannelId] || {}),
      [gameType]: normalizedMessageId
    };
    setPendingTerminalToken({
      channelId: normalizedChannelId,
      gameType,
      token: null
    });
  }

  function getLatestBoardMessageId(
    channelId: number,
    gameType: 'chess' | 'omok'
  ) {
    return Number(
      latestBoardMessageIdRef.current[Number(channelId || 0)]?.[gameType] || 0
    );
  }

  function setPendingTerminalToken({
    channelId,
    gameType,
    token
  }: {
    channelId: number;
    gameType: 'chess' | 'omok';
    token: string | null;
  }) {
    const normalizedChannelId = Number(channelId || 0);
    if (!normalizedChannelId) return;
    const currentEntry = pendingTerminalTokenRef.current[normalizedChannelId] || {};
    if (!token) {
      if (!currentEntry[gameType]) return;
      const nextEntry = { ...currentEntry };
      delete nextEntry[gameType];
      if (Object.keys(nextEntry).length === 0) {
        delete pendingTerminalTokenRef.current[normalizedChannelId];
      } else {
        pendingTerminalTokenRef.current[normalizedChannelId] = nextEntry;
      }
      return;
    }
    pendingTerminalTokenRef.current[normalizedChannelId] = {
      ...currentEntry,
      [gameType]: token
    };
  }

  function hasPendingTerminalBoundary(
    channelId: number,
    gameType: 'chess' | 'omok'
  ) {
    return Boolean(
      pendingTerminalTokenRef.current[Number(channelId || 0)]?.[gameType]
    );
  }

  function getPendingTerminalBoundaryToken({
    channelId,
    gameType,
    message
  }: {
    channelId: number;
    gameType: 'chess' | 'omok';
    message: any;
  }) {
    const explicitId =
      typeof message?.id === 'string' && message.id
        ? message.id
        : typeof message?.id === 'number' && message.id > 0
        ? String(message.id)
        : null;
    if (explicitId) return explicitId;
    const content =
      typeof message?.content === 'string' ? message.content : 'terminal';
    const timeStamp = Number(message?.timeStamp || 0);
    const winnerId =
      typeof message?.gameWinnerId === 'number' ? message.gameWinnerId : 0;
    return [
      'pending-terminal',
      channelId,
      gameType,
      timeStamp,
      winnerId,
      Number(Boolean(message?.isDraw)),
      Number(Boolean(message?.isAbort)),
      Number(Boolean(message?.isResign)),
      content
    ].join(':');
  }

  function clearBoardCountdown(channelId: number, gameType: 'chess' | 'omok') {
    const normalizedChannelId = Number(channelId || 0);
    if (!normalizedChannelId) return;
    countdownStore.set(normalizedChannelId, gameType, null);
    setBoardCountdownObj((prev) => ({
      ...prev,
      [normalizedChannelId]: {
        ...(prev[normalizedChannelId] || {}),
        [gameType]: null
      }
    }));
  }
}
