import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

Offers.propTypes = {
  cardId: PropTypes.number.isRequired
};

export default function Offers({ cardId }) {
  const {
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const [offers, setOffers] = useState([]);
  const getOffersForCard = useAppContext(
    (v) => v.requestHelpers.getOffersForCard
  );
  useEffect(() => {
    init();
    async function init() {
      const { offers: loadedOffers, loadMoreShown } = await getOffersForCard({
        cardId
      });
      setOffers(loadedOffers);
      console.log('loadMoreShown', loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div>
        {offers.map((offer) => {
          return (
            <nav
              className={css`
                height: 7rem;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.6rem;
                border-bottom: 1px solid ${Color.borderGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
              key={offer.id}
              style={{ marginBottom: '1rem' }}
            >
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span style={{ marginLeft: '0.2rem' }}>
                {offer.offerPrice} offer from
              </span>
              <UsernameText
                style={{ marginLeft: '0.5rem' }}
                color={Color[userLinkColor]()}
                user={{
                  username: offer.user.username,
                  id: offer.user.id
                }}
              />
            </nav>
          );
        })}
      </div>
    </ErrorBoundary>
  );
}
