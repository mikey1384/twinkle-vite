import { useMemo } from 'react';
import { useChatContext, useKeyContext } from '~/contexts';
import { getReplyTargetSummary } from './replyTargetSummary';

// The quoted copy of a message, with the live state the full card reads:
// a trade accepted or declined after it was quoted, an AI card offer sold or
// withdrawn, and the names of the chat's members.
export default function useReplyTargetSummary(message: any) {
  const myId = useKeyContext((v) => v.myState.userId);
  const transactionId = Number(message?.transactionDetails?.id || 0);
  const tradeAccepted = useChatContext((v) =>
    transactionId ? v.state.acceptedTransactions?.[transactionId] : undefined
  );
  const tradeCancelReason = useChatContext((v) =>
    transactionId ? v.state.cancelledTransactions?.[transactionId] : undefined
  );
  const aiCardOfferStatusById = useChatContext(
    (v) => v.state.aiCardOfferNoticeStatusById
  );
  const members = useChatContext(
    (v) => v.state.channelsObj?.[Number(message?.channelId || 0)]?.members
  );

  return useMemo(
    () =>
      getReplyTargetSummary(message, {
        myId: Number(myId),
        usernameOf: (userId) =>
          (members || []).find(
            (member: { id?: number }) => Number(member?.id) === userId
          )?.username,
        tradeOutcome: () => ({
          isAccepted: !!tradeAccepted,
          cancelReason: tradeCancelReason || null
        }),
        aiCardOfferStatus: (offerId) => aiCardOfferStatusById?.[offerId]
      }),
    [
      aiCardOfferStatusById,
      members,
      message,
      myId,
      tradeAccepted,
      tradeCancelReason
    ]
  );
}
