import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import { Color, borderRadius } from '~/constants/css';

OfferPanel.propTypes = {
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function OfferPanel({
  offerCardIds,
  offerCoins,
  onSetAICardModalCardId
}) {
  return (
    <div
      style={{
        padding: '1rem',
        width: 'CALC(50% - 1rem)',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div>Offering...</div>
      {offerCardIds.length ? (
        <div>
          <AICardsPreview
            cardIds={offerCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
          {offerCoins > 0 && <div>and</div>}
        </div>
      ) : null}
      {offerCoins > 0 && <div>{`${offerCoins} coins`}</div>}
    </div>
  );
}
