import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

WantPanel.propTypes = {
  isTrade: PropTypes.bool.isRequired,
  wantCardIds: PropTypes.array.isRequired,
  wantCoins: PropTypes.number.isRequired,
  style: PropTypes.object
};

export default function WantPanel({ isTrade, wantCardIds, wantCoins, style }) {
  return (
    <div
      className={css`
        width: 60%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
      style={{
        borderRadius,
        fontFamily: 'Roboto, monospace',
        border: `1px solid ${Color.borderGray()}`,
        ...style
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
            <AICardsPreview cardIds={wantCardIds} />
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
