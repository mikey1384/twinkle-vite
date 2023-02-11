import PropTypes from 'prop-types';
import AICardsPreview from '~/components/AICardsPreview';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

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
      className={css`
        width: 60%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
      style={{
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div
        style={{
          padding: '1rem',
          fontWeight: 'bold',
          fontFamily: 'Roboto, monospace',
          textAlign: 'center',
          borderBottom: `1px solid ${Color.borderGray()}`
        }}
      >
        Offering...
      </div>
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
            <AICardsPreview
              cardIds={offerCardIds}
              onSetAICardModalCardId={onSetAICardModalCardId}
            />
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
