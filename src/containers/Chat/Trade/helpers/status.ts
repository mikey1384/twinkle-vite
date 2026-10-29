import { isInterestOnlyTrade } from './terms';

// The status words a trade card shows. Shared by the card itself and by its
// compact quote in a reply, so both say the same thing about the same trade.
export function getTradeStatus({
  transaction,
  viewerId,
  isAccepted,
  isCancelled,
  cancelReason,
  isCurrent
}: {
  transaction: any;
  viewerId: number;
  isAccepted: boolean;
  isCancelled: boolean;
  cancelReason?: string | null;
  // Whether this is the chat's open offer; a quote passes undefined because
  // it cannot know, and then a pending trade is simply a "Trade offer".
  isCurrent?: boolean;
}) {
  const type = transaction?.type;
  const isFromMe = Number(transaction?.from) === Number(viewerId);
  // Preserve the receipt of any already-settled legacy transaction.
  const requestOnly = !isAccepted && isInterestOnlyTrade(transaction);
  const settled = isAccepted || type === 'send';
  const cancelled = type === 'trade' && isCancelled && !isAccepted;
  const label =
    type === 'send'
      ? isFromMe
        ? 'Gift sent'
        : 'Gift received'
      : isAccepted
        ? 'Trade completed'
        : cancelled
          ? cancelReason === 'withdraw'
            ? requestOnly
              ? 'Interest withdrawn'
              : 'Offer withdrawn'
            : requestOnly
              ? 'Interest declined'
              : 'Offer declined'
          : type === 'show'
            ? 'Showcase'
            : requestOnly
              ? 'Interest shown'
              : isCurrent === false
                ? 'Earlier offer'
                : 'Trade offer';
  return { label, settled, cancelled, requestOnly, isFromMe };
}
