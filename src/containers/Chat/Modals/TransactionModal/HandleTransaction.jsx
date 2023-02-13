import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';

HandleTransaction.propTypes = {
  offer: PropTypes.object,
  want: PropTypes.object,
  fromId: PropTypes.number,
  toId: PropTypes.number,
  type: PropTypes.string
};

export default function HandleTransaction({ offer, want, fromId, toId, type }) {
  const { coins: wantCoins, cardIds: wantCardIds } = want;
  const { coins: offerCoins, cardIds: offerCardIds } = offer;

  return (
    <div>
      <div>From: {fromId}</div>
      <div>To: {toId}</div>
      <div>Type: {type}</div>
      <div>Want Coins: {wantCoins}</div>
      <div>Offer Coins: {offerCoins}</div>
      {wantCardIds && <AICardsPreview cardIds={wantCardIds} />}
      {offerCardIds && <AICardsPreview cardIds={offerCardIds} />}
    </div>
  );
}
