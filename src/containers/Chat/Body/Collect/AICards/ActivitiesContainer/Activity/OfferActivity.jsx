import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import CardThumb from '../../../../../CardThumb';

OfferActivity.propTypes = {
  card: PropTypes.object.isRequired,
  feed: PropTypes.object.isRequired
};

export default function OfferActivity({ card, feed }) {
  const offer = feed.offer;
  return (
    <div
      style={{
        cursor: 'pointer',
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: '0 3rem 0 2rem'
      }}
    >
      <div
        style={{
          width: '5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CardThumb card={card} />
      </div>
      <div
        style={{
          width: 'CALC(100% - 5rem)',
          marginLeft: '3rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div>
          <UsernameText
            color={Color.black()}
            className={css`
              font-size: 1.7rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            user={{
              id: offer.user.id,
              username: offer.user.username
            }}
          />{' '}
          offered{' '}
          <b style={{ color: Color.black() }}>
            {addCommasToNumber(offer.offerPrice)}
          </b>{' '}
          Twinkle {offer.offerPrice === 1 ? 'Coin' : 'Coins'} for{' '}
          <b style={{ color: Color.black() }}>Card #{card.id}</b>
        </div>
      </div>
      <div
        style={{
          width: '5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CardThumb card={card} />
      </div>
    </div>
  );
}
