import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import { Color, borderRadius } from '~/constants/css';

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
    <div
      style={{
        width: 'CALC(50% - 1rem)',
        borderRadius,
        fontFamily: 'Roboto, monospace',
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {isTrade ? (
        <div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            fontFamily: 'Roboto, monospace',
            textAlign: 'center',
            borderBottom: `1px solid ${Color.borderGray()}`
          }}
        >
          in exchange for...
        </div>
      ) : null}
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
