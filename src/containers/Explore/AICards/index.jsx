import { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  useAppContext,
  useChatContext,
  useExploreContext,
  useKeyContext
} from '~/contexts';
import AICardModal from '~/components/Modals/AICardModal';
import CardSearchPanel from './CardSearchPanel';
import FilterModal from './FilterModal';
import DefaultView from './DefaultView';
import SearchView from './SearchView';
import { Color } from '~/constants/css';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

export default function AICards() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState(null);
  const [filters, setFilters] = useState({});
  const [numCards, setNumCards] = useState(0);
  const [numFilteredCards, setNumFilteredCards] = useState(0);
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const loaded = useExploreContext((v) => v.state.aiCards.loaded);
  const cards = useExploreContext((v) => v.state.aiCards.cards);
  const onLoadAICards = useExploreContext((v) => v.actions.onLoadAICards);
  const cardObj = useChatContext((v) => v.state.cardObj);

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
      if (searchObj.search.isBuyNow) {
        searchObj.search.isBuyNow =
          searchObj.search.isBuyNow === 'true' ? true : false;
      }
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
      const { cards, loadMoreShown, numCards } = await loadAICards();
      onLoadAICards({ cards, loadMoreShown });
      setNumCards(numCards);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const isFilterSet = useMemo(() => Object.keys(filters).length > 0, [filters]);
  const displayedNumCards = useMemo(
    () => (isFilterSet ? numFilteredCards : numCards),
    [isFilterSet, numCards, numFilteredCards]
  );

  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardSearchPanel
          filters={filters}
          onSetSelectedFilter={setSelectedFilter}
          onBuyNowSwitchClick={handleBuyNowSwitchClick}
        />
        {displayedNumCards > 0 && (
          <div
            className={css`
              width: 100%;
              padding: 0.7rem 1rem 0 0;
              display: flex;
              justify-content: flex-end;
              font-family: 'Roboto', sans-serif;
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
            `}
          >
            {displayedNumCards} card
            {displayedNumCards === 1 ? '' : 's'} {isFilterSet ? 'found' : ''}
          </div>
        )}
        {isFilterSet ? (
          <SearchView
            cardObj={cardObj}
            filters={filters}
            loadMoreButtonColor={loadMoreButtonColor}
            navigate={navigate}
            onSetNumCards={setNumFilteredCards}
            search={search}
          />
        ) : (
          <DefaultView
            cards={cards}
            loading={loading}
            navigate={navigate}
            cardObj={cardObj}
            loadAICards={loadAICards}
            search={search}
            loadMoreButtonColor={loadMoreButtonColor}
          />
        )}
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

  function handleBuyNowSwitchClick() {
    let newSeach = search;
    if (filters.isBuyNow) {
      newSeach = search.replace('&search[isBuyNow]=true', '');
    } else {
      newSeach = search + '&search[isBuyNow]=true';
    }
    navigate(`../ai-cards${newSeach}`);
  }
}
