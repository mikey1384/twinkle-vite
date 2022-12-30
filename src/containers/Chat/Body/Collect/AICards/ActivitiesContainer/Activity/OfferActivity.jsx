import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
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
        display: 'flex',
        width: '100%',
        height: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CardThumb card={card} />
      </div>
      <div>
        <UsernameText
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
        />
        something somethingsomethingsomethingsomethingsomethingsomething
      </div>
    </div>
  );
}
