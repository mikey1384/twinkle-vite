import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import OwnerMenu from './OwnerMenu';
import NonOwnerMenu from './NonOwnerMenu';

ListedMenu.propTypes = {
  askPrice: PropTypes.number.isRequired,
  cardId: PropTypes.number.isRequired,
  myOffer: PropTypes.object,
  onSetOfferModalShown: PropTypes.func.isRequired,
  userIsOwner: PropTypes.bool.isRequired
};

export default function ListedMenu({
  cardId,
  myOffer,
  onSetOfferModalShown,
  userIsOwner,
  askPrice
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100% ',
        display: 'flex',
        marginTop: '-5rem',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '1rem',
          flexDirection: 'column'
        }}
        className={css`
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        {userIsOwner ? (
          <div style={{ textAlign: 'center' }}>
            You listed this card for
            <div style={{ marginTop: '0.5rem' }}>
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span
                style={{
                  marginLeft: '0.3rem',
                  fontWeight: 'bold',
                  color: Color.darkerGray()
                }}
              >
                {addCommasToNumber(askPrice)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            Buy this card for
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span
                style={{
                  marginLeft: '0.2rem',
                  color: Color.darkerGray(),
                  fontWeight: 'bold'
                }}
              >
                {askPrice}
              </span>
            </div>
          </div>
        )}
      </div>
      {userIsOwner ? (
        <OwnerMenu style={{ marginTop: '1rem' }} cardId={cardId} />
      ) : (
        <NonOwnerMenu
          myOffer={myOffer}
          onSetOfferModalShown={onSetOfferModalShown}
          style={{ marginTop: '1rem' }}
        />
      )}
    </div>
  );
}
