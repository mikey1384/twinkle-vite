import { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useExploreContext } from '~/contexts';

export default function AICards() {
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const cards = useExploreContext((v) => v.state.aiCards.cards);
  const onLoadAICards = useExploreContext((v) => v.actions.onLoadAICards);
  useEffect(() => {
    init();
    async function init() {
      const cards = await loadAICards();
      onLoadAICards({ cards });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div>{cards.map((card) => card.id)}</div>
    </ErrorBoundary>
  );
}
