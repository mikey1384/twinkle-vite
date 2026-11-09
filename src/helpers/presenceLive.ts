// Presence delivery only to pages that are reading it (twinkle-api
// socket/presenceLive.ts). The server stops sending online/away/busy/activity
// broadcasts to a page that has been hidden, or visible but silent, for a
// minute: a suspended background tab stops reading its socket, the broadcasts
// pile up, and the server disconnects the tab. Chat is unaffected.
//
// Visibility here means the page itself, not window focus: a visible window on
// a second monitor keeps live presence.
export const PRESENCE_LIVE_EVENT = 'set_presence_live';
// Sent when the server starts delivering presence to this page again. The
// broadcasts it skipped are gone, so the page reads a fresh snapshot.
export const PRESENCE_RESYNC_EVENT = 'presence_resync_required';

export function isPresencePageLive() {
  return (
    typeof document === 'undefined' || document.visibilityState === 'visible'
  );
}

// The server's batched answer to a resync (one read per worker per second,
// shared by every page that resumed in that second). It carries what
// check_online_presence and General's check_online_users would return, so a
// resumed page also gets last-seen times for members who went offline while
// it was paused. Advertised by `presenceLive: 1` in the bind acknowledgement;
// without it this page never sends set_presence_live, because an older API
// would count that event as user activity.
export const PRESENCE_RESYNC_SNAPSHOT_EVENT = 'presence_resync_snapshot';
export const PRESENCE_LIVE_PROTOCOL = 1;

export function bindSupportsPresenceLive(result: unknown) {
  return (result as any)?.presenceLive === PRESENCE_LIVE_PROTOCOL;
}

// Freshness: the snapshot is stamped with the moment the resync notice
// arrived. The server left the paused room before sending it, so every live
// event received after that moment is newer and survives the snapshot.
export function planPresenceResyncSnapshot({
  payload,
  pending,
  userId,
  socketBound
}: {
  payload: any;
  pending: { id: number; at: number } | null;
  userId: number;
  socketBound: boolean;
}):
  | { action: 'ignore' }
  | { action: 'read' }
  | {
      action: 'apply';
      requestedAt: number;
      onlineUsers: Record<string, any>;
      isComplete: boolean;
      recentOfflineUsers?: any[];
    } {
  if (
    !pending ||
    !socketBound ||
    !userId ||
    Number(payload?.resyncId || 0) !== pending.id ||
    Number(payload?.userId || 0) !== userId
  ) {
    return { action: 'ignore' };
  }
  const onlineUsers = payload?.onlineUsers;
  if (
    payload?.retry === true ||
    !onlineUsers ||
    typeof onlineUsers !== 'object' ||
    Array.isArray(onlineUsers)
  ) {
    return { action: 'read' };
  }
  return {
    action: 'apply',
    requestedAt: pending.at,
    onlineUsers,
    isComplete: payload.isComplete === true,
    ...(Array.isArray(payload.recentOfflineUsers)
      ? { recentOfflineUsers: payload.recentOfflineUsers }
      : {})
  };
}

// Progress streams (a grammar review's thoughts) skip a paused page. After a
// resync the page has missed some deltas, so appending later ones would show
// garbled text: wait for the next full update instead. Completion updates are
// always full, and the request's own response stays the result.
export function createResyncGapGuard() {
  let missedUpdates = false;
  return {
    markResynced() {
      missedUpdates = true;
    },
    accept(isDelta?: boolean) {
      if (!isDelta) {
        missedUpdates = false;
        return true;
      }
      return !missedUpdates;
    }
  };
}
