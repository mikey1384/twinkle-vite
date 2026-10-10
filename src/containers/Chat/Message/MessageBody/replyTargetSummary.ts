import {
  CHAT_MESSAGE_KIND_RULES,
  getChatMessageKind,
  type ChatMessageKind
} from '~/helpers/chatMessageCapabilities';
import { normalizeAICardOfferMessagePayload } from '~/helpers/aiCardOfferNotice';
import { normalizeBundle } from '~/containers/Chat/Trade/helpers/terms';
import { getTradeStatus } from '~/containers/Chat/Trade/helpers/status';
import { getBuildCardTargetSummary } from './BuildCardTargetSummary';
import { parseMessageSettings } from './messageSettings';

export interface ReplyTargetSummary {
  icon: string;
  label: string;
  detail?: string;
  thumbUrl?: string;
  // Filled in by a component that reads more data with the viewer's own
  // access (the moderation notice reads the removed post the same way the
  // notice itself does).
  moderationId?: number;
}

export interface ReplyTargetSummaryContext {
  myId: number;
  usernameOf?: (userId: number) => string | undefined;
  tradeOutcome?: (transactionId: number) => {
    isAccepted?: boolean;
    cancelReason?: string | null;
  };
  aiCardOfferStatus?: (offerId: number) => string | undefined;
}

// How each kind of chat message shows up when it is quoted: in the reply
// composer, and inside the sent reply. Every kind has an entry, and the
// entry agrees with CHAT_MESSAGE_KIND_RULES (test/chatReplyTargets.test.ts):
//   'content'  — the message's own text/file (a member's message)
//   'wordle'   — the Wordle quote renderer
//   'buildCard'— the live Build card (or its summary as a fallback)
//   summarize  — a compact one/two-line summary
//   'notReplyable' — the kind cannot be quoted (reason in the rules table)
type ReplyTargetEntry =
  | 'content'
  | 'wordle'
  | 'buildCard'
  | 'notReplyable'
  | ((
      message: any,
      context: ReplyTargetSummaryContext
    ) => ReplyTargetSummary | null);

export const REPLY_TARGET_ENTRIES: Record<ChatMessageKind, ReplyTargetEntry> = {
  message: 'content',
  wordleResult: 'wordle',
  buildCard: 'buildCard',
  tradeOffer: summarizeTrade,
  tradeNotice: 'notReplyable',
  cardTransfer: summarizeCardTransfer,
  aiCardOffer: summarizeAICardOffer,
  gameResult: summarizeGameResult,
  drawOffer: (message, context) => ({
    icon: 'chess',
    label: `${nameOf(message.userId, message.username, context, true)} offered a draw`
  }),
  chessBoard: 'notReplyable',
  omokBoard: 'notReplyable',
  groupInvitation: (message) => ({
    icon: 'users',
    label: 'Group chat invitation',
    detail: textOf(message.content)
  }),
  approvalRequest: () => ({
    // The request's details (a birth date, for one) stay on the card.
    icon: 'user-check',
    label: 'Approval request'
  }),
  moderationNotice: (message) => ({
    icon: 'user-shield',
    label: 'Moderator action',
    moderationId: Number(message.rootId || 0) || undefined
  }),
  adminMessage: 'content',
  ownerAlert: 'notReplyable',
  meetupTeacherRequest: (message, context) =>
    summarizeTeacherRequest(message, context),
  meetupQuestCard: (message) => ({
    icon: 'users',
    label:
      message.rootType === 'meetupQuestInvite'
        ? 'Bridge Builder crew invitation'
        : message.rootType === 'meetupQuestSlot'
          ? 'Bridge Builder meetup slot'
          : message.rootType === 'meetupStory'
            ? 'Bridge Builder story'
            : 'Bridge Builder crew plan',
    detail: textOf(message.content)
  }),
  crewChatCard: (message) => ({
    icon: 'users',
    label: 'Bridge Builder crew chat',
    detail: textOf(message.content)
  }),
  callLog: 'notReplyable',
  systemNotice: 'notReplyable'
};

export function getReplyTargetEntry(message: any): ReplyTargetEntry {
  const kind = getChatMessageKind(message || {});
  // A kind that cannot be quoted still renders as its text if an old reply
  // ever points at it.
  return CHAT_MESSAGE_KIND_RULES[kind].interactive
    ? REPLY_TARGET_ENTRIES[kind]
    : 'content';
}

