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
import { showDesktopNotification } from '~/helpers/desktopNotifications';
import { shouldShowBackgroundChatMessageNotification } from '~/helpers/chatNotificationPolicy';
import {
  createRealtimeChatMessageReplayWindow,
  getRealtimeChatMessageKey,
  hasCanonicalChatMessage
} from '~/helpers/chatRealtimeMessageIdentity';
import {
  getChatUnreadActivityRevision,
  markChatUnreadActivity
} from '~/helpers/chatUnreadActivity';
import { getVisibleChatReadMessageId } from '~/helpers/chatReadCursor';
import useChatQuickAccessRefresh from '~/helpers/hooks/useChatQuickAccessRefresh';
import { buildCanonicalChatMessagePageState } from '~/contexts/Chat/messagePageState';
import type {
  CanonicalChatChannelUnreadState,
  CanonicalChatReactionUpdate,
  CanonicalChatSidebarState,
  ChatQuickAccessState
} from '~/types/chat';

const QUICK_ACCESS_ACTIVITY_DEBOUNCE_MS = 1500;
const QUICK_ACCESS_ACTIVITY_MIN_INTERVAL_MS = 5000;
const QUICK_ACCESS_ACTIVITY_MAX_WAIT_MS = 5000;
const UNREAD_RESYNC_RETRY_DELAY_MS = 500;
const UNREAD_RESYNC_MAX_RETRY_DELAY_MS = 10_000;

function getUnreadResyncRetryDelayMs(retryCount: number) {
  return Math.min(
    UNREAD_RESYNC_MAX_RETRY_DELAY_MS,
    UNREAD_RESYNC_RETRY_DELAY_MS * 2 ** Math.min(Math.max(retryCount, 0), 5)
  );
}

