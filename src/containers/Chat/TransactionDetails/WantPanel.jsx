import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

WantPanel.propTypes = {
  isTrade: PropTypes.bool.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  wantCardIds: PropTypes.array.isRequired,
  wantCoins: PropTypes.number.isRequired,
  showCardDetailsOnThumbClick: PropTypes.bool,
  style: PropTypes.object
};

export default function WantPanel({
  isTrade,
  onSetAICardModalCardId,
  wantCardIds,
  wantCoins,
  showCardDetailsOnThumbClick,
  style
}) {
  return (
    <div
      className="panel"
      style={{
        width: '100%',
        borderRadius,
        fontFamily: 'Roboto, monospace',
        border: `1px solid ${Color.borderGray()}`,
        ...style
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.7rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
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
      <div
        style={{
          padding: '1rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {wantCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview
              cardIds={wantCardIds}
              onSetAICardModalCardId={
                showCardDetailsOnThumbClick ? onSetAICardModalCardId : () => {}
              }
            />
            {wantCoins > 0 && (
              <div
                style={{
                  padding: '0.5rem',
                  fontFamily: 'Roboto, Helvetica, monospace',
                  fontSize: '1.5rem'
                }}
              >
                and
              </div>
            )}
          </div>
        ) : null}
        {wantCoins > 0 && (
          <div>
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: Color.darkerGray(),
                marginLeft: '0.3rem'
              }}
            >
              {addCommasToNumber(wantCoins)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
