import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { borderRadius, Color } from '~/constants/css';

OfferDetail.propTypes = {
  selectedOption: PropTypes.string.isRequired,
  cards: PropTypes.array.isRequired,
  coins: PropTypes.number.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function OfferDetail({
  selectedOption,
  cards,
  coins,
  partnerName
}) {
  const actionLabel = useMemo(() => {
    if (selectedOption === 'want') {
      return 'Offer';
    }
    if (selectedOption === 'offer') {
      return 'Show';
    }
    return 'Give';
  }, [selectedOption]);
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius,
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem'
        }}
      >
        {actionLabel} {partnerName}
      </div>
      <div
        style={{
          borderTop: `1px solid ${Color.borderGray()}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {coins && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />{' '}
              <span style={{ color: Color.darkerGray() }}>{coins}</span>
            </div>
            {cards.length && <div>and</div>}
          </div>
        )}
        <div>{cards.length}</div>
      </div>
    </div>
  );
}
