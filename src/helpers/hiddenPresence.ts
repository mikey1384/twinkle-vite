import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import {
  getDisplayedPresence as getDisplayedPresenceFor,
  isActivityShown as isActivityShownFor,
  isPresenceHidden as isPresenceHiddenFor,
  type PresenceFlags
} from './presenceVisibility';

// Zero and Ciel: no online / busy / away status anywhere; their app still shows.
export const PRESENCE_HIDDEN_USER_IDS: readonly number[] = [
  ZERO_TWINKLE_ID,
  CIEL_TWINKLE_ID
].filter((id) => Number.isSafeInteger(id) && id > 0);

export function isPresenceHidden(userId: number | string | null | undefined) {
  return isPresenceHiddenFor(userId, PRESENCE_HIDDEN_USER_IDS);
}

export function getDisplayedPresence(
  userId: number | string | null | undefined,
  presence: PresenceFlags | null | undefined
) {
  return getDisplayedPresenceFor(userId, presence, PRESENCE_HIDDEN_USER_IDS);
}

export function isActivityShown(
  userId: number | string | null | undefined,
  activity: unknown,
  presence: PresenceFlags | null | undefined
) {
  return isActivityShownFor({
    userId,
    activity,
    presence,
    hiddenUserIds: PRESENCE_HIDDEN_USER_IDS
  });
}
