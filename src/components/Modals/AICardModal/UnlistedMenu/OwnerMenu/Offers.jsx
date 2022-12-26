import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';

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
            <div key={offer.id} style={{ marginBottom: '1rem' }}>
              {offer.user.username}
            </div>
          );
        })}
      </div>
    </ErrorBoundary>
  );
}
