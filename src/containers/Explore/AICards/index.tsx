import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useExploreContext } from '~/contexts';
import AICardModal from '~/components/Modals/AICardModal';
import CardSearchPanel from './CardSearchPanel';
import FilterModal from './FilterModal';
import DefaultView from './DefaultView';
import SearchView from './SearchView';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

export default function AICards() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [selectedFilter, setSelectedFilter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [filters, setFilters] = useState<any>({});
  const loadAICards = useAppContext((v) => v.requestHelpers.loadAICards);
  const loaded = useExploreContext((v) => v.state.aiCards.loaded);
  const cards = useExploreContext((v) => v.state.aiCards.cards);
  const numCards = useExploreContext((v) => v.state.aiCards.numCards);
  const numFilteredCards = useExploreContext(
    (v) => v.state.aiCards.numFilteredCards
  );
  const filteredCardsTotalBv = useExploreContext(
    (v) => v.state.aiCards.filteredCardsTotalBv
  );
  const onLoadAICards = useExploreContext((v) => v.actions.onLoadAICards);
  const onSetNumFilteredCards = useExploreContext(
    (v) => v.actions.onSetNumFilteredCards
  );
  const onSetFilteredCardsTotalBv = useExploreContext(
    (v) => v.actions.onSetFilteredCardsTotalBv
  );
  const cardObj = useChatContext((v) => v.state.cardObj);

  useEffect(() => {
    const searchParams = new URLSearchParams(search.split('?')[1]);
    const paramsObject = Object.fromEntries(searchParams);
    const searchObj: { [key: string]: any } = {};
    Object.entries(paramsObject).forEach(([key, value]) => {
      const keys = key.split('[').map((k) => k.replace(/[[\]]/g, ''));
      let obj: { [key: string]: any } = searchObj;
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
      onLoadAICards({ cards, loadMoreShown, numCards });
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
          onCardNumberSearch={handleCardNumberSearch}
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
            {addCommasToNumber(displayedNumCards)} card
            {displayedNumCards === 1 ? '' : 's'} {isFilterSet ? 'found' : ''}
          </div>
        )}
        {displayedNumCards > 0 && filteredCardsTotalBv > 0 && isFilterSet && (
          <div
            className={css`
              display: flex;
              padding: 0 1rem;
              justify-content: flex-end;
              font-family: 'Roboto', sans-serif;
            `}
          >
            <span
              className={css`
                color: ${Color.darkerGray()};
              `}
            >
              Total BV:
            </span>{' '}
            <span
              className={css`
                margin-left: 0.5rem;
                color: ${Color.orange()};
              `}
            >
              {addCommasToNumber(filteredCardsTotalBv)} XP
            </span>
          </div>
        )}
        {isFilterSet ? (
          <SearchView
            cardObj={cardObj}
            filters={filters}
            navigate={navigate}
            onSetNumCards={onSetNumFilteredCards}
            onSetTotalBv={onSetFilteredCardsTotalBv}
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
              const searchParams = new URLSearchParams(queryString);
              if (filters.isBuyNow) {
                searchParams.set('search[isBuyNow]', 'true');
              }
              const decodedURL =
                queryString === '/ai-cards'
                  ? '/ai-cards/?search[isBuyNow]=true'
                  : decodeURIComponent(searchParams.toString());
              navigate(filters.isBuyNow ? decodedURL : queryString);
              setSelectedFilter(null);
            }}
            onHide={() => setSelectedFilter(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleCardNumberSearch(cardNumber: string | number) {
    const searchParams = new URLSearchParams(search);
    searchParams.set('cardId', cardNumber as string);
    const decodedURL = decodeURIComponent(searchParams.toString());
    navigate(`../ai-cards${decodedURL ? `/?${decodedURL}` : ''}`);
  }

  function handleBuyNowSwitchClick() {
    const searchParams = new URLSearchParams(search);
    if (filters.isBuyNow) {
      searchParams.delete('search[isBuyNow]');
    } else {
      searchParams.set('search[isBuyNow]', 'true');
    }
    const decodedURL = decodeURIComponent(searchParams.toString());
    navigate(`../ai-cards${decodedURL ? '/?' : ''}${decodedURL}`);
  }
}
