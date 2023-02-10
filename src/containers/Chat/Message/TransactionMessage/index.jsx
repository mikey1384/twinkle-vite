import PropTypes from 'prop-types';
import Trade from './Trade';
import Show from './Show';
import Send from './Send';

TransactionMessage.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({ transaction }) {
  const { type, want = {}, offer = {} } = transaction;
  const { cards: wantCards = [], coins: wantCoins = 0 } = want || {};
  const { cards: offerCards = [], coins: offerCoins = 0 } = offer || {};

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
