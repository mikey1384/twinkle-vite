import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';

Trade.propTypes = {
  partnerId: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array.isRequired
};

export default function Trade({
  wantCardIds,
  partnerId,
  onSetAICardModalCardId
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <AICardsPreview
        cardIds={wantCardIds}
        onSetAICardModalCardId={onSetAICardModalCardId}
        partnerId={partnerId}
      />
    </div>
  );
}
