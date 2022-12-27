import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

Offers.propTypes = {
  cardId: PropTypes.number.isRequired
};

export default function Offers({ cardId }) {
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
            <div
              className={css`
                font-size: 1.6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
              key={offer.id}
              style={{ marginBottom: '1rem' }}
            >
              {offer.user.username}
            </div>
          );
        })}
      </div>
    </ErrorBoundary>
  );
}
