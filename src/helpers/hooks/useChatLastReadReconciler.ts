import { useRef } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import {
  getChatUnreadActivityRevision,
  markChatUnreadActivity
} from '~/helpers/chatUnreadActivity';
import { getVisibleChatReadMessageId } from '~/helpers/chatReadCursor';
import type { CanonicalChatChannelUnreadState } from '~/types/chat';

const MAX_FRESH_READ_ATTEMPTS = 3;

export default function useChatLastReadReconciler() {
  const userId = useKeyContext((v) => v.myState.userId);
  const updateChatLastRead = useAppContext(
    (v) => v.requestHelpers.updateChatLastRead
  );
  const updateSubchannelLastRead = useAppContext(
    (v) => v.requestHelpers.updateSubchannelLastRead
  );
  const loadChatChannelUnreadState = useAppContext(
    (v) => v.requestHelpers.loadChatChannelUnreadState
  );
  const onApplyCanonicalChannelUnreadState = useChatContext(
    (v) => v.actions.onApplyCanonicalChannelUnreadState
  );
  const onApplyCanonicalChatSidebarState = useChatContext(
    (v) => v.actions.onApplyCanonicalChatSidebarState
  );
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const userIdRef = useRef(userId);
  const channelsObjRef = useRef(channelsObj);
  userIdRef.current = userId;
  channelsObjRef.current = channelsObj;

  function getVisibleReadMessageId({
    channelId,
    subchannelId,
    confirmedMessage
  }: {
    channelId: number;
    subchannelId: number;
    confirmedMessage?: unknown;
  }) {
    const channel = channelsObjRef.current?.[channelId];
    const scope = subchannelId
      ? channel?.subchannelObj?.[subchannelId]
      : channel;
    return getVisibleChatReadMessageId({
      channelId,
      confirmedMessage,
      subchannelId,
      visibleMessageIds: scope?.messageIds,
      visibleMessagesObj: scope?.messagesObj
    });
  }

  function reconcileChannelLastRead(
    channelId: number,
    confirmedMessage?: unknown
  ) {
    const lastReadMessageId = getVisibleReadMessageId({
      channelId,
      subchannelId: 0,
      confirmedMessage
    });
    return reconcileLastRead({
      request: () => updateChatLastRead({ channelId, lastReadMessageId }),
      channelId,
      subchannelId: 0
    });
  }

  function reconcileSubchannelLastRead({
    channelId,
    subchannelId
  }: {
    channelId: number;
    subchannelId: number;
  }) {
    const lastReadMessageId = getVisibleReadMessageId({
      channelId,
      subchannelId
    });
    return reconcileLastRead({
      request: () =>
        updateSubchannelLastRead({
          channelId,
          subchannelId,
          lastReadMessageId
        }),
      channelId,
      subchannelId
    });
  }

  async function reconcileChannelUnreadActivity({
    channelId,
    subchannelId = 0,
    includeChannelSummary = false
  }: {
    channelId: number;
    subchannelId?: number;
    includeChannelSummary?: boolean;
  }) {
    const requestUserId = Number(userIdRef.current || 0);
    if (requestUserId <= 0 || !(channelId > 0)) return;
    // A socket event proves activity, but not its recipient-specific unread
    // projection. The channel endpoint returns its scope and the global alert
    // from one writer snapshot, so neither can advance without the other.
    markChatUnreadActivity();
    try {
      await applyFreshUnreadState({
        requestUserId,
        channelId,
        subchannelId,
        includeChannelSummary
      });
    } catch (error) {
      console.error('Failed to re-read chat unread activity:', error);
    }
  }

  async function reconcileLastRead({
    request,
    channelId,
    subchannelId
  }: {
    request: () => Promise<CanonicalChatChannelUnreadState>;
    channelId: number;
    subchannelId: number;
  }) {
    const requestUserId = Number(userIdRef.current || 0);
    if (requestUserId <= 0 || !(channelId > 0)) return;
    // The write changes the canonical read watermark. Invalidate snapshots
    // that were already in flight before starting it, then use the advanced
    // revision to validate this write's own canonical response.
    markChatUnreadActivity();
    const expectedActivityRevision = getChatUnreadActivityRevision();
    try {
      const unreadState = await request();
      const activityRaced =
        getChatUnreadActivityRevision() !== expectedActivityRevision;
      // Invalidate global unread reads that began after this mutation started
      // but before its canonical response proved the write had finished.
      markChatUnreadActivity();
      applySidebarState({ requestUserId, unreadState });
      if (activityRaced) {
        // Confirmed activity (a new message, deletion, or reaction) landed
        // after the server captured this write's unread snapshot. Applying the
        // older snapshot would silently erase that activity's unread state, so
        // re-read the writer instead.
        await applyFreshUnreadState({ requestUserId, channelId, subchannelId });
        return;
      }
      applyUnreadState({ requestUserId, channelId, unreadState });
    } catch (error) {
      // The transport outcome is unknown, so invalidate global reads that may
      // have started while the write was in flight before re-reading either
      // projection from the writer.
      markChatUnreadActivity();
      console.error('Failed to reconcile chat read state:', error);
      // The write may have committed before transport failed. Re-read the
      // writer instead of guessing whether the scope is now read.
      try {
        await applyFreshUnreadState({ requestUserId, channelId, subchannelId });
      } catch (readError) {
        // Leave the last confirmed state; reconnect bootstrap is the fallback
        // source of truth.
        console.error('Failed to re-read chat unread state:', readError);
      }
    }
  }

  async function applyFreshUnreadState({
    requestUserId,
    channelId,
    subchannelId,
    includeChannelSummary = false
  }: {
    requestUserId: number;
    channelId: number;
    subchannelId: number;
    includeChannelSummary?: boolean;
  }) {
    for (let attempt = 0; attempt < MAX_FRESH_READ_ATTEMPTS; attempt++) {
      const expectedActivityRevision = getChatUnreadActivityRevision();
      const unreadState = (await loadChatChannelUnreadState({
        channelId,
        subchannelId,
        includeChannelSummary
      })) as CanonicalChatChannelUnreadState;
      if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
        continue;
      }
      applySidebarState({ requestUserId, unreadState });
      applyUnreadState({ requestUserId, channelId, unreadState });
      return;
    }
    // Repeatedly raced by live activity. Leave the last confirmed state; the
    // next canonical read or reconnect bootstrap resynchronizes the scope.
  }

  function applyUnreadState({
    requestUserId,
    channelId,
    unreadState
  }: {
    requestUserId: number;
    channelId: number;
    unreadState: CanonicalChatChannelUnreadState;
  }) {
    if (
      unreadState?.channel &&
      Number(unreadState.channelId || 0) === channelId
    ) {
      onApplyCanonicalChannelUnreadState({
        unreadState,
        userId: requestUserId
      });
    }
  }

  function applySidebarState({
    requestUserId,
    unreadState
  }: {
    requestUserId: number;
    unreadState: CanonicalChatChannelUnreadState;
  }) {
    if (!unreadState?.channelVisibility && !unreadState?.quickAccess) return;
    onApplyCanonicalChatSidebarState({
      channelVisibility: unreadState.channelVisibility,
      quickAccess: unreadState.quickAccess,
      userId: requestUserId
    });
  }

  return {
    reconcileChannelLastRead,
    reconcileSubchannelLastRead,
    reconcileChannelUnreadActivity
  };
}
