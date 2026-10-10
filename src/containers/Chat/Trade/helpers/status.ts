import { hasTradeAssets, normalizeBundle } from './terms';

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
  const requestOnly =
    type === 'trade' && !hasTradeAssets(normalizeBundle(transaction?.offer));
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
            ? 'Offer withdrawn'
            : 'Offer declined'
          : type === 'show'
            ? 'Showcase'
            : requestOnly
              ? 'Trade request'
              : isCurrent === false
                ? 'Earlier offer'
                : 'Trade offer';
  return { label, settled, cancelled, requestOnly, isFromMe };
}
