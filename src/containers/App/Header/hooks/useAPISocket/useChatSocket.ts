import React, { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID
} from '~/constants/defaultValues';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useKeyContext,
  useViewContext,
  useHomeContext
} from '~/contexts';

export default function useChatSocket({
  channelsObj,
  onUpdateMyXp,
  selectedChannelId,
  subchannelId,
  usingChatRef
}: {
  channelsObj: Record<number, any>;
  onUpdateMyXp: () => void;
  selectedChannelId: number;
  subchannelId: number;
  usingChatRef: React.RefObject<boolean>;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);

  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  // Refs for frequently changing values to avoid effect re-runs
  const channelsObjRef = useRef(channelsObj);
  const onUpdateMyXpRef = useRef(onUpdateMyXp);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const subchannelIdRef = useRef(subchannelId);
  const chatStatusRef = useRef(chatStatus);
  const pageVisibleRef = useRef(pageVisible);
  const chessShortcutRefreshIdRef = useRef(0);
  const humanTopicRefreshSeqRef = useRef<Record<number, number>>({});

  channelsObjRef.current = channelsObj;
  onUpdateMyXpRef.current = onUpdateMyXp;
  selectedChannelIdRef.current = selectedChannelId;
  subchannelIdRef.current = subchannelId;
  chatStatusRef.current = chatStatus;
  pageVisibleRef.current = pageVisible;

  const onAddReactionToMessage = useChatContext(
    (v) => v.actions.onAddReactionToMessage
  );
  const onChangeAIThinkingStatus = useChatContext(
    (v) => v.actions.onChangeAIThinkingStatus
  );
  const onUpdateAIThoughtStream = useChatContext(
    (v) => v.actions.onUpdateAIThoughtStream
  );
  const onChangeAwayStatus = useChatContext(
    (v) => v.actions.onChangeAwayStatus
  );
  const onChangeBusyStatus = useChatContext(
    (v) => v.actions.onChangeBusyStatus
  );
  const onChangeChannelSettings = useChatContext(
    (v) => v.actions.onChangeChannelSettings
  );
  const onChangeChatSubject = useChatContext(
    (v) => v.actions.onChangeChatSubject
  );
  const onChangeTopicSettings = useChatContext(
    (v) => v.actions.onChangeTopicSettings
  );
  const onChangeOnlineStatus = useChatContext(
    (v) => v.actions.onChangeOnlineStatus
  );
  const onDeleteMessage = useChatContext((v) => v.actions.onDeleteMessage);
  const onEditMessage = useChatContext((v) => v.actions.onEditMessage);
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onSetGroupMemberState = useHomeContext(
    (v) => v.actions.onSetGroupMemberState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onRemoveMemberFromChannel = useChatContext(
    (v) => v.actions.onRemoveMemberFromChannel
  );
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const onHideAttachment = useChatContext((v) => v.actions.onHideAttachment);
  const onLeaveChannel = useChatContext((v) => v.actions.onLeaveChannel);
  const onNotifyChatSubjectChange = useNotiContext(
    (v) => v.actions.onNotifyChatSubjectChange
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const onReceiveFirstMsg = useChatContext((v) => v.actions.onReceiveFirstMsg);
  const onReceiveMessage = useChatContext((v) => v.actions.onReceiveMessage);
  const onReceiveMessageOnDifferentChannel = useChatContext(
    (v) => v.actions.onReceiveMessageOnDifferentChannel
  );
  const onPostVocabFeed = useChatContext((v) => v.actions.onPostVocabFeed);
  const onRemoveReactionFromMessage = useChatContext(
    (v) => v.actions.onRemoveReactionFromMessage
  );
  const onReceiveChatReaction = useChatContext(
    (v) => v.actions.onReceiveChatReaction
  );
  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetVocabLeaderboards = useChatContext(
    (v) => v.actions.onSetVocabLeaderboards
  );

  const loadVocabularyLeaderboards = useAppContext(
    (v) => v.requestHelpers.loadVocabularyLeaderboards
  );
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );
  const checkUnansweredChess = useAppContext(
    (v) => v.requestHelpers.checkUnansweredChess
  );
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );

  // Reactions can come in bursts. We only need to persist lastRead once per second per
  // channel/subchannel because all relevant timestamps are second-granularity.
  const lastReadWriteSecRef = useRef<{
    channel: Record<number, number>;
    subchannel: Record<number, number>;
  }>({ channel: {}, subchannel: {} });

  useEffect(() => {
    // Reset throttle state when user changes.
    lastReadWriteSecRef.current = { channel: {}, subchannel: {} };

    function maybeUpdateLastRead({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId?: number | null;
    }) {
      const nowSec = Math.floor(Date.now() / 1000);
      if (channelId > 0 && lastReadWriteSecRef.current.channel[channelId] !== nowSec) {
        lastReadWriteSecRef.current.channel[channelId] = nowSec;
        updateChatLastRead(channelId);
      }
      if (
        subchannelId &&
        subchannelId > 0 &&
        lastReadWriteSecRef.current.subchannel[subchannelId] !== nowSec
      ) {
        lastReadWriteSecRef.current.subchannel[subchannelId] = nowSec;
        updateSubchannelLastRead(subchannelId);
      }
    }

    socket.on('ai_thinking_status_updated', onChangeAIThinkingStatus);
    socket.on('ai_thought_streamed', handleAIThoughtStream);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on('chat_message_deleted', onDeleteMessage);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_reaction_added', handleChatReactionAdded);
    socket.on('chat_reaction_removed', onRemoveReactionFromMessage);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('message_attachment_hid', onHideAttachment);
    socket.on('human_topic_state_changed', handleHumanTopicStateChanged);
    socket.on('new_message_received', handleReceiveMessage);
    socket.on('new_vocab_feed_received', handleReceiveVocabFeed);
    socket.on('new_wordle_attempt_received', handleNewWordleAttempt);
    socket.on('online_status_changed', handleOnlineStatusChange);
    socket.on('removed_from_channel', handleRemovedFromChannel);
    socket.on('subject_changed', handleTopicChange);
    socket.on('topic_featured', handleTopicFeatured);
    socket.on('topic_settings_changed', onChangeTopicSettings);

    return function cleanUp() {
      chessShortcutRefreshIdRef.current += 1;
      socket.off('ai_thinking_status_updated', onChangeAIThinkingStatus);
      socket.off('ai_thought_streamed', handleAIThoughtStream);
      socket.off('away_status_changed', handleAwayStatusChange);
      socket.off('busy_status_changed', handleBusyStatusChange);
      socket.off('channel_settings_changed', onChangeChannelSettings);
      socket.off('chat_invitation_received', handleChatInvitation);
      socket.off('chat_message_deleted', onDeleteMessage);
      socket.off('chat_message_edited', onEditMessage);
      socket.off('chat_reaction_added', handleChatReactionAdded);
      socket.off('chat_reaction_removed', onRemoveReactionFromMessage);
      socket.off('chat_subject_purchased', onEnableChatSubject);
      socket.off('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
      socket.off('message_attachment_hid', onHideAttachment);
      socket.off('human_topic_state_changed', handleHumanTopicStateChanged);
      socket.off('new_message_received', handleReceiveMessage);
      socket.off('new_vocab_feed_received', handleReceiveVocabFeed);
      socket.off('online_status_changed', handleOnlineStatusChange);
      socket.off('removed_from_channel', handleRemovedFromChannel);
      socket.off('new_wordle_attempt_received', handleNewWordleAttempt);
      socket.off('subject_changed', handleTopicChange);
      socket.off('topic_featured', handleTopicFeatured);
      socket.off('topic_settings_changed', onChangeTopicSettings);
    };

    function handleAwayStatusChange({
      userId,
      isAway
    }: {
      userId: number;
      isAway: boolean;
    }) {
      const currentChatStatus = chatStatusRef.current;
      if (currentChatStatus[userId] && currentChatStatus[userId].isAway !== isAway) {
        onChangeAwayStatus({ userId, isAway });
      }
    }

    function handleBusyStatusChange({
      userId,
      isBusy
    }: {
      userId: number;
      isBusy: boolean;
    }) {
      const currentChatStatus = chatStatusRef.current;
      if (currentChatStatus[userId] && currentChatStatus[userId].isBusy !== isBusy) {
        onChangeBusyStatus({ userId, isBusy });
      }
    }

    function handleChatReactionAdded({
      channelId,
      messageId,
      reaction,
      subchannelId,
      userId: reactorId,
      timeStamp
    }: {
      channelId: number;
      messageId: number;
      reaction: string;
      subchannelId: number;
      userId: number;
      timeStamp?: number;
    }) {
      onAddReactionToMessage({
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId: reactorId
      });

      const channel = channelsObjRef.current?.[channelId];
      // We only show reaction activity in the left channel list for 1:1 (twoPeople) chats.
      // Group chat reactions should update the message, but not bump previews/unreads.
      if (!channel || !channel.twoPeople) return;

      const currentPageVisible = pageVisibleRef.current;
      const currentSelectedChannelId = selectedChannelIdRef.current;
      const currentSubchannelId = subchannelIdRef.current;
      const reactionIsForCurrentChannel = channelId === currentSelectedChannelId;
      const reactionIsForCurrentSubchannel =
        Number(subchannelId || 0) === Number(currentSubchannelId || 0);

      const reactionIsVisibleToViewer =
        reactorId !== userId &&
        reactionIsForCurrentChannel &&
        usingChatRef.current &&
        currentPageVisible &&
        reactionIsForCurrentSubchannel;

      // Keep server unread state consistent: if the viewer is currently seeing the reaction,
      // advance lastRead so it doesn't show up as unread after refresh/other device.
      if (reactionIsVisibleToViewer) {
        maybeUpdateLastRead({ channelId, subchannelId });
      }

      // Update channel preview state for DM reactions.
      // Only increment unread counts if the viewer isn't already seeing the reaction.
      const shouldIncrementUnreads =
        reactorId !== userId &&
        !(
          reactionIsForCurrentChannel &&
          usingChatRef.current &&
          currentPageVisible &&
          reactionIsForCurrentSubchannel
        );

      const stamped = Number(timeStamp) || Math.floor(Date.now() / 1000);
      onReceiveChatReaction({
        channelId,
        messageId,
        reaction,
        subchannelId,
        userId: reactorId,
        pageVisible: currentPageVisible,
        usingChat: usingChatRef.current,
        timeStamp: stamped,
        shouldIncrementUnreads
      });
    }

    function handleChatInvitation({
      message,
      members,
      isTwoPeople,
      isClass,
      pathId
    }: {
      message: any;
      members: any[];
      isTwoPeople: boolean;
      isClass: boolean;
      pathId: number;
    }) {
      let isDuplicate = false;
      const currentSelectedChannelId = selectedChannelIdRef.current;
      const currentChannelsObj = channelsObjRef.current;
      if (currentSelectedChannelId === 0) {
        if (
          members.filter((member) => member.id !== userId)[0].id ===
          currentChannelsObj[currentSelectedChannelId].members.filter(
            (member: { id: number }) => member.id !== userId
          )[0].id
        ) {
          isDuplicate = true;
        }
      }
      socket.emit('join_chat_group', message.channelId);
      onReceiveFirstMsg({
        message,
        isDuplicate,
        isTwoPeople,
        isClass,
        pageVisible: pageVisibleRef.current,
        pathId
      });
    }

    async function handleLeftChatFromAnotherTab(channelId: number) {
      if (selectedChannelIdRef.current === channelId) {
        onLeaveChannel({ channelId, userId });
        if (usingChatRef.current) {
          navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        } else {
          onUpdateSelectedChannelId(GENERAL_CHAT_ID);
          onSetLastChatPath(`/${GENERAL_CHAT_PATH_ID}`);
        }
      } else {
        onLeaveChannel({ channelId, userId });
      }
    }

    function handleNewWordleAttempt({
      channelId,
      channelName,
      user,
      message,
      pathId
    }: {
      channelId: number;
      channelName: string;
      user: any;
      message: any;
      pathId: string;
    }) {
      const currentPageVisible = pageVisibleRef.current;
      const isForCurrentChannel = channelId === selectedChannelIdRef.current;
      if (isForCurrentChannel) {
        if (usingChatRef.current) {
          updateChatLastRead(channelId);
        }
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current
        });
      }
      if (!isForCurrentChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel: {
            id: channelId,
            channelName,
            pathId
          },
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current
        });
      }
      if (user.id === userId && user.newXp) {
        onUpdateMyXpRef.current();
      }
    }

    function handleOnlineStatusChange({
      userId,
      member,
      isOnline,
      lastActive
    }: {
      userId: number;
      member: any;
      isOnline: boolean;
      lastActive?: number;
    }) {
      onChangeOnlineStatus({ userId, member, isOnline, lastActive });
      if (!isOnline) {
        const stamped = Number(lastActive) || Math.floor(Date.now() / 1000);
        onSetUserState({ userId, newState: { lastActive: stamped } });
      }
    }

    async function handleReceiveMessage({
      message,
      channel,
      newMembers,
      isNotification
    }: {
      message: any;
      channel: any;
      newMembers: any[];
      isNotification: boolean;
    }) {
      const currentPageVisible = pageVisibleRef.current;
      const currentSubchannelId = subchannelIdRef.current;
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelIdRef.current;
      const senderIsUser = message.userId === userId && !isNotification;
      if (isChessGameMessage(message)) {
        void refreshUnansweredChessShortcut();
      }
      if (senderIsUser && currentPageVisible) return;
      if (messageIsForCurrentChannel) {
        if (usingChatRef.current) {
          if (message.subchannelId === currentSubchannelId) {
            maybeUpdateLastRead({
              channelId: message.channelId,
              subchannelId: message.subchannelId
            });
          } else {
            maybeUpdateLastRead({ channelId: message.channelId });
          }
        }
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          newMembers,
          currentSubchannelId
        });
      }
      if (!messageIsForCurrentChannel && channel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          newMembers
        });
      }
      if (message.transactionDetails?.id) {
        onUpdateCurrentTransactionId({
          channelId: message.channelId,
          transactionId: message.transactionDetails.id
        });
      }
      if (message.targetMessage?.userId === userId && message.rewardAmount) {
        onUpdateMyXpRef.current();
      }
    }

    function handleRemovedFromChannel({
      channelId,
      memberId
    }: {
      channelId: number;
      memberId: number;
    }) {
      onRemoveMemberFromChannel({ channelId, memberId });
      onSetGroupMemberState({
        groupId: channelId,
        action: 'remove',
        memberId
      });
      if (memberId === userId) {
        onLeaveChannel({ channelId, userId });
        navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        socket.emit('confirm_leave_channel', channelId);
      }
    }
    async function handleReceiveVocabFeed({
      feed,
      currentYear,
      currentMonth
    }: {
      feed: any;
      leaderboards: any;
      currentYear: number;
      currentMonth: number;
    }) {
      if (feed.userId === userId) {
        handleUpdateLeaderboard();
      }
      onPostVocabFeed({
        feed,
        isMyFeed: feed.userId === userId,
        currentYear,
        currentMonth
      });

      async function handleUpdateLeaderboard() {
        const { collectorRankings, monthlyVocabRankings, yearlyVocabRankings } =
          await loadVocabularyLeaderboards();
        onSetVocabLeaderboards({
          collectorRankings,
          monthlyVocabRankings,
          yearlyVocabRankings
        });
      }
    }

    function handleTopicChange({
      message,
      channelId,
      pathId,
      channelName,
      subchannelId,
      subject,
      topicObj,
      isFeatured
    }: {
      message: any;
      channelId: number;
      pathId: number | string;
      channelName: string;
      subchannelId: number;
      subject: string;
      topicObj: any;
      isFeatured: boolean;
    }) {
      const currentPageVisible = pageVisibleRef.current;
      const messageIsForCurrentChannel =
        message.channelId === selectedChannelIdRef.current;
      const senderIsUser = message.userId === userId;

      if (senderIsUser) return;

      if (channelId === GENERAL_CHAT_ID && !subchannelId) {
        onNotifyChatSubjectChange(subject);
      }

      onChangeChatSubject({
        subject,
        topicObj,
        channelId,
        subchannelId,
        isFeatured
      });

      if (messageIsForCurrentChannel) {
        onReceiveMessage({ message, pageVisible: currentPageVisible });
      } else {
        onReceiveMessageOnDifferentChannel({
          pageVisible: currentPageVisible,
          message,
          channel: {
            id: channelId,
            pathId,
            channelName,
            isHidden: false,
            numUnreads: 1
          }
        });
      }
    }

    function handleTopicFeatured({
      channelId,
      topic
    }: {
      channelId: number;
      topic: string;
    }) {
      onFeatureTopic({
        channelId,
        topic
      });
    }

    async function handleHumanTopicStateChanged({
      channelId,
      topicId
    }: {
      channelId: number;
      topicId: number;
      status: 'active' | 'deleted' | 'permanently_deleted';
    }) {
      const normalizedChannelId = Number(channelId || 0);
      const normalizedTopicId = Number(topicId || 0);
      if (!normalizedChannelId) {
        return;
      }
      const isSelectedChannel =
        normalizedChannelId === Number(selectedChannelIdRef.current || 0);
      const initialChannel = channelsObjRef.current[normalizedChannelId] || {};
      if (!isSelectedChannel && !initialChannel.id) return;
      const refreshSeq =
        (humanTopicRefreshSeqRef.current[normalizedChannelId] || 0) + 1;
      humanTopicRefreshSeqRef.current[normalizedChannelId] = refreshSeq;

      try {
        // Human topic deletion/restoration is for channel-level topics. Subchannels
        // use legacyTopicObj; passing subchannelPath here would mark that subchannel read.
        const data = await loadChatChannel({
          channelId: normalizedChannelId,
          skipUpdateChannelId: true,
          fromWriter: true
        });
        if (
          humanTopicRefreshSeqRef.current[normalizedChannelId] !== refreshSeq
        ) {
          return;
        }
        const currentlySelectedChannel =
          normalizedChannelId === Number(selectedChannelIdRef.current || 0);
        const currentChannel =
          channelsObjRef.current[normalizedChannelId] || {};
        if (!currentlySelectedChannel && !currentChannel.id) return;
        const activeSubchannelId = Number(subchannelIdRef.current || 0);
        const activeVisibleChat = usingChatRef.current && pageVisibleRef.current;
        // Channel-level topic refreshes must not enter the root channel while the
        // user is away or in a subchannel; ENTER_CHANNEL would reset unrelated local state.
        const shouldEnterSelectedChannel =
          isSelectedChannel &&
          currentlySelectedChannel &&
          activeVisibleChat &&
          !activeSubchannelId;
        const shouldApplyCanonicalMessages =
          !currentlySelectedChannel || !shouldEnterSelectedChannel;
        const canonicalChannel = data?.channel || {};
        if (!canonicalChannel.id) return;
        const canonicalMessages = Array.isArray(data?.messages)
          ? data.messages
          : [];
        const canonicalPreviewMessages =
          canonicalMessages.length === 21
            ? canonicalMessages.slice(0, 20)
            : canonicalMessages;
        const canonicalMessagesObj: Record<number, any> = {};
        for (const message of canonicalPreviewMessages) {
          canonicalMessagesObj[message.id] = {
            ...message,
            isLoaded: false
          };
        }

        if (shouldEnterSelectedChannel) {
          onEnterChannelWithId(data);
        }
        const canonicalTopicObj = canonicalChannel.topicObj || {};
        const mergedTopicObj: Record<string, any> = {};
        for (const topicIdKey in canonicalTopicObj) {
          const existingTopic = currentChannel.topicObj?.[topicIdKey];
          const serverTopic = canonicalTopicObj[topicIdKey];
          mergedTopicObj[topicIdKey] = {
            ...existingTopic,
            ...serverTopic,
            ...(existingTopic?.loaded
              ? {
                  loaded: true,
                  messageIds: existingTopic.messageIds,
                  messagesObj: existingTopic.messagesObj,
                  loadMoreButtonShown: existingTopic.loadMoreButtonShown,
                  searchedMessageIds: existingTopic.searchedMessageIds,
                  searchedMessagesObj: existingTopic.searchedMessagesObj,
                  searchText: existingTopic.searchText
                }
              : {})
          };
        }
        const topicWasHidden =
          normalizedTopicId > 0 && !canonicalTopicObj[normalizedTopicId];
        const selectedTopicWasHidden =
          topicWasHidden &&
          Number(currentChannel.selectedTopicId || 0) === normalizedTopicId &&
          !canonicalTopicObj[normalizedTopicId];
        const currentTopicHistory = Array.isArray(currentChannel.topicHistory)
          ? currentChannel.topicHistory
          : [];
        const prunedTopicHistory = topicWasHidden
          ? currentTopicHistory.filter(
              (historyTopicId: number) => !!canonicalTopicObj[historyTopicId]
            )
          : currentTopicHistory;
        const topicHistoryWasPruned =
          prunedTopicHistory.length !== currentTopicHistory.length;
        const prunedCurrentTopicIndex = topicHistoryWasPruned
          ? Math.max(
              -1,
              prunedTopicHistory.findIndex(
                (historyTopicId: number) =>
                  Number(historyTopicId) ===
                  Number(currentChannel.selectedTopicId || 0)
              )
            )
          : currentChannel.currentTopicIndex;
        onSetChannelState({
          channelId: normalizedChannelId,
          newState: {
            featuredTopicId: canonicalChannel.featuredTopicId || null,
            lastTopicId: canonicalChannel.lastTopicId || null,
            pinnedTopicIds: canonicalChannel.pinnedTopicIds || [],
            topicObj: mergedTopicObj,
            ...(shouldApplyCanonicalMessages
              ? {
                  messageIds: canonicalPreviewMessages.map(
                    (message: { id: number }) => message.id
                  ),
                  messagesObj: {
                    ...currentChannel.messagesObj,
                    ...canonicalMessagesObj
                  },
                  messagesLoadMoreButton: canonicalMessages.length === 21
                }
              : {}),
            ...(selectedTopicWasHidden
              ? {
                  selectedTab: 'all',
                  selectedTopicId: null,
                  topicHistory: [],
                  currentTopicIndex: -1
                }
              : topicHistoryWasPruned
                ? {
                    topicHistory: prunedTopicHistory,
                    currentTopicIndex: prunedCurrentTopicIndex
                  }
                : {}),
          }
        });
        if (shouldEnterSelectedChannel && selectedTopicWasHidden) {
          navigate(`/chat/${canonicalChannel.pathId}`);
        }
      } catch (error) {
        console.error('Failed to refresh channel after topic state change:', error);
      }
    }

    function handleAIThoughtStream({
      channelId,
      messageId,
      thoughtContent,
      isComplete,
      isThinkingHard
    }: {
      channelId: number;
      messageId: number;
      thoughtContent: string;
      isComplete: boolean;
      isThinkingHard?: boolean;
    }) {
      onUpdateAIThoughtStream({
        channelId,
        messageId,
        thoughtContent,
        isComplete,
        isThinkingHard
      });
    }

    async function refreshUnansweredChessShortcut() {
      const refreshId = ++chessShortcutRefreshIdRef.current;
      try {
        const { unansweredChessMsgChannelId } = await checkUnansweredChess();
        if (refreshId !== chessShortcutRefreshIdRef.current) return;
        onUpdateTodayStats({ newStats: { unansweredChessMsgChannelId } });
      } catch (error) {
        if (refreshId !== chessShortcutRefreshIdRef.current) return;
        console.error('Failed to refresh unanswered chess shortcut:', error);
      }
    }

    function isChessGameMessage(message: any) {
      if (!message?.isChessMsg || message?.omokState) return false;
      if (message.gameType === 'omok') return false;
      if (message.gameType === 'chess') return true;
      const content =
        typeof message.content === 'string' ? message.content.toLowerCase() : '';
      return !content.includes('omok');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
