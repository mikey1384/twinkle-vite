import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ProfilePic from '~/components/ProfilePic';
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
    <div>
      <ProfilePic
        style={{ width: '100%' }}
        profilePicUrl={offer.user.profilePicUrl}
        userId={offer.user.id}
      />
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
      </div>
      <div>
        <CardThumb card={card} />
      </div>
    </div>
  );
}
