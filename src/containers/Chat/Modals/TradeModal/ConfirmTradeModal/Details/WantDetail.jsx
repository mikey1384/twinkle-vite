import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Cards from './Cards';
import { borderRadius, Color } from '~/constants/css';

WantDetail.propTypes = {
  isAICardModalShown: PropTypes.bool,
  cardIds: PropTypes.array.isRequired,
  coins: PropTypes.number.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function WantDetail({
  isAICardModalShown,
  cardIds,
  coins,
  onSetAICardModalCardId,
  partner
}) {
  return (
    <div
      style={{
        marginTop: '2rem',
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
          padding: '1rem',
          fontWeight: 'bold'
        }}
      >
        in exchange for...
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
              <span style={{ color: Color.darkerGray() }}>{coins}</span>
            </div>
            {cardIds.length && <div>and</div>}
          </div>
        )}
        <Cards
          isAICardModalShown={isAICardModalShown}
          cardIds={cardIds}
          onSetAICardModalCardId={onSetAICardModalCardId}
          partnerId={partner.id}
          type="want"
        />
      </div>
    </div>
  );
}
