import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';
import { useChatContext } from '~/contexts';

TransactionMessage.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({ transaction }) {
  const cardObj = useChatContext((v) => v.state.cardObj);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const { type, want = {}, offer = {} } = transaction;
  const { cards: wantCards = [], coins: wantCoins = 0 } = want || {};
  const { cards: offerCards = [], coins: offerCoins = 0 } = offer || {};

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
    <div>
      {type === 'trade' && (
        <Trade
          wantCards={wantCards}
          wantCoins={wantCoins}
          offerCards={offerCards}
          offerCoins={offerCoins}
        />
      )}
      {type === 'show' && <Show cards={offerCards} offerCoins={offerCoins} />}
      {type === 'send' && <Send cards={offerCards} offerCoins={offerCoins} />}
    </div>
  );
}
