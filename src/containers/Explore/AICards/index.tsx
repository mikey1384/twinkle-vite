import React, { useEffect, useMemo, useState, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import AICardModal from '~/components/Modals/AICardModal';
import CardSearchPanel from './CardSearchPanel';
import FilterModal from './FilterModal';
import DefaultView from './DefaultView';
import SearchView from './SearchView';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SelectAICardModal from './SelectAICardModal';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import {
  useAppContext,
  useKeyContext,
  useChatContext,
  useExploreContext
} from '~/contexts';
import PriceRangeSearch from './PriceRangeSearch';

export default function AICards() {
  const navigate = useNavigate();
  const { userId, username } = useKeyContext((v) => v.myState);
  const { search } = useLocation();
  const [selectAICardModalShown, setSelectAICardModalShown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<number | null>(
    null
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [priceRange, setPriceRange] = useState(() => {
    const searchParams = new URLSearchParams(search);
    return {
      min: searchParams.get('search[minPrice]') || '',
      max: searchParams.get('search[maxPrice]') || ''
    };
  });
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

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    setPriceRange({
      min: searchParams.get('search[minPrice]') || '',
      max: searchParams.get('search[maxPrice]') || ''
    });
  }, [search]);

  const isFilterSet = useMemo(() => Object.keys(filters).length > 0, [filters]);
  const displayedNumCards = useMemo(
    () => (isFilterSet ? numFilteredCards : numCards),
    [isFilterSet, numCards, numFilteredCards]
  );

  const isSell = useMemo(() => {
    if (filters.owner === username) {
      return true;
    }
    return false;
  }, [filters?.owner, username]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <ErrorBoundary componentPath="Explore/AICards">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardSearchPanel
          filters={filters}
          onSetSelectedFilter={setSelectedFilter}
          onDALLE3SwitchClick={handleDALLE3SwitchSwitchClick}
          onBuyNowSwitchClick={handleBuyNowSwitchClick}
          onCardNumberSearch={handleCardNumberSearch}
        />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem'
          }}
        >
          <div style={{ flex: 1 }} />
          {filters.isBuyNow && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <PriceRangeSearch
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
              />
            </div>
          )}
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              fontFamily: 'Roboto, sans-serif',
              marginRight: '1rem'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayedNumCards > 0 && (
                <span
                  className={css`
                    font-size: 1.3rem;
                    color: ${Color.darkerGray()};
                  `}
                >
                  {addCommasToNumber(displayedNumCards)} card
                  {displayedNumCards === 1 ? '' : 's'}{' '}
                  {isFilterSet ? 'found' : ''}
                </span>
              )}
              {displayedNumCards > 0 &&
                filteredCardsTotalBv > 0 &&
                isFilterSet && (
                  <div>
                    <span
                      className={css`
                        color: ${Color.darkerGray()};
                      `}
                    >
                      Total BV:
                    </span>{' '}
                    <span
                      className={css`
                        color: ${Color.orange()};
                      `}
                    >
                      {addCommasToNumber(filteredCardsTotalBv)} XP
                    </span>
                  </div>
                )}
            </div>
            {isFilterSet && userId && isSell && !filters.isBuyNow && (
              <Button
                color="darkerGray"
                skeuomorphic
                onClick={() => setSelectAICardModalShown(true)}
                style={{ marginLeft: '1rem' }}
              >
                <Icon icon="money-bill-trend-up" className="navigation-icon" />
                <span style={{ marginLeft: '0.7rem' }}>
                  {isSell ? 'Sell' : 'Buy'}
                </span>
              </Button>
            )}
          </div>
        </div>
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
        {selectAICardModalShown && (
          <SelectAICardModal
            filters={filters}
            isBuy={!isSell}
            onDropdownShown={setDropdownShown}
            onConfirm={() => setSelectAICardModalShown(false)}
            onHide={() => {
              if (dropdownShown) {
                return setDropdownShown(false);
              }
              setSelectAICardModalShown(false);
            }}
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
                if (filters.minPrice) {
                  searchParams.set('search[minPrice]', filters.minPrice);
                }
                if (filters.maxPrice) {
                  searchParams.set('search[maxPrice]', filters.maxPrice);
                }
              }
              if (filters.isDalle3) {
                searchParams.set('search[isDalle3]', 'true');
              }
              const decodedURL =
                queryString === '/ai-cards'
                  ? `/ai-cards/?${
                      filters.isBuyNow
                        ? `search[isBuyNow]=true${
                            filters.minPrice
                              ? `&search[minPrice]=${filters.minPrice}`
                              : ''
                          }${
                            filters.maxPrice
                              ? `&search[maxPrice]=${filters.maxPrice}`
                              : ''
                          }`
                        : ''
                    }${
                      filters.isDalle3
                        ? (filters.isBuyNow ||
                          filters.minPrice ||
                          filters.maxPrice
                            ? '&'
                            : '') + 'search[isDalle3]=true'
                        : ''
                    }`
                  : decodeURIComponent(searchParams.toString());
              navigate(
                filters.isBuyNow || filters.isDalle3 ? decodedURL : queryString
              );
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
      searchParams.delete('search[minPrice]');
      searchParams.delete('search[maxPrice]');
      setPriceRange({ min: '', max: '' });
    } else {
      searchParams.set('search[isBuyNow]', 'true');
    }
    const decodedURL = decodeURIComponent(searchParams.toString());
    navigate(`../ai-cards${decodedURL ? '/?' : ''}${decodedURL}`);
  }

  function handleDALLE3SwitchSwitchClick() {
    const searchParams = new URLSearchParams(search);
    if (filters.isDalle3) {
      searchParams.delete('search[isDalle3]');
    } else {
      searchParams.set('search[isDalle3]', 'true');
    }
    const decodedURL = decodeURIComponent(searchParams.toString());
    navigate(`../ai-cards${decodedURL ? '/?' : ''}${decodedURL}`);
  }

  function handlePriceRangeChange(newPriceRange: { min: string; max: string }) {
    setPriceRange(newPriceRange);
    const searchParams = new URLSearchParams(search);
    if (newPriceRange.min)
      searchParams.set('search[minPrice]', newPriceRange.min);
    else searchParams.delete('search[minPrice]');
    if (newPriceRange.max)
      searchParams.set('search[maxPrice]', newPriceRange.max);
    else searchParams.delete('search[maxPrice]');
    const decodedURL = decodeURIComponent(searchParams.toString());
    const newURL = `../ai-cards${decodedURL ? '/?' : ''}${decodedURL}`;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      navigate(newURL);
    }, 1000);
  }
}
