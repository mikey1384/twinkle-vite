import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

OfferListItem.propTypes = {
  offer: PropTypes.object.isRequired,
  userLinkColor: PropTypes.string.isRequired,
  onUserMenuShown: PropTypes.func.isRequired,
  userId: PropTypes.number.isRequired
};

export default function OfferListItem({
  offer,
  onUserMenuShown,
  userLinkColor,
  userId
}) {
  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/Offers/OfferListItem">
      <nav
        className={css`
          height: 7rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            height: 3rem;
            font-size: 0.8rem;
          }
        `}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between '
          }}
        >
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <div>
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span style={{ marginLeft: '0.2rem' }}>
                <b style={{ color: Color.darkerGray() }}>{offer.offerPrice}</b>
                <span> offer </span> from{' '}
              </span>
              <UsernameText
                onMenuShownChange={onUserMenuShown}
                color={Color[userLinkColor]()}
                displayedName={offer.userId === userId ? 'you' : offer.username}
                user={{
                  username: offer.username,
                  id: offer.userId
                }}
              />
            </div>
          </div>
          <div>
            <Button color="oceanBlue" filled>
              Accept
            </Button>
          </div>
        </div>
      </nav>
    </ErrorBoundary>
  );
}
