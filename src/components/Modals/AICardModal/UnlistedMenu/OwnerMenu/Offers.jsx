import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';

Offers.propTypes = {
  cardId: PropTypes.number.isRequired
};

export default function Offers({ cardId }) {
  const getOffersForCard = useAppContext(
    (v) => v.requestHelpers.getOffersForCard
  );
  useEffect(() => {
    init();
    async function init() {
      const { offers, loadMoreShown } = await getOffersForCard({ cardId });
      console.log(offers, loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div>Offers</div>
    </ErrorBoundary>
  );
}
