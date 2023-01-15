import { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useChatContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import AICardModal from '~/components/Modals/AICardModal';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardSearchPanel from './CardSearchPanel';
import FilterModal from './FilterModal';
import DefaultView from './DefaultView';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AICards() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState(null);
  const [filters, setFilters] = useState({});
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
    const searchParams = new URLSearchParams(search.split('?')[1]);
    const paramsObject = Object.fromEntries(searchParams);
    const searchObj = {};
    Object.entries(paramsObject).forEach(([key, value]) => {
      const keys = key.split('[').map((k) => k.replace(/[\[\]]/g, ''));
      let obj = searchObj;
      for (let i = 0; i < keys.length; i++) {
        if (i === keys.length - 1) {
          obj[keys[i]] = value;
        } else {
          obj[keys[i]] = obj[keys[i]] || {};
          obj = obj[keys[i]];
        }
      }
    });
    if (searchObj.search) {
      setFilters(searchObj.search);
    } else {
      setFilters({});
    }
    if (searchObj.cardId) {
      setAICardModalCardId(Number(searchObj.cardId));
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
        <CardSearchPanel
          filters={filters}
          onSetSelectedFilter={setSelectedFilter}
        />
        <DefaultView
          cards={cards}
          loading={loading}
          navigate={navigate}
          cardObj={cardObj}
          search={search}
        />
        {aiCardModalCardId && (
          <AICardModal
            cardId={aiCardModalCardId}
            onHide={() => {
              const searchParams = new URLSearchParams(search);
              searchParams.delete('cardId');
              const decodedURL = decodeURIComponent(searchParams.toString());
              navigate(`../ai-cards${decodedURL ? `/?${decodedURL}` : ''}`);
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
        {selectedFilter && (
          <FilterModal
            filters={filters}
            selectedFilter={selectedFilter}
            onApply={(queryString) => {
              navigate(queryString);
              setSelectedFilter(null);
            }}
            onHide={() => setSelectedFilter(null)}
          />
        )}
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
