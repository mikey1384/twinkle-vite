// The shared-moment notice (SocialTogetherCard.tsx). Kept free of app
// imports so node tests can load it.
//
// Every sentence on the notice comes from the server's fixed templates
// (twinkle-api controllers/build/services/socialMoments.ts), already worded
// for each member in `lines`. The website adds only its own labels below.

export type SocialMomentActivity =
  | 'played'
  | 'built'
  | 'drew'
  | 'made'
  | 'studied'
  | 'explored';

export interface SocialTogetherCardData {
  id: number;
  buildId: number;
  revision: number;
  // The app's title and published cover as this revision showed them (the
  // server stores them with the revision, and a report snapshots the same).
  appTitle: string;
  appThumbnailUrl: string | null;
  appAvailable: boolean;
  activity: SocialMomentActivity;
  action: 'play' | 'join';
  lines: Record<string, { headline: string; detail: string }>;
  count: number;
  isNewThread: boolean;
  users: Array<{ id: number; username: string; profilePicUrl: string }>;
  seenBy: number[];
  createdAt: number;
  updatedAt: number;
}

// Only on a member's first DM thread ever, once. One line, never a wall of
// rules. Report is on the notice; Block is in the chat's ⋯ menu.
export const FIRST_CHAT_NOTE =
  'Be kind, and you can always block or report from the ⋯ menus.';

const BANNERS: Record<SocialMomentActivity, string> = {
  played: 'Played together',
  built: 'Built together',
  drew: 'Drew together',
  made: 'Made something together',
  studied: 'Studied together',
  explored: 'Explored together'
};

export function socialCardBanner(activity: SocialMomentActivity) {
  return BANNERS[activity] || 'Together';
}

/** What the viewer reads: Twinkle's sentence for their side, or nothing. */
export function socialCardLines(card: SocialTogetherCardData, myId: number) {
  return card.lines?.[String(myId)] || null;
}

/** Play again for a game, Join again for anything else; none once the app
 * is gone. */
export function socialCardActionLabel(
  card: Pick<SocialTogetherCardData, 'appAvailable' | 'action'>
) {
  if (!card.appAvailable) return null;
  return card.action === 'play' ? 'Play again' : 'Join again';
}

/** The chat list's one line for the notice, from Twinkle's stored plain line
 * ("and KenGo played Baduk together"). */
export function socialCardPreview(content: string) {
  const match = /\s(played|built|drew|made|studied|explored)\s(.+)$/.exec(
    String(content || '')
  );
  return match ? `You ${match[1]} ${match[2]}` : 'You did something together in an app';
}

// ---- live updates: the newest revision wins ---------------------------------
//
// A notice arrives as a new chat message (the creation relay) and changes in
// place through social_together_updated. The two relays are separate and can
// arrive in either order: an update for revision 2 can come before the row
// itself, which still carries revision 1. So every copy is merged by
// revision (an older one never replaces a newer one), and an update that
// finds no row yet is kept here until the row arrives.

type CardLike = { id?: number; revision?: number } | null | undefined;

/** The newer of two copies of the same notice; the incoming one on a tie. */
export function newestSocialTogetherCard<T extends CardLike>(previous: T | CardLike, incoming: T): T {
  if (
    previous &&
    incoming &&
    Number(previous.id) === Number(incoming.id) &&
    Number(previous.revision || 0) > Number(incoming.revision || 0)
  ) {
    return previous as T;
  }
  return incoming;
}

const LATEST_LIMIT = 200;
const latestCards = new Map<number, SocialTogetherCardData>();

/** Keep the newest copy of a notice seen in a live update. */
export function rememberSocialTogetherCard(card: SocialTogetherCardData | null | undefined) {
  const id = Number(card?.id || 0);
  if (!card || !id) return;
  const newest = newestSocialTogetherCard(latestCards.get(id), card);
  latestCards.delete(id);
  latestCards.set(id, newest);
  while (latestCards.size > LATEST_LIMIT) {
    const oldest = latestCards.keys().next().value;
    if (oldest === undefined) break;
    latestCards.delete(oldest);
  }
}

export function forgetSocialTogetherCards() {
  latestCards.clear();
}

/** The newest known copy of this notice (read only). */
export function newestKnownSocialTogetherCard<T extends SocialTogetherCardData | null | undefined>(
  card: T
): T {
  if (!card?.id) return card;
  return newestSocialTogetherCard(latestCards.get(Number(card.id)) as any, card);
}

/**
 * A notice message arriving (live or loaded): if a newer revision of its
 * card came in first, show that one instead of the copy the row carries.
 * Returns the same object when nothing changes.
 */
export function withNewestSocialTogetherCard<M extends { rootType?: string; settings?: any }>(
  message: M
): M {
  if (!message || message.rootType !== 'socialTogether') return message;
  let settings = message.settings;
  if (typeof settings === 'string') {
    try {
      settings = JSON.parse(settings);
    } catch {
      return message;
    }
  }
  const card = settings?.socialTogether as SocialTogetherCardData | undefined;
  if (!card?.id) return message;
  const newest = newestSocialTogetherCard(latestCards.get(Number(card.id)), card);
  rememberSocialTogetherCard(newest);
  if (newest === card) return message;
  return { ...message, settings: { ...settings, socialTogether: newest } };
}
