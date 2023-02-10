import PropTypes from 'prop-types';

TransactionMessage.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function TransactionMessage({ transaction }) {
  const { type, want = {}, offer = {} } = transaction;
  const { cardIds: wantCardIds = [], coins: wantCoins = 0 } = want || {};
  const { cardIds: offerCardIds = [], coins: offerCoins = 0 } = offer || {};

  return (
    <div>
      <div>
        this is for {type}!!
        {(wantCardIds?.length, wantCoins)}
        {(offerCardIds?.length, offerCoins)}
      </div>
    </div>
  );
}
