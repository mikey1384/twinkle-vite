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
  getRealtimeChatMessageKey,
  hasCanonicalChatMessage
} from '~/helpers/chatRealtimeMessageIdentity';
import {
  getChatUnreadActivityRevision,
  markChatUnreadActivity
} from '~/helpers/chatUnreadActivity';
import useChatQuickAccessRefresh from '~/helpers/hooks/useChatQuickAccessRefresh';
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
  const numUnreads = useChatContext((v) => v.state.numUnreads || 0);
  const chatNotificationSettings = useChatContext(
    (v) => v.state.chatNotificationSettings
  );
  const pageVisible = useViewContext((v) => v.state.pageVisible);

  const channelsObjRef = useRef(channelsObj);
  const onUpdateMyXpRef = useRef(onUpdateMyXp);
  const selectedChannelIdRef = useRef(selectedChannelId);
  const subchannelIdRef = useRef(subchannelId);
  const chatStatusRef = useRef(chatStatus);
  const pageVisibleRef = useRef(pageVisible);
  const quickAccessModeRef = useRef(quickAccessMode);
  const quickAccessPartnersRef = useRef(quickAccessPartners);
  const numUnreadsRef = useRef(numUnreads);
  const chatNotificationSettingsRef = useRef(chatNotificationSettings);
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
  const unreadResyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const channelUnreadResyncQueueRef = useRef(
    new Map<string, { channelId: number; subchannelId: number }>()
  );
  const channelUnreadResyncInFlightRef = useRef(false);
  const channelUnreadResyncTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const recentlyHandledMessageKeysRef = useRef(new Set<string>());

  channelsObjRef.current = channelsObj;
  onUpdateMyXpRef.current = onUpdateMyXp;
  selectedChannelIdRef.current = selectedChannelId;
  subchannelIdRef.current = subchannelId;
  chatStatusRef.current = chatStatus;
  pageVisibleRef.current = pageVisible;
  quickAccessModeRef.current = quickAccessMode;
  quickAccessPartnersRef.current = quickAccessPartners;
  numUnreadsRef.current = numUnreads;
  chatNotificationSettingsRef.current = chatNotificationSettings;

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

  // Reactions can come in bursts. We only need to persist lastRead once per second per
  // channel/subchannel because all relevant timestamps are second-granularity.
  const lastReadWriteSecRef = useRef<{
    channel: Record<number, number>;
    subchannel: Record<number, number>;
  }>({ channel: {}, subchannel: {} });

  useEffect(() => {
    const unreadResyncGeneration = ++unreadResyncGenerationRef.current;
    const channelUnreadResyncQueue = channelUnreadResyncQueueRef.current;
    // Reset throttle state when user changes. The unread-activity revision is
    // a monotonic module counter shared with the other last-read reconcilers
    // and is never reset; equality snapshots stay valid across user changes.
    lastReadWriteSecRef.current = { channel: {}, subchannel: {} };
    unreadResyncQueuedRef.current = false;
    unreadResyncInFlightRef.current = false;
    channelUnreadResyncQueue.clear();
    channelUnreadResyncInFlightRef.current = false;

    function markUnreadActivity() {
      markChatUnreadActivity();
      if (unreadResyncQueuedRef.current && unreadResyncTimerRef.current) {
        clearTimeout(unreadResyncTimerRef.current);
        unreadResyncTimerRef.current = null;
        queueGlobalUnreadCountResync(UNREAD_RESYNC_RETRY_DELAY_MS);
      }
    }

    async function maybeUpdateLastRead({
      channelId,
      subchannelId
    }: {
      channelId: number;
      subchannelId?: number | null;
    }) {
      const nowSec = Math.floor(Date.now() / 1000);
      const normalizedSubchannelId = Number(subchannelId || 0);
      const shouldUpdateMain =
        channelId > 0 &&
        normalizedSubchannelId === 0 &&
        lastReadWriteSecRef.current.channel[channelId] !== nowSec;
      const shouldUpdateSubchannel = Boolean(
        normalizedSubchannelId > 0 &&
          lastReadWriteSecRef.current.subchannel[normalizedSubchannelId] !==
            nowSec
      );
      if (!shouldUpdateMain && !shouldUpdateSubchannel) return;

      // A canonical read mutation changes the basis of every unread snapshot,
      // independently of message/reaction activity. Invalidate older reads at
      // request start, then apply only the server-returned read watermark.
      markUnreadActivity();
      const reconciliations: Promise<void>[] = [];
      if (shouldUpdateMain) {
        lastReadWriteSecRef.current.channel[channelId] = nowSec;
        reconciliations.push(
          reconcileCanonicalLastRead({
            request: updateChatLastRead(channelId),
            channelId,
            subchannelId: 0
          })
        );
      }
      if (shouldUpdateSubchannel) {
        lastReadWriteSecRef.current.subchannel[normalizedSubchannelId] = nowSec;
        reconciliations.push(
          reconcileCanonicalLastRead({
            request: updateSubchannelLastRead({
              channelId,
              subchannelId: normalizedSubchannelId
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
        if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
          // A confirmed socket event landed after the writer snapshotted this
          // write. Applying the older snapshot would erase that event's
          // unread state (a plain message does not advance the reaction
          // revision the reducer checks); re-read the writer instead, like
          // the queued resync paths below.
          queueChannelUnreadStateResync({ channelId, subchannelId });
          return;
        }
        if (unreadState?.channel) {
          onApplyCanonicalChannelUnreadState({ unreadState, userId });
        }
      } catch (error) {
        // The write may have committed before transport failed. Re-read the
        // writer instead of guessing whether the scope is now read.
        queueChannelUnreadStateResync({ channelId, subchannelId });
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
    socket.on('chat_reaction_added', handleLegacyChatReactionAdded);
    socket.on('chat_reaction_removed', handleLegacyChatReactionRemoved);
    socket.on('chat_reaction_updated', handleChatReactionUpdate);
    socket.on('chat_sidebar_state_updated', handleChatSidebarStateUpdate);
    socket.on('chat_subject_purchased', onEnableChatSubject);
    socket.on('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
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
      socket.off('chat_reaction_added', handleLegacyChatReactionAdded);
      socket.off('chat_reaction_removed', handleLegacyChatReactionRemoved);
      socket.off('chat_reaction_updated', handleChatReactionUpdate);
      socket.off('chat_sidebar_state_updated', handleChatSidebarStateUpdate);
      socket.off('chat_subject_purchased', onEnableChatSubject);
      socket.off('left_chat_from_another_tab', handleLeftChatFromAnotherTab);
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
          subchannelId: Number(payload?.subchannelId || 0)
        });
        queueGlobalUnreadCountResync();
      }
    }

    function handleMemberLeftUnreadState({
      channelId
    }: {
      channelId: number;
    }) {
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
        subchannelId: 0
      });
      queueGlobalUnreadCountResync();
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
      markUnreadActivity();
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

      const reactionScopeIsVisibleToViewer =
        reactorId !== userId &&
        reactionIsForCurrentChannel &&
        usingChatRef.current &&
        reactionIsForCurrentSubchannel;
      const reactionIsVisibleToViewer =
        mutation === 'add' && reactionScopeIsVisibleToViewer;

      // Keep server unread state consistent: if the viewer is currently seeing the reaction,
      // advance lastRead so it doesn't show up as unread after refresh/other device.
      const lastReadReconciliation = reactionIsVisibleToViewer
        ? maybeUpdateLastRead({ channelId, subchannelId })
        : null;

      // Update channel preview state for DM reactions.
      // Only increment unread counts if the viewer isn't already seeing the reaction.
      const shouldIncrementUnreads =
        !requiresSidebarResync &&
        mutation === 'add' &&
        reactorId !== userId &&
        !(
          reactionIsForCurrentChannel &&
          usingChatRef.current &&
          reactionIsForCurrentSubchannel
        );

      onApplyCanonicalChatReaction({
        update,
        ownerUserId: userId,
        pageVisible: currentPageVisible,
        usingChat: usingChatRef.current,
        shouldIncrementUnreads
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
        if (isDirectMessage !== false) {
          queueChannelUnreadStateResync({ channelId, subchannelId });
          if (reactorId !== userId) queueGlobalUnreadCountResync();
        }
        return;
      }
      if (lastReadReconciliation) void lastReadReconciliation;
      if (mutation !== 'remove' || !update.channelActivity?.changed) return;

      const removalCouldAffectGlobalUnreads =
        isDirectMessage !== false &&
        reactorId !== userId &&
        !reactionScopeIsVisibleToViewer;
      if (!removalCouldAffectGlobalUnreads) return;
      queueChannelUnreadStateResync({ channelId, subchannelId });
      queueGlobalUnreadCountResync();
    }

    function queueChannelUnreadStateResync(
      {
        channelId,
        subchannelId = 0
      }: {
        channelId: number;
        subchannelId?: number;
      },
      delayMs = 0
    ) {
      const normalizedSubchannelId = Number(subchannelId || 0);
      const key = `${Number(channelId)}:${normalizedSubchannelId}`;
      channelUnreadResyncQueueRef.current.set(key, {
        channelId: Number(channelId),
        subchannelId: normalizedSubchannelId
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
        const unreadState = (await loadChatChannelUnreadState(
          scope
        )) as CanonicalChatChannelUnreadState;
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
          channelUnreadResyncQueueRef.current.set(key, scope);
        } else if (
          Number(unreadState?.channelId || 0) === scope.channelId &&
          unreadState?.channel
        ) {
          onApplyCanonicalChannelUnreadState({ unreadState, userId });
        }
      } catch (error) {
        // Preserve the last confirmed state on failure. Reconnect bootstrap is
        // the fallback source of truth; never guess a replacement unread value.
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
                UNREAD_RESYNC_RETRY_DELAY_MS
              );
            }
          }
        }
      }
    }

    function queueGlobalUnreadCountResync(delayMs = 0) {
      unreadResyncQueuedRef.current = true;
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
      const expectedNumUnreads = numUnreadsRef.current;
      try {
        const numUnreads = await getNumberOfUnreadMessages({
          fromWriter: true
        });
        if (unreadResyncGenerationRef.current !== unreadResyncGeneration) {
          return;
        }
        if (
          getChatUnreadActivityRevision() !== expectedActivityRevision ||
          numUnreadsRef.current !== expectedNumUnreads
        ) {
          // A confirmed socket event landed after the writer snapshot. Debounce
          // a fresh read instead of replacing that event or hammering the
          // writer while a conversation is busy.
          unreadResyncQueuedRef.current = true;
        } else if (typeof numUnreads === 'number' && !isNaN(numUnreads)) {
          onGetNumberOfUnreadMessages(numUnreads);
        }
      } catch (error) {
        // Leave the counter as-is on failure; the next connect resyncs it.
        console.error('Failed to resync unread count:', error);
      } finally {
        if (unreadResyncGenerationRef.current === unreadResyncGeneration) {
          unreadResyncInFlightRef.current = false;
          if (unreadResyncQueuedRef.current) {
            queueGlobalUnreadCountResync(UNREAD_RESYNC_RETRY_DELAY_MS);
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
      markUnreadActivity();
      let isDuplicate = false;
      // New servers include the writer-backed envelope. The fallback keeps a
      // rolling deployment correct without locally synthesizing metadata.
      if (isTwoPeople && !quickAccess) {
        void refreshChatQuickAccess({ includeCustom: true });
      }
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
      markUnreadActivity();
      const currentPageVisible = pageVisibleRef.current;
      const currentSubchannelId = Number(subchannelIdRef.current || 0);
      const isForCurrentChannel =
        Number(channelId) === activeChatChannelIdRef.current;
      if (isForCurrentChannel) {
        if (usingChatRef.current && currentSubchannelId === 0) {
          void maybeUpdateLastRead({ channelId });
        }
        onReceiveMessage({
          message,
          pageVisible: currentPageVisible,
          usingChat: usingChatRef.current,
          currentSubchannelId,
          isMyMessage: Number(message.userId) === Number(userId)
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
          isMyMessage: Number(message.userId) === Number(userId)
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
      markUnreadActivity();
      const currentPageVisible = pageVisibleRef.current;
      const currentSubchannelId = subchannelIdRef.current;
      const messageIsForCurrentChannel =
        Number(message.channelId) === activeChatChannelIdRef.current;
      // Transfer notices are canonical unread activity for both parties, even
      // though the initiating user's ID is stored as the message author.
      const isMyMessage =
        Number(message.userId) === Number(userId) && !message.transferId;
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
        if (usingChatRef.current) {
          if (
            Number(message.subchannelId || 0) ===
            Number(currentSubchannelId || 0)
          ) {
            void maybeUpdateLastRead({
              channelId: message.channelId,
              subchannelId: message.subchannelId
            });
          }
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
          (recentlyHandledMessageKeysRef.current.has(messageKey) ||
            hasCanonicalChatMessage({
              channelsObj: channelsObjRef.current,
              message
            }))
      );
    }

    function rememberHandledRealtimeMessage(message: any) {
      const messageKey = getRealtimeChatMessageKey(message);
      if (!messageKey) return;
      const recentlyHandledMessageKeys = recentlyHandledMessageKeysRef.current;
      recentlyHandledMessageKeys.add(messageKey);
      if (recentlyHandledMessageKeys.size <= 1000) return;
      const oldestMessageKey = recentlyHandledMessageKeys.values().next().value;
      if (oldestMessageKey) {
        recentlyHandledMessageKeys.delete(oldestMessageKey);
      }
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
      markUnreadActivity();
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
      markUnreadActivity();
      const currentPageVisible = pageVisibleRef.current;
      const messageIsForCurrentChannel =
        message.channelId === activeChatChannelIdRef.current;
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
        if (usingChatRef.current) {
          if (
            Number(message.subchannelId || 0) ===
            Number(subchannelIdRef.current || 0)
          ) {
            void maybeUpdateLastRead({
              channelId: message.channelId,
              subchannelId: message.subchannelId
            });
          }
        }
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
