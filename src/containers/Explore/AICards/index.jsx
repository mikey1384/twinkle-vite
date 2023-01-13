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
import CardSearchPanel from './CardSearchPanel';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AICards() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [selectedFilter, setSelectedFilter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState(null);
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const loaded = useExploreContext((v) => v.state.aiCards.loaded);
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
    } else {
      setAICardModalCardId(null);
    }
  }, [search]);
  useEffect(() => {
    if (!loaded) init();
    async function init() {
      setLoading(true);
      const { cards, loadMoreShown } = await loadAICards();
      onLoadAICards({ cards, loadMoreShown });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardSearchPanel onSetSelectedFilter={setSelectedFilter} />
        <div
          style={{
            marginTop: '3rem',
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
                  onClick={() => navigate(`./?cardId=${card.id}`)}
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
              navigate('../ai-cards');
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
        {selectedFilter && <div>{selectedFilter}</div>}
      </div>
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
