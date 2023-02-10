import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';

WantPanel.propTypes = {
  isTrade: PropTypes.bool.isRequired,
  wantCardIds: PropTypes.array.isRequired,
  wantCoins: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function WantPanel({
  isTrade,
  wantCardIds,
  wantCoins,
  onSetAICardModalCardId
}) {
  return (
    <div>
      {isTrade ? <div>isTrade exchange for</div> : null}
      {wantCardIds.length ? (
        <div>
          <AICardsPreview
            cardIds={wantCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
          {wantCoins > 0 && <div>and</div>}
        </div>
      ) : null}
      {wantCoins > 0 && <div>{`${wantCoins} coins`}</div>}
    </div>
  );
}
