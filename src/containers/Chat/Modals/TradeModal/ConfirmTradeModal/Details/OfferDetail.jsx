import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Cards from './Cards';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { borderRadius, innerBorderRadius, Color } from '~/constants/css';

OfferDetail.propTypes = {
  isAICardModalShown: PropTypes.bool,
  selectedOption: PropTypes.string.isRequired,
  cardIds: PropTypes.array.isRequired,
  coins: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function OfferDetail({
  isAICardModalShown,
  selectedOption,
  cardIds,
  coins,
  onSetAICardModalCardId,
  partner
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
  const backgroundColor = useMemo(() => {
    if (selectedOption === 'want') {
      return 'transparent';
    }
    if (selectedOption === 'offer') {
      return Color.pink();
    }
    return Color.green();
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
          color: selectedOption === 'want' ? '#000' : '#fff',
          borderTopLeftRadius: innerBorderRadius,
          borderTopRightRadius: innerBorderRadius,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: backgroundColor,
          fontWeight: 'bold'
        }}
      >
        {actionLabel} {partner.username}...
      </div>
      <div
        style={{
          width: '100%',
          borderTop: `1px solid ${Color.borderGray()}`,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        {!!coins && (
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
              <span style={{ color: Color.darkerGray() }}>
                {addCommasToNumber(coins)}
              </span>
            </div>
            {cardIds.length && <div style={{ padding: '1rem' }}>and</div>}
          </div>
        )}
        <Cards
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
          partnerId={partner.id}
          type="offer"
        />
      </div>
    </div>
  );
}
