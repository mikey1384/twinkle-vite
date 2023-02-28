import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext, useKeyContext } from '~/contexts';

TransactionDetails.propTypes = {
  isAICardModalShown: PropTypes.bool,
  isOnModal: PropTypes.bool,
  currentTransactionId: PropTypes.number,
  onClick: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  style: PropTypes.object,
  transaction: PropTypes.object.isRequired
};

export default function TransactionDetails({
  currentTransactionId,
  onClick,
  isAICardModalShown,
  isOnModal,
  onSetAICardModalCardId,
  transaction,
  partner,
  style
}) {
  const { userId, username } = useKeyContext((v) => v.myState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const acceptedTransactions = useChatContext(
    (v) => v.state.acceptedTransactions
  );
  const cancelledTransactions = useChatContext(
    (v) => v.state.cancelledTransactions
  );
  const isAccepted =
    acceptedTransactions[transaction.id] || !!transaction.isAccepted;
  const isCancelled =
    !!cancelledTransactions[transaction.id] || !!transaction.isCancelled;
  const cancelReason =
    cancelledTransactions[transaction.id] || transaction.cancelReason;
  const { type, want = {}, offer = {} } = transaction;
  const { cards: wantCards = [], coins: wantCoins = 0 } = want || {};
  const { cards: offerCards = [], coins: offerCoins = 0 } = offer || {};
  const wantCardIds = wantCards.map((card) => card.id);
  const offerCardIds = offerCards.map((card) => card.id);

  useEffect(() => {
    if (wantCards.length) {
      for (const card of wantCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    if (offerCards.length) {
      for (const card of offerCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerCards?.length, wantCards?.length]);

  return (
    <ErrorBoundary componentPath="Chat/TransactionDetails">
      <div style={style}>
        {type === 'trade' && (
          <Trade
            isCurrent={transaction.id === currentTransactionId}
            isAccepted={isAccepted}
            isCancelled={isCancelled}
            isOnModal={isOnModal}
            isAICardModalShown={isAICardModalShown}
            cancelReason={cancelReason}
            myId={userId}
            myUsername={username}
            wantCardIds={wantCardIds}
            wantCoins={wantCoins}
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            partner={partner}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            fromId={transaction.from}
            toId={transaction.to}
          />
        )}
        {type === 'show' && (
          <Show
            isCurrent={transaction.id === currentTransactionId}
            isOnModal={isOnModal}
            isAICardModalShown={isAICardModalShown}
            myId={userId}
            myUsername={username}
            partner={partner}
            cardIds={offerCardIds}
            coins={offerCoins}
            fromId={transaction.from}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            toId={transaction.to}
          />
        )}
        {type === 'send' && (
          <Send
            isAICardModalShown={isAICardModalShown}
            isCurrent={transaction.id === currentTransactionId}
            isOnModal={isOnModal}
            myId={userId}
            fromId={transaction.from}
            myUsername={username}
            partner={partner}
            cardIds={offerCardIds}
            coins={offerCoins}
            onClick={onClick}
            onSetAICardModalCardId={onSetAICardModalCardId}
            toId={transaction.to}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
