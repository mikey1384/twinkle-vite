import { useRef } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import {
  getChatUnreadActivityRevision,
  markChatUnreadActivity
} from '~/helpers/chatUnreadActivity';
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
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  function reconcileChannelLastRead(channelId: number) {
    return reconcileLastRead({
      request: () => updateChatLastRead(channelId),
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
    return reconcileLastRead({
      request: () => updateSubchannelLastRead({ channelId, subchannelId }),
      channelId,
      subchannelId
    });
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
      applySidebarState({ requestUserId, unreadState });
      if (getChatUnreadActivityRevision() !== expectedActivityRevision) {
        // Confirmed activity (a new message, deletion, or reaction) landed
        // after the server captured this write's unread snapshot. Applying the
        // older snapshot would silently erase that activity's unread state, so
        // re-read the writer instead.
        await applyFreshUnreadState({ requestUserId, channelId, subchannelId });
        return;
      }
      applyUnreadState({ requestUserId, channelId, unreadState });
    } catch (error) {
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
    subchannelId
  }: {
    requestUserId: number;
    channelId: number;
    subchannelId: number;
  }) {
    for (let attempt = 0; attempt < MAX_FRESH_READ_ATTEMPTS; attempt++) {
      const expectedActivityRevision = getChatUnreadActivityRevision();
      const unreadState = (await loadChatChannelUnreadState({
        channelId,
        subchannelId
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

  return { reconcileChannelLastRead, reconcileSubchannelLastRead };
}
