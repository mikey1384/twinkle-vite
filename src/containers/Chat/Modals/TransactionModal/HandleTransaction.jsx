import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';

HandleTransaction.propTypes = {
  transaction: PropTypes.object.isRequired
};

export default function HandleTransaction({ transaction }) {
  const offer = transaction.offer || {};
  const want = transaction.want || {};
  const from = transaction.from;
  const to = transaction.to;
  const type = transaction.type;

  const { coins: wantCoins, cardIds: wantCardIds } = want;
  const { coins: offerCoins, cardIds: offerCardIds } = offer;

  return (
    <div>
      <div>Handle Transaction {transaction.id}</div>
      <div>From: {from}</div>
      <div>To: {to}</div>
      <div>Type: {type}</div>
      <div>Want Coins: {wantCoins}</div>
      <div>Offer Coins: {offerCoins}</div>
      {wantCardIds && <AICardsPreview cardIds={wantCardIds} />}
      {offerCardIds && <AICardsPreview cardIds={offerCardIds} />}
    </div>
  );
}