function shouldRetryCanonicalUnreadRead(error: any) {
  const status = Number(error?.status || error?.response?.status || 0);
  return (
    status === 0 ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

interface LegacyChatReactionEvent {
  channelId: number;
  messageId: number;
  reaction: string;
  subchannelId: number;
  userId: number;
  timeStamp?: number;
  canonicalBridge?: boolean;
}

export default function useChatSocket({
  activeChatChannelIdRef,
  channelsObj,
  onUpdateMyXp,
  selectedChannelId,
  subchannelId,
  usingChatRef
}: {
  activeChatChannelIdRef: React.RefObject<number | null>;
  channelsObj: Record<number, any>;
  onUpdateMyXp: () => void;
  selectedChannelId: number;
  subchannelId: number;
  usingChatRef: React.RefObject<boolean>;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);

  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const quickAccessMode = useChatContext(
    (v) => v.state.quickAccess?.mode || 'automatic'
  );
  const quickAccessPartners = useChatContext(
    (v) => v.state.quickAccess?.partners
  );
  const chatNotificationSettings = useChatContext(
    (v) => v.state.chatNotificationSettings
  );
  const homeChannelIds = useChatContext((v) => v.state.homeChannelIds);
  const favoriteChannelIds = useChatContext(
    (v) => v.state.favoriteChannelIds
  );
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const channelsObjRef = useRef(channelsObj);
  const onUpdateMyXpRef = useRef(onUpdateMyXp);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const subchannelIdRef = useRef(subchannelId);
  const chatStatusRef = useRef(chatStatus);
  const pageVisibleRef = useRef(pageVisible);
  const quickAccessModeRef = useRef(quickAccessMode);
  const quickAccessPartnersRef = useRef(quickAccessPartners);
  const chatNotificationSettingsRef = useRef(chatNotificationSettings);
  const listedChannelIdsRef = useRef(new Set<number>());
  const quickAccessRefreshTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const quickAccessRefreshMaxTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const quickAccessLastActivityRefreshAtRef = useRef(0);
  const chessShortcutRefreshIdRef = useRef(0);
  const humanTopicRefreshSeqRef = useRef<Record<number, number>>({});
  const unreadResyncGenerationRef = useRef(0);
  const unreadResyncQueuedRef = useRef(false);
  const unreadResyncRetryCountRef = useRef(0);
  const unreadResyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const channelUnreadResyncQueueRef = useRef(
    new Map<
      string,
      {
        channelId: number;
        subchannelId: number;
        includeChannelSummary: boolean;
        retryCount: number;
      }
    >()
  );
  const channelUnreadResyncInFlightRef = useRef(false);
  const channelUnreadResyncTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const realtimeMessageReplayWindowRef = useRef(
    createRealtimeChatMessageReplayWindow()
  );

  channelsObjRef.current = channelsObj;
  onUpdateMyXpRef.current = onUpdateMyXp;
  selectedChannelIdRef.current = selectedChannelId;
  subchannelIdRef.current = subchannelId;
  chatStatusRef.current = chatStatus;
  pageVisibleRef.current = pageVisible;
  quickAccessModeRef.current = quickAccessMode;
  quickAccessPartnersRef.current = quickAccessPartners;
  chatNotificationSettingsRef.current = chatNotificationSettings;
  listedChannelIdsRef.current = new Set(
    [
      ...(homeChannelIds || []),
      ...(favoriteChannelIds || []),
      ...(classChannelIds || [])
    ].map((channelId) => Number(channelId))
  );

  const onApplyCanonicalChatReaction = useChatContext(
    (v) => v.actions.onApplyCanonicalChatReaction
  );
  const onApplyCanonicalChannelUnreadState = useChatContext(
    (v) => v.actions.onApplyCanonicalChannelUnreadState
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
  const onAppendAIMessageDelta = useChatContext(
    (v) => v.actions.onAppendAIMessageDelta
  );
  const onEnableChatSubject = useChatContext(
    (v) => v.actions.onEnableChatSubject
  );
  const onApplyCanonicalGroupMemberJoin = useChatContext(
    (v) => v.actions.onApplyCanonicalGroupMemberJoin
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
  const onSetChatAttachmentThumbUrl = useChatContext(
    (v) => v.actions.onSetChatAttachmentThumbUrl
  );
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
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const onSetChatNotificationSettings = useChatContext(
    (v) => v.actions.onSetChatNotificationSettings
  );
  const onApplyCanonicalChatSidebarState = useChatContext(
    (v) => v.actions.onApplyCanonicalChatSidebarState
  );
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetVocabLeaderboards = useChatContext(
    (v) => v.actions.onSetVocabLeaderboards
  );
  const refreshCanonicalQuickAccess = useChatQuickAccessRefresh();

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
  const getNumberOfUnreadMessages = useAppContext(
    (v) => v.requestHelpers.getNumberOfUnreadMessages
  );
  const loadChatChannelUnreadState = useAppContext(
    (v) => v.requestHelpers.loadChatChannelUnreadState
  );
  const syncLegacyChatReaction = useAppContext(
    (v) => v.requestHelpers.syncLegacyChatReaction
  );
  // Serializes canonical global-unread resyncs triggered by socket activity.
  const unreadResyncInFlightRef = useRef(false);

  // Coalesce repeated reads of the same confirmed boundary within one server
  // second, but never suppress a later message id from that same second.
  const lastReadWriteRef = useRef<{
    channel: Record<number, { timeStamp: number; lastReadMessageId: number }>;
    subchannel: Record<
      number,
      { timeStamp: number; lastReadMessageId: number }
    >;
  }>({ channel: {}, subchannel: {} });

  useEffect(() => {
    const unreadResyncGeneration = ++unreadResyncGenerationRef.current;
    const channelUnreadResyncQueue = channelUnreadResyncQueueRef.current;
    // SocketManager survives logout and account switching. Replay suppression
    // belongs to one authenticated delivery stream, so never carry it into the
    // next account before that account's canonical chat bootstrap completes.
    realtimeMessageReplayWindowRef.current.reset();
    // Reset throttle state when user changes. The unread-activity revision is
    // a monotonic module counter shared with the other last-read reconcilers
    // and is never reset; equality snapshots stay valid across user changes.
    lastReadWriteRef.current = { channel: {}, subchannel: {} };
    unreadResyncQueuedRef.current = false;
    unreadResyncRetryCountRef.current = 0;
    unreadResyncInFlightRef.current = false;
    channelUnreadResyncQueue.clear();
    channelUnreadResyncInFlightRef.current = false;

    function markUnreadActivity() {
      markChatUnreadActivity();
    }

    function canonicalUnreadSummaryIsNeeded(channelId: number) {
      const normalizedChannelId = Number(channelId || 0);
      const channel = channelsObjRef.current?.[normalizedChannelId];
      return Boolean(
        !channel?.id ||
          channel.isHidden ||
          !listedChannelIdsRef.current.has(normalizedChannelId)
      );
    }

    async function maybeUpdateLastRead({
      channelId,
      subchannelId,
      lastReadMessageId: eventMessageId
    }: {
      channelId: number;
      subchannelId?: number | null;
      lastReadMessageId?: number | null;
    }) {
      const nowSec = Math.floor(Date.now() / 1000);
      const normalizedSubchannelId = Number(subchannelId || 0);
      const channel = channelsObjRef.current?.[channelId];
      const scope = normalizedSubchannelId
        ? channel?.subchannelObj?.[normalizedSubchannelId]
        : channel;
      const lastReadMessageId = getVisibleChatReadMessageId({
        confirmedMessageId: eventMessageId,
        visibleMessageIds: scope?.messageIds
      });
      const previousMainWrite = lastReadWriteRef.current.channel[channelId];
      const previousSubchannelWrite =
        lastReadWriteRef.current.subchannel[normalizedSubchannelId];
      const shouldUpdateMain =
        channelId > 0 &&
        normalizedSubchannelId === 0 &&
        (previousMainWrite?.timeStamp !== nowSec ||
          lastReadMessageId >
            Number(previousMainWrite?.lastReadMessageId || 0));
      const shouldUpdateSubchannel = Boolean(
        normalizedSubchannelId > 0 &&
        (previousSubchannelWrite?.timeStamp !== nowSec ||
          lastReadMessageId >
            Number(previousSubchannelWrite?.lastReadMessageId || 0))
      );
      if (!shouldUpdateMain && !shouldUpdateSubchannel) return;

      // A canonical read mutation changes the basis of every unread snapshot,
      // independently of message/reaction activity. Invalidate older reads at
      // request start, then apply only the server-returned read watermark.
      markUnreadActivity();
      const reconciliations: Promise<void>[] = [];
      if (shouldUpdateMain) {
        lastReadWriteRef.current.channel[channelId] = {
          timeStamp: nowSec,
          lastReadMessageId: Math.max(
            lastReadMessageId,
            Number(previousMainWrite?.lastReadMessageId || 0)
          )
        };
        reconciliations.push(
          reconcileCanonicalLastRead({
            request: updateChatLastRead({ channelId, lastReadMessageId }),
            channelId,
            subchannelId: 0
          })
        );
      }
      if (shouldUpdateSubchannel) {
        lastReadWriteRef.current.subchannel[normalizedSubchannelId] = {
          timeStamp: nowSec,
          lastReadMessageId: Math.max(
            lastReadMessageId,
            Number(previousSubchannelWrite?.lastReadMessageId || 0)
          )
        };
        reconciliations.push(
          reconcileCanonicalLastRead({
            request: updateSubchannelLastRead({
              channelId,
              subchannelId: normalizedSubchannelId,
              lastReadMessageId
            }),
            channelId,
            subchannelId: normalizedSubchannelId
          })
        );
      }
      await Promise.all(reconciliations);
    }

    async function reconcileCanonicalLastRead({
      request,
      channelId,
      subchannelId
    }: {
      request: Promise<CanonicalChatChannelUnreadState>;
      channelId: number;
      subchannelId: number;
    }) {
      const expectedActivityRevision = getChatUnreadActivityRevision();
      try {
        const unreadState = await request;
        const activityRaced =
          getChatUnreadActivityRevision() !== expectedActivityRevision;
        // Invalidate any snapshot started while this write was in flight. The
        // returned channel and global projections belong to one writer read.
        markUnreadActivity();
        if (activityRaced) {
          // A confirmed socket event landed after the writer snapshotted this
          // write. Applying the older snapshot would erase that event's
          // unread state (a plain message does not advance the reaction
          // revision the reducer checks); re-read the writer instead, like
          // the queued resync paths below.
          queueChannelUnreadStateResync({
            channelId,
            subchannelId,
            includeChannelSummary: canonicalUnreadSummaryIsNeeded(channelId)
          });
          return;
        }
        if (unreadState?.channel) {
          onApplyCanonicalChannelUnreadState({ unreadState, userId });
        }
      } catch (error) {
        markUnreadActivity();
        // The write may have committed before transport failed. Re-read the
        // writer instead of guessing whether the scope is now read.
        queueChannelUnreadStateResync({
          channelId,
          subchannelId,
          includeChannelSummary: canonicalUnreadSummaryIsNeeded(channelId)
        });
        console.error('Failed to reconcile canonical chat read state:', error);
      }
    }

    socket.on('ai_thinking_status_updated', onChangeAIThinkingStatus);
    socket.on('ai_thought_streamed', handleAIThoughtStream);
    socket.on('away_status_changed', handleAwayStatusChange);
    socket.on('busy_status_changed', handleBusyStatusChange);
    socket.on('channel_settings_changed', onChangeChannelSettings);
    socket.on('chat_invitation_received', handleChatInvitation);
    socket.on(
      'chat_notification_settings_updated',
      handleChatNotificationSettingsUpdated
    );
    socket.on('chat_message_deleted', handleChatMessageDeleted);
    socket.on('chat_message_edited', onEditMessage);
    socket.on('chat_attachment_thumbnail_updated', onSetChatAttachmentThumbUrl);
    socket.on('ai_message_delta_streamed', onAppendAIMessageDelta);
    socket.on('chat_reaction_added', handleLegacyChatReactionAdded);
    socket.on('chat_reaction_removed', handleLegacyChatReactionRemoved);
    socket.on('chat_reaction_updated', handleChatReactionUpdate);
    socket.on('chat_sidebar_state_updated', handleChatSidebarStateUpdate);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
    socket.on('member_joined', handleMemberJoined);
    socket.on('member_left', handleMemberLeftUnreadState);
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
      unreadResyncGenerationRef.current += 1;
      clearScheduledChatQuickAccessRefresh();
      quickAccessLastActivityRefreshAtRef.current = 0;
      unreadResyncQueuedRef.current = false;
      unreadResyncRetryCountRef.current = 0;
      unreadResyncInFlightRef.current = false;
      channelUnreadResyncQueue.clear();
      channelUnreadResyncInFlightRef.current = false;
      if (unreadResyncTimerRef.current) {
        clearTimeout(unreadResyncTimerRef.current);
        unreadResyncTimerRef.current = null;
      }
      if (channelUnreadResyncTimerRef.current) {
        clearTimeout(channelUnreadResyncTimerRef.current);
        channelUnreadResyncTimerRef.current = null;
      }
      socket.off('ai_thinking_status_updated', onChangeAIThinkingStatus);
      socket.off('ai_thought_streamed', handleAIThoughtStream);
      socket.off('away_status_changed', handleAwayStatusChange);
      socket.off('busy_status_changed', handleBusyStatusChange);
      socket.off('channel_settings_changed', onChangeChannelSettings);
      socket.off('chat_invitation_received', handleChatInvitation);
      socket.off(
        'chat_notification_settings_updated',
        handleChatNotificationSettingsUpdated
      );
      socket.off('chat_message_deleted', handleChatMessageDeleted);
      socket.off('chat_message_edited', onEditMessage);
      socket.off(
        'chat_attachment_thumbnail_updated',
        onSetChatAttachmentThumbUrl
      );
      socket.off('ai_message_delta_streamed', onAppendAIMessageDelta);
      socket.off('chat_reaction_added', handleLegacyChatReactionAdded);
      socket.off('chat_reaction_removed', handleLegacyChatReactionRemoved);
      socket.off('chat_reaction_updated', handleChatReactionUpdate);
      socket.off('chat_sidebar_state_updated', handleChatSidebarStateUpdate);
      socket.off('chat_subject_purchased', onEnableChatSubject);
      socket.off('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
      socket.off('member_joined', handleMemberJoined);
      socket.off('member_left', handleMemberLeftUnreadState);
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
      if (
        currentChatStatus[userId] &&
        currentChatStatus[userId].isAway !== isAway
      ) {
        onChangeAwayStatus({ userId, isAway });
      }
    }

    function handleChatNotificationSettingsUpdated(settings: any) {
      if (Number(settings?.userId) !== Number(userId)) return;
      onSetChatNotificationSettings(settings);
    }

    function handleChatMessageDeleted(payload: any) {
      markUnreadActivity();
      onDeleteMessage(payload);
      const deletedChannelId = Number(payload?.channelId || 0);
      if (deletedChannelId > 0) {
        queueChannelUnreadStateResync({
          channelId: deletedChannelId,
          subchannelId: Number(payload?.subchannelId || 0),
          includeChannelSummary:
            canonicalUnreadSummaryIsNeeded(deletedChannelId)
        });
      } else {
        queueGlobalUnreadCountResync();
      }
    }

    function handleMemberLeftUnreadState({ channelId }: { channelId: number }) {
      const normalizedChannelId = Number(channelId || 0);
      if (normalizedChannelId <= 0) return;

      const mainScopeIsVisible =
        pageVisibleRef.current &&
        activeChatChannelIdRef.current === normalizedChannelId &&
        Number(subchannelIdRef.current || 0) === 0;
      if (mainScopeIsVisible) {
        // Chat/Main owns the canonical last-read write for visible Main.
        return;
      }

      // A private-channel leave persists a Main notification before this
      // event is emitted. Re-read both projections from the writer instead of
      // guessing how that row changes scoped or global unread state.
      markUnreadActivity();
      queueChannelUnreadStateResync({
        channelId: normalizedChannelId,
        subchannelId: 0,
        includeChannelSummary:
          canonicalUnreadSummaryIsNeeded(normalizedChannelId)
      });
    }

    function handleChatSidebarStateUpdate({
      quickAccess,
      favoriteState,
      channelVisibility
    }: CanonicalChatSidebarState) {
      onApplyCanonicalChatSidebarState({
        quickAccess,
        favoriteState,
        channelVisibility,
        // The socket session is authenticated as this effect's user; the
        // effect re-subscribes when the user changes.
        userId
      });
      const visibilityChannelId = Number(channelVisibility?.channelId || 0);
      if (visibilityChannelId > 0) {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId: visibilityChannelId,
          subchannelId: 0,
          // A channel object can survive while its Home/Class list membership
          // was removed by an earlier hide. The canonical summary restores the
          // visible list projection as well as a completely missing channel.
          includeChannelSummary: !channelVisibility?.isHidden
        });
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
      if (
        currentChatStatus[userId] &&
        currentChatStatus[userId].isBusy !== isBusy
      ) {
        onChangeBusyStatus({ userId, isBusy });
      }
    }

    function getReactionDirectMessageState({
      channelId,
      twoPeople
    }: {
      channelId: number;
      twoPeople?: boolean;
    }) {
      if (typeof twoPeople === 'boolean') return twoPeople;
      const channel = channelsObjRef.current?.[channelId];
      return channel ? Boolean(channel.twoPeople) : null;
    }

    function handleLegacyChatReactionAdded(payload: LegacyChatReactionEvent) {
      void reconcileLegacyChatReaction(payload, 'add');
    }

    function handleLegacyChatReactionRemoved(payload: LegacyChatReactionEvent) {
      void reconcileLegacyChatReaction(payload, 'remove');
    }

    async function reconcileLegacyChatReaction(
      payload: LegacyChatReactionEvent,
      mutation: 'add' | 'remove'
    ) {
      // New socket workers send the legacy event only so pre-deploy browser
      // bundles keep working. This bundle has already received the canonical
      // envelope and must not reconcile it a second time.
      if (payload?.canonicalBridge) return;
      try {
        const reactionUpdate = (await syncLegacyChatReaction({
          channelId: Number(payload?.channelId || 0),
          messageId: Number(payload?.messageId || 0),
          mutation,
          reaction: payload?.reaction,
          reactorId: Number(payload?.userId || 0),
          timeStamp: Number(payload?.timeStamp || 0)
        })) as CanonicalChatReactionUpdate;
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        if (reactionUpdate?.messageId) {
          await handleChatReactionUpdate(reactionUpdate);
        }
      } catch (error) {
        // The old delta is deliberately not a fallback source of truth. A
        // later canonical socket event/bootstrap is safer than guessing.
        console.error('Failed to reconcile legacy chat reaction:', error);
      }
    }

    async function handleChatReactionUpdate(
      update: CanonicalChatReactionUpdate
    ) {
      const { channelId, subchannelId, userId: reactorId, mutation } = update;
      const requiresSidebarResync = update.requiresSidebarResync === true;
      const isDirectMessage = getReactionDirectMessageState({
        channelId,
        twoPeople: update.twoPeople
      });
      if (
        isDirectMessage !== false &&
        (requiresSidebarResync || update.channelActivity?.changed)
      ) {
        scheduleChatQuickAccessRefresh(channelId, {
          force: requiresSidebarResync || mutation === 'remove'
        });
      }

      const currentPageVisible = pageVisibleRef.current;
      const currentActiveChatChannelId = activeChatChannelIdRef.current;
      const currentSubchannelId = subchannelIdRef.current;
      const reactionIsForCurrentChannel =
        channelId === currentActiveChatChannelId;
      const reactionIsForCurrentSubchannel =
        Number(subchannelId || 0) === Number(currentSubchannelId || 0);
      const reactionScopeIsActivelyVisible =
        currentPageVisible &&
        reactionIsForCurrentChannel &&
        usingChatRef.current &&
        reactionIsForCurrentSubchannel;

      const reactionScopeIsVisibleToViewer =
        reactorId !== userId && reactionScopeIsActivelyVisible;
      const reactionIsVisibleToViewer =
        mutation === 'add' && reactionScopeIsVisibleToViewer;

      // Keep server unread state consistent: if the viewer is currently seeing the reaction,
      // advance lastRead so it doesn't show up as unread after refresh/other device.
      const lastReadReconciliation = reactionIsVisibleToViewer
        ? maybeUpdateLastRead({
            channelId,
            subchannelId,
            lastReadMessageId: update.messageId
          })
        : null;

      const unreadProjectionCouldChange = Boolean(
        isDirectMessage !== false &&
        reactorId !== userId &&
        (requiresSidebarResync || update.channelActivity?.changed)
      );
      if (unreadProjectionCouldChange && !reactionIsVisibleToViewer) {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId,
          subchannelId,
          includeChannelSummary: canonicalUnreadSummaryIsNeeded(channelId)
        });
      }

      // Retain a race marker during Chat bootstrap, but never derive a count
      // from it. The queued writer read owns the displayed unread projection.
      const shouldTrackUnreadActivity =
        !requiresSidebarResync &&
        mutation === 'add' &&
        reactorId !== userId &&
        !reactionScopeIsActivelyVisible;

      onApplyCanonicalChatReaction({
        update,
        ownerUserId: userId,
        pageVisible: currentPageVisible,
        usingChat: usingChatRef.current,
        shouldTrackUnreadActivity
      });
      if (requiresSidebarResync) {
        // Legacy events carry no ordered unread projection. If the addition is
        // visible, commit and reconcile its canonical read watermark before a
        // writer reread can project the reaction as unread. Starting the write
        // without awaiting it would leave the two requests racing.
        if (lastReadReconciliation) await lastReadReconciliation;
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        return;
      }
      if (lastReadReconciliation) void lastReadReconciliation;
    }

    function queueChannelUnreadStateResync(
      {
        channelId,
        subchannelId = 0,
        includeChannelSummary = false,
        retryCount = 0
      }: {
        channelId: number;
        subchannelId?: number;
        includeChannelSummary?: boolean;
        retryCount?: number;
      },
      delayMs = 0
    ) {
      const normalizedChannelId = Number(channelId);
      const normalizedSubchannelId = Number(subchannelId || 0);
      if (
        !Number.isSafeInteger(normalizedChannelId) ||
        normalizedChannelId <= 0
      ) {
        return;
      }
      const key = `${normalizedChannelId}:${normalizedSubchannelId}`;
      const existingScope = channelUnreadResyncQueueRef.current.get(key);
      channelUnreadResyncQueueRef.current.set(key, {
        channelId: normalizedChannelId,
        subchannelId: normalizedSubchannelId,
        includeChannelSummary:
          includeChannelSummary ||
          Boolean(existingScope?.includeChannelSummary),
        retryCount
      });
      if (
        channelUnreadResyncInFlightRef.current ||
        channelUnreadResyncTimerRef.current ||
        unreadResyncGenerationRef.current !== unreadResyncGeneration
      ) {
        return;
      }
      if (delayMs > 0) {
        channelUnreadResyncTimerRef.current = setTimeout(() => {
          channelUnreadResyncTimerRef.current = null;
          void resyncNextChannelUnreadState();
        }, delayMs);
        return;
      }
      void resyncNextChannelUnreadState();
    }

    async function resyncNextChannelUnreadState() {
      if (
        channelUnreadResyncInFlightRef.current ||
        unreadResyncGenerationRef.current !== unreadResyncGeneration
      ) {
        return;
      }
      const nextEntry = channelUnreadResyncQueueRef.current.entries().next();
      if (nextEntry.done) return;
      const [key, scope] = nextEntry.value;
      channelUnreadResyncQueueRef.current.delete(key);
      channelUnreadResyncInFlightRef.current = true;
      const expectedActivityRevision = getChatUnreadActivityRevision();
      try {
        const unreadState = (await loadChatChannelUnreadState({
          channelId: scope.channelId,
          subchannelId: scope.subchannelId,
          includeChannelSummary: scope.includeChannelSummary
        })) as CanonicalChatChannelUnreadState;
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
          channelUnreadResyncQueueRef.current.set(key, {
            ...scope,
            retryCount: 0
          });
        } else if (
          Number(unreadState?.channelId || 0) === scope.channelId &&
          unreadState?.channel
        ) {
          onApplyCanonicalChannelUnreadState({ unreadState, userId });
        }
      } catch (error: any) {
        // Preserve the last confirmed state and retry the same combined scope
        // + global snapshot while this transport remains healthy. A real
        // disconnect hands ownership to the writer-backed reconnect bootstrap.
        if (socket.connected && shouldRetryCanonicalUnreadRead(error)) {
          channelUnreadResyncQueueRef.current.set(key, {
            ...scope,
            retryCount: scope.retryCount + 1
          });
        } else if (
          Number(error?.status || error?.response?.status || 0) === 403 ||
          Number(error?.status || error?.response?.status || 0) === 404
        ) {
          // Membership may have been revoked after the socket event. The
          // inaccessible scope cannot be retried, but its removal can still
          // change the aggregate navigation alert.
          queueGlobalUnreadCountResync();
        }
        console.error('Failed to resync channel unread state:', error);
      } finally {
        if (unreadResyncGenerationRef.current === unreadResyncGeneration) {
          channelUnreadResyncInFlightRef.current = false;
          if (channelUnreadResyncQueueRef.current.size > 0) {
            const nextScope = channelUnreadResyncQueueRef.current
              .values()
              .next().value;
            if (nextScope) {
              queueChannelUnreadStateResync(
                nextScope,
                getUnreadResyncRetryDelayMs(nextScope.retryCount)
              );
            }
          }
        }
      }
    }

    function queueGlobalUnreadCountResync(
      delayMs = 0,
      preserveRetryCount = false
    ) {
      unreadResyncQueuedRef.current = true;
      if (!preserveRetryCount) unreadResyncRetryCountRef.current = 0;
      if (
        unreadResyncInFlightRef.current ||
        unreadResyncTimerRef.current ||
        unreadResyncGenerationRef.current !== unreadResyncGeneration
      ) {
        return;
      }
      if (delayMs > 0) {
        unreadResyncTimerRef.current = setTimeout(() => {
          unreadResyncTimerRef.current = null;
          void resyncGlobalUnreadCount();
        }, delayMs);
        return;
      }
      void resyncGlobalUnreadCount();
    }

    async function resyncGlobalUnreadCount() {
      if (
        !unreadResyncQueuedRef.current ||
        unreadResyncGenerationRef.current !== unreadResyncGeneration
      ) {
        return;
      }
      unreadResyncQueuedRef.current = false;
      unreadResyncInFlightRef.current = true;
      const expectedActivityRevision = getChatUnreadActivityRevision();
      try {
        const numUnreads = await getNumberOfUnreadMessages({
          fromWriter: true
        });
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
          // A confirmed socket event landed after the writer snapshot. Debounce
          // a fresh read instead of replacing that event or hammering the
          // writer while a conversation is busy.
          unreadResyncQueuedRef.current = true;
        } else if (typeof numUnreads === 'number' && !isNaN(numUnreads)) {
          unreadResyncRetryCountRef.current = 0;
          onGetNumberOfUnreadMessages(numUnreads);
        }
      } catch (error: any) {
        if (socket.connected && shouldRetryCanonicalUnreadRead(error)) {
          unreadResyncQueuedRef.current = true;
          unreadResyncRetryCountRef.current += 1;
        }
        console.error('Failed to resync unread count:', error);
      } finally {
        if (unreadResyncGenerationRef.current === unreadResyncGeneration) {
          unreadResyncInFlightRef.current = false;
          if (unreadResyncQueuedRef.current && socket.connected) {
            queueGlobalUnreadCountResync(
              getUnreadResyncRetryDelayMs(unreadResyncRetryCountRef.current),
              true
            );
          }
        }
      }
    }

    function handleChatInvitation({
      message,
      members,
      isTwoPeople,
      isClass,
      pathId,
      quickAccess
    }: {
      message: any;
      members: any[];
      isTwoPeople: boolean;
      isClass: boolean;
      pathId: number;
      quickAccess?: ChatQuickAccessState;
    }) {
      if (shouldSkipRealtimeMessage(message)) return;
      let isDuplicate = false;
      // New servers include the writer-backed envelope. The fallback keeps a
      // rolling deployment correct without locally synthesizing metadata.
      if (isTwoPeople && !quickAccess) {
        void refreshChatQuickAccess({ includeCustom: true });
      }
      const currentSelectedChannelId = selectedChannelIdRef.current;
      const currentChannelsObj = channelsObjRef.current;
      if (currentSelectedChannelId === 0 && isTwoPeople) {
        const invitedPartnerId = members.find(
          (member) => Number(member?.id) !== Number(userId)
        )?.id;
        const temporaryPartnerId = currentChannelsObj[0]?.members?.find(
          (member: { id?: number }) => Number(member?.id) !== Number(userId)
        )?.id;
        isDuplicate = Boolean(
          invitedPartnerId &&
          temporaryPartnerId &&
          Number(invitedPartnerId) === Number(temporaryPartnerId)
        );
      }
      socket.emit('join_chat_group', message.channelId);
      if (message.userId !== userId && document.hidden) {
        notifyMessageReceivedWhileAway({
          message,
          channel: { pathId, twoPeople: isTwoPeople }
        });
      }
      onReceiveFirstMsg({
        message,
        members,
        isDuplicate,
        isTwoPeople,
        isClass,
        pageVisible: pageVisibleRef.current,
        pathId,
        quickAccess,
        userId
      });
      const invitationChannelId = Number(message.channelId);
      const invitationSubchannelId = Number(message.subchannelId || 0);
      const activeSubchannelId = Number(subchannelIdRef.current || 0);
      const invitationScopeIsActivelyVisible = Boolean(
        Number(message.userId) !== Number(userId) &&
        pageVisibleRef.current &&
        usingChatRef.current &&
        invitationSubchannelId === activeSubchannelId &&
        (invitationChannelId === activeChatChannelIdRef.current ||
          (isDuplicate && activeSubchannelId === 0))
      );
      if (invitationScopeIsActivelyVisible) {
        void maybeUpdateLastRead({
          channelId: invitationChannelId,
          subchannelId: invitationSubchannelId,
          lastReadMessageId: message.id
        });
      } else if (Number(message.userId) !== Number(userId)) {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId: invitationChannelId,
          subchannelId: invitationSubchannelId,
          includeChannelSummary:
            canonicalUnreadSummaryIsNeeded(invitationChannelId)
        });
      }
      rememberHandledRealtimeMessage(message);
    }

    function handleLeftChatFromAnotherTab(
      payload: number | { channelId: number }
    ) {
      const channelId =
        typeof payload === 'number' ? payload : payload.channelId;
      markUnreadActivity();
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
      queueGlobalUnreadCountResync();
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
      const currentSubchannelId = Number(subchannelIdRef.current || 0);
      const isForCurrentChannel =
        Number(channelId) === activeChatChannelIdRef.current;
      const isMyMessage = Number(message.userId) === Number(userId);
      const scopeIsActivelyVisible = Boolean(
        isForCurrentChannel &&
        currentPageVisible &&
        usingChatRef.current &&
        currentSubchannelId === 0
      );
      if (!isMyMessage && !scopeIsActivelyVisible) {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId,
          subchannelId: 0,
          includeChannelSummary: canonicalUnreadSummaryIsNeeded(channelId)
        });
      }
      if (isForCurrentChannel) {
        if (!isMyMessage && scopeIsActivelyVisible) {
          void maybeUpdateLastRead({
            channelId,
            lastReadMessageId: message.id
          });
        }
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          currentSubchannelId,
          isMyMessage
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
          usingChat: usingChatRef.current,
          isMyMessage
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
      newMembers
    }: {
      message: any;
      channel: any;
      newMembers: any[];
    }) {
      if (shouldSkipRealtimeMessage(message)) return;
      const currentPageVisible = pageVisibleRef.current;
      const currentSubchannelId = subchannelIdRef.current;
      const messageIsForCurrentChannel =
        Number(message.channelId) === activeChatChannelIdRef.current;
      // Transfer notices are canonical unread activity for both parties, even
      // though the initiating user's ID is stored as the message author.
      const isMyMessage =
        Number(message.userId) === Number(userId) && !message.transferId;
      const messageSubchannelId = Number(message.subchannelId || 0);
      const scopeIsActivelyVisible = Boolean(
        messageIsForCurrentChannel &&
        currentPageVisible &&
        usingChatRef.current &&
        messageSubchannelId === Number(currentSubchannelId || 0)
      );
      if (!isMyMessage && !scopeIsActivelyVisible) {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId: Number(message.channelId),
          subchannelId: messageSubchannelId,
          includeChannelSummary: canonicalUnreadSummaryIsNeeded(
            Number(message.channelId)
          )
        });
      }
      const activityChannel =
        channelsObjRef.current?.[message.channelId] || channel;
      if (activityChannel?.twoPeople) {
        scheduleChatQuickAccessRefresh(message.channelId);
      }
      if (isChessGameMessage(message)) {
        void refreshUnansweredChessShortcut();
      }
      if (!isMyMessage && document.hidden) {
        notifyMessageReceivedWhileAway({
          message,
          channel: activityChannel
        });
      }
      if (messageIsForCurrentChannel) {
        if (!isMyMessage && scopeIsActivelyVisible) {
          void maybeUpdateLastRead({
            channelId: message.channelId,
            subchannelId: message.subchannelId,
            lastReadMessageId: message.id
          });
        }
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          isMyMessage,
          newMembers,
          currentSubchannelId
        });
      }
      if (!messageIsForCurrentChannel && activityChannel) {
        onReceiveMessageOnDifferentChannel({
          message,
          channel: activityChannel,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          isMyMessage,
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
      rememberHandledRealtimeMessage(message);
    }

    function shouldSkipRealtimeMessage(message: any) {
      const messageKey = getRealtimeChatMessageKey(message);
      return Boolean(
        messageKey &&
        (realtimeMessageReplayWindowRef.current.has(message) ||
          hasCanonicalChatMessage({
            channelsObj: channelsObjRef.current,
            message
          }))
      );
    }

    function rememberHandledRealtimeMessage(message: any) {
      realtimeMessageReplayWindowRef.current.remember(message);
    }

    function notifyMessageReceivedWhileAway({
      message,
      channel
    }: {
      message: any;
      channel: any;
    }) {
      const channelObj =
        channelsObjRef.current?.[message.channelId] || channel || {};
      if (
        !shouldShowBackgroundChatMessageNotification({
          channel: channelObj,
          message,
          settings: chatNotificationSettingsRef.current,
          userId
        })
      ) {
        return;
      }
      const senderName = message.username || 'Someone';
      const title =
        channelObj.channelName && !channelObj.twoPeople
          ? `${senderName} in ${channelObj.channelName}`
          : senderName;
      const content =
        typeof message.content === 'string' ? message.content.trim() : '';
      const body = content
        ? content.length > 150
          ? `${content.slice(0, 150)}…`
          : content
        : message.fileName
          ? 'Sent an attachment'
          : 'Sent a message';
      const pathId = channelObj.pathId || channel?.pathId;
      const subchannelPath = message.subchannelId
        ? channelObj.subchannelObj?.[message.subchannelId]?.path
        : null;
      const topicPath = message.subjectId ? `/topic/${message.subjectId}` : '';
      showDesktopNotification({
        title,
        body,
        tag: `chat-${message.channelId}`,
        onClick: pathId
          ? () =>
              navigate(
                `/chat/${pathId}${
                  subchannelPath ? `/${subchannelPath}` : ''
                }${topicPath}`
              )
          : undefined
      });
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
        markUnreadActivity();
        onLeaveChannel({ channelId, userId });
        navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
        socket.emit('confirm_leave_channel', channelId);
        queueGlobalUnreadCountResync();
      }
    }

    function handleMemberJoined({
      channelId,
      member
    }: {
      channelId: number;
      member: { id: number };
    }) {
      const normalizedChannelId = Number(channelId || 0);
      const memberId = Number(member?.id || 0);
      if (!normalizedChannelId || !memberId) return;
      onApplyCanonicalGroupMemberJoin({
        channelId: normalizedChannelId,
        member
      });
      onSetGroupMemberState({
        groupId: normalizedChannelId,
        action: 'add',
        memberId
      });
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
        message.channelId === activeChatChannelIdRef.current;
      const senderIsUser = message.userId === userId;

      if (senderIsUser) return;

      const scopeIsActivelyVisible = Boolean(
        messageIsForCurrentChannel &&
        currentPageVisible &&
        usingChatRef.current &&
        Number(message.subchannelId || 0) ===
          Number(subchannelIdRef.current || 0)
      );
      if (scopeIsActivelyVisible) {
        void maybeUpdateLastRead({
          channelId: message.channelId,
          subchannelId: message.subchannelId,
          lastReadMessageId: message.id
        });
      } else {
        markUnreadActivity();
        queueChannelUnreadStateResync({
          channelId: Number(message.channelId),
          subchannelId: Number(message.subchannelId || 0),
          includeChannelSummary: canonicalUnreadSummaryIsNeeded(
            Number(message.channelId)
          )
        });
      }

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
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          currentSubchannelId: subchannelIdRef.current
        });
      } else {
        onReceiveMessageOnDifferentChannel({
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          message,
          channel: {
            id: channelId,
            pathId,
            channelName,
            isHidden: false
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
      markUnreadActivity();
      queueChannelUnreadStateResync({
        channelId: normalizedChannelId,
        subchannelId: 0,
        includeChannelSummary:
          canonicalUnreadSummaryIsNeeded(normalizedChannelId)
      });
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
          hydrateMessages: true,
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
        const activeVisibleChat =
          normalizedChannelId === activeChatChannelIdRef.current &&
          pageVisibleRef.current;
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
        const canonicalMessageState = buildCanonicalChatMessagePageState({
          messages: canonicalMessages,
          existingMessagesObj: currentChannel.messagesObj,
          messagesHydrated: data.messagesHydrated === true
        });

        if (shouldEnterSelectedChannel) {
          onEnterChannelWithId({ data, userId });
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
                  ...canonicalMessageState
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
                : {})
          }
        });
        if (shouldEnterSelectedChannel && selectedTopicWasHidden) {
          navigate(`/chat/${canonicalChannel.pathId}`);
        }
      } catch (error) {
        console.error(
          'Failed to refresh channel after topic state change:',
          error
        );
      }
    }

    function handleAIThoughtStream({
      channelId,
      messageId,
      thoughtContent,
      isComplete,
      isThinkingHard,
      isDelta
    }: {
      channelId: number;
      messageId: number;
      thoughtContent: string;
      isComplete: boolean;
      isThinkingHard?: boolean;
      isDelta?: boolean;
    }) {
      onUpdateAIThoughtStream({
        channelId,
        messageId,
        thoughtContent,
        isComplete,
        isThinkingHard,
        isDelta
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

    async function refreshChatQuickAccess({
      includeCustom = false
    }: { includeCustom?: boolean } = {}) {
      if (includeCustom) clearScheduledChatQuickAccessRefresh();
      await refreshCanonicalQuickAccess({ automaticOnly: !includeCustom });
    }

    function scheduleChatQuickAccessRefresh(
      channelId: number,
      { force = false }: { force?: boolean } = {}
    ) {
      if (quickAccessModeRef.current !== 'automatic') return;
      if (!force && !automaticQuickAccessOrderCouldChange(channelId)) return;
      const now = Date.now();
      const cooldownRemaining = Math.max(
        0,
        quickAccessLastActivityRefreshAtRef.current +
          QUICK_ACCESS_ACTIVITY_MIN_INTERVAL_MS -
          now
      );
      if (quickAccessRefreshTimerRef.current) {
        clearTimeout(quickAccessRefreshTimerRef.current);
      }
      quickAccessRefreshTimerRef.current = setTimeout(
        flushScheduledChatQuickAccessRefresh,
        Math.max(QUICK_ACCESS_ACTIVITY_DEBOUNCE_MS, cooldownRemaining)
      );
      if (!quickAccessRefreshMaxTimerRef.current) {
        quickAccessRefreshMaxTimerRef.current = setTimeout(
          flushScheduledChatQuickAccessRefresh,
          Math.max(QUICK_ACCESS_ACTIVITY_MAX_WAIT_MS, cooldownRemaining)
        );
      }
    }

    function flushScheduledChatQuickAccessRefresh() {
      clearScheduledChatQuickAccessRefresh();
      quickAccessLastActivityRefreshAtRef.current = Date.now();
      void refreshChatQuickAccess();
    }

    function automaticQuickAccessOrderCouldChange(channelId: number) {
      const partners = quickAccessPartnersRef.current || [];
      const activePartner = partners.find(
        (partner: any) => Number(partner.channelId) === Number(channelId)
      );
      if (!activePartner) return true;
      if (activePartner.isAi) return false;

      const activeFavorited = Number(activePartner.favorited) === 1;
      for (const partner of partners) {
        if (partner.isAi) continue;
        const partnerFavorited = Number(partner.favorited) === 1;
        if (partnerFavorited === activeFavorited) {
          return Number(partner.channelId) !== Number(channelId);
        }
      }
      return true;
    }

    function clearScheduledChatQuickAccessRefresh() {
      if (quickAccessRefreshTimerRef.current) {
        clearTimeout(quickAccessRefreshTimerRef.current);
        quickAccessRefreshTimerRef.current = null;
      }
      if (quickAccessRefreshMaxTimerRef.current) {
        clearTimeout(quickAccessRefreshMaxTimerRef.current);
        quickAccessRefreshMaxTimerRef.current = null;
      }
    }

    function isChessGameMessage(message: any) {
      if (!message?.isChessMsg || message?.omokState) return false;
      if (message.gameType === 'omok') return false;
      if (message.gameType === 'chess') return true;
      const content =
        typeof message.content === 'string'
          ? message.content.toLowerCase()
          : '';
      return !content.includes('omok');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
