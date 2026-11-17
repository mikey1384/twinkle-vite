import { isInterestOnlyTrade } from './terms';
import { siteDayIndex } from '~/helpers/siteDay';

// The status words a trade card shows. Shared by the card itself and by its
// compact quote in a reply, so both say the same thing about the same trade.
export function getTradeStatus({
  transaction,
  viewerId,
  isAccepted,
  isCancelled,
  cancelReason,
  isCurrent,
  nowMs = Date.now()
}: {
  transaction: any;
  viewerId: number;
  isAccepted: boolean;
  isCancelled: boolean;
  cancelReason?: string | null;
  // Whether this is the chat's open offer; a quote passes undefined because
  // it cannot know, and then a pending trade is simply a "Trade offer".
  isCurrent?: boolean;
  nowMs?: number;
}) {
  const type = transaction?.type;
  const isFromMe = Number(transaction?.from) === Number(viewerId);
  // Preserve the receipt of any already-settled legacy transaction.
  const requestOnly = !isAccepted && isInterestOnlyTrade(transaction);
  const settled = isAccepted || type === 'send';
  // One derived rule for every item type: an open trade whose sides can't both
  // still deliver reads "Offer expired". `deliverability` is the server's
  // verdict (the same check accept runs); battery belongs to the site day the
  // offer was made, so once that day ends it can never be delivered and the
  // card flips at the boundary without a request. Nothing is stored, so a
  // missing item that comes back returns the card to "Trade offer".
  const offerHasBattery =
    Number(transaction?.offer?.battery) > 0 ||
    Number(transaction?.want?.battery) > 0;
  const batteryDayPassed =
    offerHasBattery &&
    siteDayIndex(nowMs) > siteDayIndex(Number(transaction?.timeStamp) * 1000);
  const open = type === 'trade' && !isAccepted && !isCancelled;
  const expired =
    open &&
    !requestOnly &&
    (batteryDayPassed || transaction?.deliverability?.ok === false);
  const expiredReason: string | null = expired
    ? batteryDayPassed
      ? 'battery day passed'
      : transaction?.deliverability?.reason || null
    : null;
  // Closed by a person (declined or withdrawn).
  const closed = type === 'trade' && isCancelled && !isAccepted;
  // Drawn like a closed offer (grey, "Nothing moved."). An expired offer is
  // still open on the server, so it can be declined or withdrawn.
  const cancelled = closed || expired;
  const label =
    type === 'send'
      ? isFromMe
        ? 'Gift sent'
        : 'Gift received'
      : isAccepted
        ? 'Trade completed'
        : expired
          ? 'Offer expired'
          : closed
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
  return {
    label,
    settled,
    cancelled,
    closed,
    expired,
    expiredReason,
    requestOnly,
    isFromMe
  };
}
