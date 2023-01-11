import { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';

export default function AICards() {
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  useEffect(() => {
    init();
    async function init() {
      const data = await loadAICards();
      console.log(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div>
        <h1>AICards</h1>
      </div>
    </ErrorBoundary>
  );
}
