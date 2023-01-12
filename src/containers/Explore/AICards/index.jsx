import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useExploreContext } from '~/contexts';
import AICardModal from '~/components/Modals/AICardModal';
import AICard from '~/components/AICard';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

export default function AICards() {
  const { search } = useLocation();
  const [aiCardModalCardId, setAICardModalCardId] = useState(null);
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const cards = useExploreContext((v) => v.state.aiCards.cards);
  const onLoadAICards = useExploreContext((v) => v.actions.onLoadAICards);
  useEffect(() => {
    const { cardId } = queryString.parse(search);
    if (cardId) {
      setAICardModalCardId(Number(cardId));
    }
  }, [search]);
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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {cards.map((card) => (
          <div key={card.id} style={{ margin: '1rem' }}>
            <AICard
              card={card}
              onClick={() => setAICardModalCardId(card.id)}
              detailShown
            />
          </div>
        ))}
      </div>
      {aiCardModalCardId && (
        <AICardModal
          cardId={aiCardModalCardId}
          onHide={() => {
            setAICardModalCardId(null);
          }}
        />
      )}
    </ErrorBoundary>
  );
}
