import { activityFromSnapshot } from '~/helpers/userActivity';

// Presence snapshots for the app-wide chatStatus map.
//
// Two kinds of snapshot reach the reducer and they are not interchangeable:
// check_online_presence returns everyone online (the general chatroom holds
// every bound socket) and is therefore authoritative about who is offline,
// while check_online_users is scoped to one channel's members and can only ever
// add information.
//
// Both are asynchronous reads of a moving target. The server's room read can
// take seconds (the cluster fetch alone allows 16), and online_status_changed
// broadcasts keep arriving on the same socket meanwhile, so an ack can describe
// a world that is already out of date. The rule that keeps a snapshot from
// undoing fresher truth: presence flags touched after the snapshot request keep
// their newer values. Activity has its own freshness stamps, so a busy/away
// update cannot prevent a snapshot from clearing an older activity cache.
// statusUpdatedAt and requestedAt both come from the same client clock.
//
// Single source of truth: online_status_changed owns lastActive. A snapshot
// only states who is online; it never overwrites offline timestamps or drops
// away/busy flags the server did not restate.
export const PRESENCE_EVENT_STAMP_KEY = 'statusUpdatedAt';

export function stampPresenceEntry(entry: Record<string, any>) {
  return { ...entry, [PRESENCE_EVENT_STAMP_KEY]: Date.now() };
}

// A snapshot's own freshness is the moment it was asked for, not the moment it
// came back, so entries it applies are stamped with requestedAt. Without a
// stamp these entries look infinitely old, and two snapshots in flight at once
// — which is now the normal case, since binding the socket asks for app-wide
// presence while opening a channel asks for that channel's — let the slower,
// older one overwrite the newer one's work: users just reconciled offline come
// back, and members just seen online go dark.
function stampPresenceSnapshotEntry(
  entry: Record<string, any>,
  requestedAt: number
) {
  if (!requestedAt) return entry;
  return { ...entry, [PRESENCE_EVENT_STAMP_KEY]: requestedAt };
}

function isNewerThanSnapshot(entry: any, requestedAt: number) {
  if (!entry || !requestedAt) return false;
  const stamp = Number(entry[PRESENCE_EVENT_STAMP_KEY] || 0);
  return stamp > requestedAt;
}

export function applyPresenceSnapshot({
  chatStatus,
  onlineUsers,
  requestedAt,
  reconcileOffline
}: {
  chatStatus: Record<string, any>;
  onlineUsers: Record<string, any>;
  // Client timestamp taken right before the request was emitted.
  requestedAt: number;
  // Only a complete app-wide snapshot may treat absence as evidence of being
  // offline. A channel-scoped one covers a single channel's members.
  reconcileOffline: boolean;
}) {
  const mergedStatus: Record<string, any> = { ...chatStatus };

  for (const uid of Object.keys(onlineUsers)) {
    const userId = Number(uid);
    const prev = mergedStatus[userId] || {};
    const member = onlineUsers[uid] || {};
    if (isNewerThanSnapshot(prev, requestedAt)) {
      if (prev.isOnline !== false) {
        mergedStatus[userId] = {
          ...prev,
          ...activityFromSnapshot(prev, member, requestedAt)
        };
      }
      continue;
    }
    mergedStatus[userId] = stampPresenceSnapshotEntry(
      {
        ...prev,
        ...member,
        ...activityFromSnapshot(prev, member, requestedAt),
        id: userId,
        isOnline: true,
        ...(typeof member.isAway === 'boolean'
          ? { isAway: member.isAway }
          : typeof prev.isAway === 'boolean'
            ? { isAway: prev.isAway }
            : {}),
        ...(typeof member.isBusy === 'boolean'
          ? { isBusy: member.isBusy }
          : typeof prev.isBusy === 'boolean'
            ? { isBusy: prev.isBusy }
            : {})
      },
      requestedAt
    );
  }

  if (!reconcileOffline) return mergedStatus;

  // Anyone still shown as online whom a complete snapshot does not list is
  // reconciled to offline - that is how a user who went offline while this tab
  // was disconnected (their online_status_changed never arrived) stops being
  // shown as online after the reconnect.
  for (const key of Object.keys(mergedStatus)) {
    if (onlineUsers[key]) continue;
    const entry = mergedStatus[key];
    if (!entry?.isOnline) continue;
    if (isNewerThanSnapshot(entry, requestedAt)) continue;
    // lastActive stays untouched: online_status_changed owns it, and this
    // snapshot carries no timestamp to replace it with.
    mergedStatus[key] = stampPresenceSnapshotEntry(
      {
        ...entry,
        isOnline: false,
        activity: null,
        activityUpdatedAt: requestedAt
      },
      requestedAt
    );
  }
  return mergedStatus;
}