export function getReplyTargetSummary(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary | null {
  if (!message) return null;
  const entry = getReplyTargetEntry(message);
  if (entry === 'buildCard') return getBuildCardTargetSummary(message);
  if (typeof entry !== 'function') return null;
  return entry(message, context);
}

function summarizeTrade(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary | null {
  const transaction = message.transactionDetails;
  if (!transaction?.id) {
    return {
      icon: 'exchange-alt',
      label: `Trade #${Number(message.transactionId) || ''}`.trim()
    };
  }
  const outcome = context.tradeOutcome?.(Number(transaction.id)) || {};
  const { label } = getTradeStatus({
    transaction,
    viewerId: context.myId,
    isAccepted: !!outcome.isAccepted || !!transaction.isAccepted,
    isCancelled: !!outcome.cancelReason || !!transaction.isCancelled,
    cancelReason: outcome.cancelReason || transaction.cancelReason
  });
  const from = nameOf(transaction.from, message.username, context, false);
  const to = nameOf(transaction.to, undefined, context, false);
  const offer = countBundle(transaction.offer);
  const want = countBundle(transaction.want);
  const items =
    transaction.type === 'trade'
      ? `${offer || 'nothing'} ↔ ${want || 'nothing'}`
      : offer || 'nothing';
  return {
    icon:
      transaction.type === 'send'
        ? 'gift'
        : transaction.type === 'show'
          ? 'eye'
          : 'exchange-alt',
    label: `${label} #${transaction.id}`,
    detail: `${from} → ${to} · ${items}`
  };
}

function summarizeCardTransfer(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary {
  const transfer = message.transferDetails || {};
  const cardId = Number(transfer.card?.id || transfer.cardId || 0);
  const card = cardId ? `Card #${cardId}` : 'An AI card';
  const isPurchase = !!transfer.askId;
  const isSale = !!transfer.offerId;
  const price = Number(
    (isPurchase ? transfer.ask?.price : transfer.offer?.price) || 0
  );
  const buyer = nameOf(transfer.to, undefined, context, true);
  const seller = nameOf(transfer.from, undefined, context, true);
  return {
    icon: 'cards-blank',
    label:
      isPurchase || isSale
        ? `${buyer} bought ${card} from ${lower(seller)}`
        : `${card} changed owners`,
    detail: price ? `${price.toLocaleString('en-US')} coins` : undefined
  };
}

function summarizeAICardOffer(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary {
  const offer = normalizeAICardOfferMessagePayload(
    parseMessageSettings(message.settings)?.aiCardOffer
  );
  if (!offer) return { icon: 'cards-blank', label: 'AI card offer' };
  const status = context.aiCardOfferStatus?.(offer.offerId) || offer.status;
  return {
    icon: 'cards-blank',
    label: `${nameOf(offer.offererId, message.username, context, true)} offered ${offer.price.toLocaleString('en-US')} coins for Card #${offer.cardId}`,
    detail:
      status === 'accepted'
        ? 'Accepted'
        : status === 'withdrawn'
          ? 'Withdrawn'
          : 'Open offer'
  };
}

function summarizeGameResult(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary {
  const game =
    message.gameType === 'omok' || message.omokState ? 'omok' : 'chess';
  // Names the winner only: a quote never spells out someone's loss or a
  // missed move (the Twinkle rule against showing a member's own misses).
  const winnerId = Number(message.gameWinnerId || 0);
  return {
    icon: game === 'omok' ? 'circle' : 'chess',
    label: Number(message.isAbort || 0)
      ? `The ${game} match was called off`
      : Number(message.isDraw || 0)
        ? `The ${game} match ended in a draw`
        : winnerId
          ? `${nameOf(winnerId, undefined, context, true)} won the ${game} match`
          : `The ${game} match ended`
  };
}

function summarizeTeacherRequest(
  message: any,
  context: ReplyTargetSummaryContext
): ReplyTargetSummary {
  const request =
    parseMessageSettings(message.settings)?.meetupTeacherRequest || {};
  const teacher = nameOf(
    request.teacherUserId,
    request.teacherUsername ? String(request.teacherUsername) : 'a teacher',
    context,
    false
  );
  const crewName = request.crewName
    ? String(request.crewName)
    : Number(request.crewId || 0)
      ? `Crew #${Number(request.crewId)}`
      : 'a crew';
  return {
    icon: 'chalkboard-teacher',
    label: `Asked ${teacher} to be the grown-up for ${crewName}`
  };
}

function countBundle(bundle: any) {
  const normalized = normalizeBundle(bundle);
  const parts: string[] = [];
  if (normalized.coins) {
    parts.push(`${normalized.coins.toLocaleString('en-US')} coins`);
  }
  for (const [count, label] of [
    [normalized.cardIds.length, 'card'],
    [normalized.groupIds.length, 'group'],
    [normalized.builds.length, 'app']
  ] as const) {
    if (count) parts.push(`${count} ${label}${count === 1 ? '' : 's'}`);
  }
  return parts.join(' + ');
}

function nameOf(
  userId: unknown,
  fallback: string | undefined,
  context: ReplyTargetSummaryContext,
  capitalized: boolean
) {
  const id = Number(userId || 0);
  if (id && id === Number(context.myId)) return capitalized ? 'You' : 'you';
  return (id && context.usernameOf?.(id)) || fallback || 'someone';
}

function lower(name: string) {
  return name === 'You' ? 'you' : name;
}

function textOf(content: unknown) {
  const text = String(content || '').trim();
  return text ? text : undefined;
}

// The quoted moderator notice: "Deleted post by PigBar: 1111…".
const MODERATION_TEXT_MAX_LENGTH = 80;

export function describeModeration({
  action,
  isChat,
  author,
  body
}: {
  action?: string;
  isChat: boolean;
  author?: string;
  body?: string;
}) {
  const verb = String(action || '').trim();
  const past = verb
    ? `${verb[0].toUpperCase()}${verb.slice(1)}${
        verb === 'delete' || verb === 'close' ? 'd' : 'ed'
      }`
    : 'Changed';
  const what = isChat ? 'chat message' : 'post';
  const text = String(body || '')
    .replace(/\s+/g, ' ')
    .trim();
  const clipped =
    text.length > MODERATION_TEXT_MAX_LENGTH
      ? `${text.slice(0, MODERATION_TEXT_MAX_LENGTH - 1)}…`
      : text;
  return `${past} ${what}${author ? ` by ${author}` : ''}${
    clipped ? `: ${clipped}` : ''
  }`;
}
