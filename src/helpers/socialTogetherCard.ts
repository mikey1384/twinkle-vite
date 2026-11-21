// Words on the shared-moment chat card (SocialTogetherCard.tsx). Kept free
// of app imports so node tests can load it.

export interface SocialTogetherCardData {
  id: number;
  buildId: number;
  appTitle: string;
  appThumbnailUrl: string | null;
  appAvailable: boolean;
  mode: string;
  isGame: boolean;
  text: string;
  thumbnailUrl: string | null;
  linkPath: string | null;
  chips: string[];
  count: number;
  isNewThread: boolean;
  users: Array<{ id: number; username: string; profilePicUrl: string }>;
  seenBy: number[];
  chipBy: number[];
  createdAt: number;
  updatedAt: number;
}

// Reply chips are for breaking the ice, not a permanent fixture.
export const SOCIAL_CHIPS_SHOWN_FOR_SECONDS = 24 * 60 * 60;

// Only on a member's first DM thread ever, once. One line, never a wall of
// rules. Block is in the chat's ⋯ menu; Report is in each message's ⋯ menu.
export const FIRST_CHAT_NOTE =
  'Be kind, and you can always block or report from the ⋯ menus.';

/** A new thread is an introduction; an existing one is a shared memory. */
export function socialCardHeadline({
  card,
  otherName
}: {
  card: Pick<SocialTogetherCardData, 'appTitle' | 'isGame' | 'isNewThread'>;
  otherName: string;
}) {
  if (card.isNewThread) {
    return card.isGame
      ? `You and ${otherName} met over a game of ${card.appTitle}`
      : `You and ${otherName} met in ${card.appTitle}`;
  }
  return card.isGame
    ? `You and ${otherName} played ${card.appTitle}`
    : `You and ${otherName} were in ${card.appTitle} together`;
}

export function socialCardCount(
  card: Pick<SocialTogetherCardData, 'count' | 'isGame'>
) {
  if (card.count < 2) return '';
  return card.isGame ? `${card.count} games today` : `${card.count} times today`;
}

export function socialCardChipsShown({
  card,
  myId,
  canReply,
  chipUsed,
  nowSeconds
}: {
  card: Pick<SocialTogetherCardData, 'chipBy' | 'chips' | 'updatedAt'>;
  myId: number;
  canReply: boolean;
  chipUsed: boolean;
  nowSeconds: number;
}) {
  return (
    canReply &&
    !chipUsed &&
    card.chips.length > 0 &&
    !card.chipBy.includes(myId) &&
    nowSeconds - card.updatedAt < SOCIAL_CHIPS_SHOWN_FOR_SECONDS
  );
}

const chipKey = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/** Chips to show: the card's own, minus any that repeat the button's label
 * ("Rematch?" above a "Rematch" button). */
export function socialCardChipsToShow(
  chips: string[],
  buttonLabel: string | null
) {
  if (!buttonLabel) return chips;
  const label = chipKey(buttonLabel);
  return chips.filter((chip) => chipKey(chip) !== label);
}

export function socialCardButtonLabel(
  card: Pick<SocialTogetherCardData, 'appAvailable' | 'isGame' | 'appTitle'>
) {
  if (!card.appAvailable) return null;
  return card.isGame ? 'Rematch' : `Open ${card.appTitle}`;
}
