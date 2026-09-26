// Some accounts (Zero and Ciel) never show an online, busy or away status, even
// while they're online; the app they're playing still shows. Mikey, 2026-09-26.
//
// These helpers only decide what is DISPLAYED. The raw presence in chat state
// stays intact, so anything that needs the real status can still read it.
// Kept free of imports so node tests can load it; hiddenPresence.ts binds the
// actual user ids.

export interface PresenceFlags {
  isOnline?: boolean;
  isAway?: boolean;
  isBusy?: boolean;
}

export function isPresenceHidden(
  userId: number | string | null | undefined,
  hiddenUserIds: readonly number[]
) {
  const id = Number(userId);
  return (
    Number.isSafeInteger(id) && id > 0 && hiddenUserIds.includes(id)
  );
}

/** The online / away / busy flags to show for a user: all off when hidden. */
export function getDisplayedPresence(
  userId: number | string | null | undefined,
  presence: PresenceFlags | null | undefined,
  hiddenUserIds: readonly number[]
) {
  if (isPresenceHidden(userId, hiddenUserIds)) {
    return { isOnline: false, isAway: false, isBusy: false };
  }
  return {
    isOnline: presence?.isOnline === true,
    isAway: presence?.isAway === true,
    isBusy: presence?.isBusy === true
  };
}

/**
 * Whether the "playing <app>" badge shows. Normally only while online and not
 * away; for hidden accounts whenever they're online, since away isn't shown.
 */
export function isActivityShown({
  userId,
  activity,
  presence,
  hiddenUserIds
}: {
  userId: number | string | null | undefined;
  activity: unknown;
  presence: PresenceFlags | null | undefined;
  hiddenUserIds: readonly number[];
}) {
  if (!activity || presence?.isOnline !== true) return false;
  if (isPresenceHidden(userId, hiddenUserIds)) return true;
  return presence?.isAway !== true;
}
