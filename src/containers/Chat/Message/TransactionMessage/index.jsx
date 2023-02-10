import PropTypes from 'prop-types';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';

TransactionMessage.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({ transaction }) {
  const { type, want = {}, offer = {} } = transaction;
  const { cardIds: wantCardIds = [], coins: wantCoins = 0 } = want || {};
  const { cardIds: offerCardIds = [], coins: offerCoins = 0 } = offer || {};

  return (
    <div>
      {type === 'trade' && (
        <Trade
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          offerCardIds={offerCardIds}
          offerCoins={offerCoins}
        />
      )}
      {type === 'show' && (
        <Show offerCardIds={offerCardIds} offerCoins={offerCoins} />
      )}
      {type === 'send' && (
        <Send offerCardIds={offerCardIds} offerCoins={offerCoins} />
      )}
    </div>
  );
}
