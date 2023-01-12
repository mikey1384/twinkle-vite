import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useChatContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import AICardModal from '~/components/Modals/AICardModal';
import AICard from '~/components/AICard';
import queryString from 'query-string';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { useLocation } from 'react-router-dom';

export default function AICards() {
  const { search } = useLocation();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState(null);
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const cards = useExploreContext((v) => v.state.aiCards.cards);
  const loadMoreShown = useExploreContext((v) => v.state.aiCards.loadMoreShown);
  const onLoadAICards = useExploreContext((v) => v.actions.onLoadAICards);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const onLoadMoreAICards = useExploreContext(
    (v) => v.actions.onLoadMoreAICards
  );
  useEffect(() => {
    const { cardId } = queryString.parse(search);
    if (cardId) {
      setAICardModalCardId(Number(cardId));
    }
  }, [search]);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { cards, loadMoreShown } = await loadAICards();
      onLoadAICards({ cards, loadMoreShown });
      setLoading(false);
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
        {loading ? (
          <Loading />
        ) : (
          cards.map((card) => (
            <div key={card.id} style={{ margin: '1rem' }}>
              <AICard
                card={cardObj[card.id] ? cardObj[card.id] : card}
                onClick={() => setAICardModalCardId(card.id)}
                detailShown
              />
            </div>
          ))
        )}
      </div>
      {aiCardModalCardId && (
        <AICardModal
          cardId={aiCardModalCardId}
          onHide={() => {
            setAICardModalCardId(null);
          }}
        />
      )}
      {loadMoreShown && !loading && (
        <LoadMoreButton
          loading={loadingMore}
          style={{ marginTop: '5rem' }}
          filled
          color={loadMoreButtonColor}
          onClick={handleLoadMoreAICards}
        />
      )}
    </ErrorBoundary>
  );

  async function handleLoadMoreAICards() {
    const lastInteraction = cards[cards.length - 1]?.lastInteraction;
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadAICards(
      lastInteraction
    );
    onLoadMoreAICards({ cards: newCards, loadMoreShown });
    setLoadingMore(false);
  }
}
