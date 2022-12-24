import { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';

export default function Outgoing() {
  const getMyAICardOffers = useAppContext(
    (v) => v.requestHelpers.getMyAICardOffers
  );
  useEffect(() => {
    init();
    async function init() {
      const { offers, loadMoreShown } = await getMyAICardOffers();
      console.log(offers, loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers/Outgoing">
      <div>Outgoing</div>
    </ErrorBoundary>
  );
}
