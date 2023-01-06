import { useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import OfferDetailModal from './OfferDetailModal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);

OfferPriceListItem.propTypes = {
  cardId: PropTypes.number.isRequired,
  offer: PropTypes.object.isRequired,
  offerers: PropTypes.array.isRequired,
  ownerId: PropTypes.number.isRequired,
  onUserMenuShown: PropTypes.func.isRequired,
  userId: PropTypes.number,
  usermenuShown: PropTypes.bool
};

export default function OfferPriceListItem({
  cardId,
  offer,
  offerers,
  ownerId,
  onUserMenuShown,
  usermenuShown,
  userId
}) {
  const [offerDetailModalShown, setOfferDetailModalShown] = useState(false);
  const {
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/Offers/OfferListItem">
      <nav
        className={css`
          height: 7rem;
          padding: 0 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.6rem;
          cursor: pointer;
          border-bottom: 1px solid ${Color.borderGray()};
          &:hover {
            background-color: ${Color.highlightGray()};
          }
          @media (max-width: ${mobileMaxWidth}) {
            height: 3rem;
            font-size: 0.8rem;
          }
        `}
        key={offer.price}
        onClick={() => setOfferDetailModalShown(true)}
      >
        <div>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />
          <span style={{ marginLeft: '0.2rem' }}>
            <b style={{ color: Color.darkerGray() }}>
              {addCommasToNumber(offer.price)}
            </b>
            {deviceIsMobile ? '' : <span> offer </span>} from{' '}
          </span>
          <UsernameText
            onMenuShownChange={onUserMenuShown}
            color={Color[userLinkColor]()}
            displayedName={
              offerers[0].id === userId ? 'you' : offerers[0].username
            }
            user={{
              username: offerers[0].username,
              id: offerers[0].id
            }}
          />
          {offerers.length > 1 ? (
            <span>
              {' '}
              and {offerers.length - 1} other
              {offerers.length - 1 > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
      </nav>
      {offerDetailModalShown && (
        <OfferDetailModal
          price={offer.price}
          cardId={cardId}
          onHide={() => setOfferDetailModalShown(false)}
          ownerId={ownerId}
          onUserMenuShown={onUserMenuShown}
          userLinkColor={userLinkColor}
          usermenuShown={usermenuShown}
          userId={userId}
        />
      )}
    </ErrorBoundary>
  );
}
