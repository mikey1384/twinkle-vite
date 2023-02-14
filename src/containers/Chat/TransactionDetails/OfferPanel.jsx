import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

OfferPanel.propTypes = {
  isTrade: PropTypes.bool,
  offerCardIds: PropTypes.array,
  offerCoins: PropTypes.number
};

export default function OfferPanel({ isTrade, offerCardIds, offerCoins }) {
  return (
    <div
      className="panel"
      style={{
        width: '100%',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {isTrade ? (
        <div
          className={css`
            font-size: 1.6rem;
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
          Offered...
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
        {offerCardIds.length ? (
          <div style={{ textAlign: 'center' }}>
            <AICardsPreview cardIds={offerCardIds} />
            {offerCoins > 0 && (
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
        {offerCoins > 0 && (
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
              {addCommasToNumber(offerCoins)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
