import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Link } from 'react-router-dom';
import { useAppContext, useKeyContext, useExploreContext } from '~/contexts';
import EmptyStateMessage from '~/components/EmptyStateMessage';

export default function SearchView({
  cardObj,
  filters,
  navigate,
  onSetNumCards,
  onSetTotalBv,
  search
}: {
  cardObj: any;
  filters: any;
  navigate: (url: string) => any;
  onSetNumCards: (numCards: number) => any;
  onSetTotalBv: (totalBv: number) => any;
  search: string;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );
  const filteredLoaded = useExploreContext(
    (v) => v.state.aiCards.filteredLoaded
  );
  const filteredCards = useExploreContext((v) => v.state.aiCards.filteredCards);
  const filteredLoadMoreShown = useExploreContext(
    (v) => v.state.aiCards.filteredLoadMoreShown
  );
  const onLoadFilteredAICards = useExploreContext(
    (v) => v.actions.onLoadFilteredAICards
  );
  const onLoadMoreFilteredAICards = useExploreContext(
    (v) => v.actions.onLoadMoreFilteredAICards
  );
  const onSetPrevAICardFilters = useExploreContext(
    (v) => v.actions.onSetPrevAICardFilters
  );
  const username = useKeyContext((v) => v.myState.username);
  const prevFilters = useExploreContext((v) => v.state.aiCards.prevFilters);

  useEffect(() => {
    init();
    async function init() {
      const filterChanged =
        prevFilters.owner !== filters?.owner ||
        prevFilters.style !== filters?.style ||
        prevFilters.quality !== filters?.quality ||
        prevFilters.color !== filters?.color ||
        prevFilters.word !== filters?.word ||
        prevFilters.isBuyNow !== filters?.isBuyNow ||
        prevFilters.isDalle3 !== filters?.isDalle3 ||
        prevFilters.minPrice !== filters?.minPrice ||
        prevFilters.maxPrice !== filters?.maxPrice;

      if (!filteredLoaded || filterChanged) {
        onSetNumCards(0);
        onSetTotalBv(0);
        setLoading(true);
        const { cards, loadMoreShown, numCards, totalBv } =
          await loadFilteredAICards({
            filters
          });
        onSetTotalBv(totalBv);
        onSetNumCards(numCards);
        if (!filteredLoaded || filterChanged) {
          onLoadFilteredAICards({ cards, loadMoreShown });
        }
      }
      setLoading(false);
      if (filterChanged && Object.keys(filters).length) {
        onSetPrevAICardFilters(filters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.owner,
    filters?.style,
    filters?.word,
    filters?.quality,
    filters?.color,
    filters?.isBuyNow,
    filters?.isDalle3,
    filters?.minPrice,
    filters?.maxPrice
  ]);

  const isCheckingMyCards = useMemo(() => {
    return Object.keys(filters).length === 1 && filters.owner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(filters).length, filters?.owner]);

  const noCardsLabel = useMemo(() => {
    if (Object.keys(filters).length === 1 && filters.owner) {
      return `${
        username === filters.owner ? `You don't` : `${filters.owner} doesn't`
      } own any AI Cards`;
    }
    return 'No Matching Cards';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingMyCards, username]);

  return (
    <div
      style={{
        padding: '0 3rem',
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {loading || !filteredLoaded ? (
        <Loading />
      ) : filteredCards.length ? (
        filteredCards.map((card: any) => {
          return (
            <div key={card.id} style={{ margin: '1rem' }}>
              <AICard
                card={cardObj[card.id] ? cardObj[card.id] : card}
                onClick={() => {
                  const searchParams = new URLSearchParams(search);
                  searchParams.append('cardId', card.id);
                  const decodedURL = decodeURIComponent(
                    searchParams.toString()
                  );
                  navigate(`./?${decodedURL}`);
                }}
                detailShown
              />
            </div>
          );
        })
      ) : (
        <div
          style={{
            padding: '5rem 0',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isCheckingMyCards ? (
            <EmptyStateMessage
              autoWidth
              caption={
                <Link
                  style={{ fontSize: '1.5rem' }}
                  to="/ai-cards/?search[isBuyNow]=true"
                >
                  Buy AI Cards
                </Link>
              }
            >
              {noCardsLabel}
            </EmptyStateMessage>
          ) : (
            <EmptyStateMessage style={{ width: '100%', maxWidth: '40rem' }}>
              {noCardsLabel}
            </EmptyStateMessage>
          )}
        </div>
      )}
      {filteredLoadMoreShown && !loading && (
        <div
          style={{
            flex: '0 0 100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '5rem'
          }}
        >
          <LoadMoreButton
            loading={loadingMore}
            filled
            onClick={handleLoadMoreAICards}
          />
        </div>
      )}
    </div>
  );

  async function handleLoadMoreAICards() {
    const lastCard = filteredCards[filteredCards.length - 1];
    let lastInteraction, lastPrice, lastId;
    if (filters.isBuyNow) {
      lastPrice = lastCard.askPrice;
      lastId = lastCard.id;
    } else {
      lastInteraction = lastCard.lastInteraction;
      lastId = lastCard.id;
    }
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      lastPrice,
      lastId,
      filters
    });
    onLoadMoreFilteredAICards({ cards: newCards, loadMoreShown });
    setLoadingMore(false);
  }
}
