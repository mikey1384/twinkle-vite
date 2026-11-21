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
  appTitle: string;
  appThumbnailUrl: string | null;
  appAvailable: boolean;
  activity: SocialMomentActivity;
  action: 'play' | 'join';
  lines: Record<string, { headline: string; detail: string }>;
  thumbnailUrl: string | null;
  linkPath: string | null;
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
