import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';
import { useChatContext, useKeyContext } from '~/contexts';

TransactionMessage.propTypes = {
  onClick: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({
  onClick,
  onSetAICardModalCardId,
  transaction,
  partner
}) {
  const { userId, username } = useKeyContext((v) => v.myState);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const { type, want = {}, offer = {} } = transaction;
  const { cards: wantCards = [], coins: wantCoins = 0 } = want || {};
  const { cards: offerCards = [], coins: offerCoins = 0 } = offer || {};
  const wantCardIds = wantCards.map((card) => card.id);
  const offerCardIds = offerCards.map((card) => card.id);

  useEffect(() => {
    if (wantCards.length) {
      for (const card of wantCards) {
        if (!cardObj[card.id]) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
      }
    }
    if (offerCards.length) {
      for (const card of offerCards) {
        if (!cardObj[card.id]) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerCards?.length, wantCards?.length]);

  return (
    <div style={{ width: '100%' }}>
      {type === 'trade' && (
        <Trade
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
        />
      )}
      {type === 'show' && (
        <Show
          myId={userId}
          myUsername={username}
          partner={partner}
          cardIds={offerCardIds}
          coins={offerCoins}
          fromId={transaction.from}
          onClick={onClick}
          toId={transaction.to}
        />
      )}
      {type === 'send' && (
        <Send
          myId={userId}
          fromId={transaction.from}
          myUsername={username}
          partner={partner}
          cardIds={offerCardIds}
          coins={offerCoins}
          onClick={onClick}
          toId={transaction.to}
        />
      )}
    </div>
  );
}
