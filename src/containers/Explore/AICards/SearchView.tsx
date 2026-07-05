import React, { useEffect, useMemo, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Link } from 'react-router-dom';
import { useAppContext, useKeyContext, useExploreContext } from '~/contexts';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import reportAICardIssueEvent from '~/helpers/reportAICardIssueEvent';
import {
  aiCardSearchFiltersDiffer,
  findAICardFilterMismatches
} from './searchFilterUtils';

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
  const searchVersionRef = useRef(0);
  // True from the moment the active filters change until the matching fetch
  // has committed (prevFilters is only updated alongside the fetched cards).
  // Rendering Loading off this render-derived flag guarantees stale results
  // are never painted next to new filter UI, not even for one frame.
  const filtersDirty = useMemo(
    () => aiCardSearchFiltersDiffer(prevFilters, filters),
    [prevFilters, filters]
  );

  useEffect(() => {
    let cancelled = false;
    searchVersionRef.current += 1;
    init();
    async function init() {
      const filterChanged = aiCardSearchFiltersDiffer(prevFilters, filters);

      if (!filteredLoaded || filterChanged) {
        onSetNumCards(0);
        onSetTotalBv(0);
        setLoading(true);
        const { cards, loadMoreShown, numCards, totalBv } =
          await loadFilteredAICards({
            filters
          });
        handleReportFilterMismatches({ cards, filters });
        if (cancelled) return;
        onSetTotalBv(totalBv);
        onSetNumCards(numCards);
        if (!filteredLoaded || filterChanged) {
          onLoadFilteredAICards({ cards, loadMoreShown });
        }
      }
      if (cancelled) return;
      setLoading(false);
      if (filterChanged && Object.keys(filters)?.length) {
        onSetPrevAICardFilters(filters);
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.owner,
    filters?.style,
    filters?.word,
    filters?.quality,
    filters?.color,
    filters?.isBuyNow,
    filters?.isMystery,
    filters?.engine,
    filters?.minPrice,
    filters?.maxPrice
  ]);

  const isCheckingMyCards = useMemo(() => {
    return Object.keys(filters)?.length === 1 && filters.owner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(filters)?.length, filters?.owner]);

  const noCardsLabel = useMemo(() => {
    if (Object.keys(filters)?.length === 1 && filters.owner) {
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
      {loading || !filteredLoaded || filtersDirty ? (
        <Loading />
      ) : filteredCards?.length ? (
        filteredCards.map((card: any) => {
          return (
            <div
              key={card.id}
              data-scroll-anchor-id={`explore-ai-cards:filtered:${card.id}`}
              data-scroll-anchor-secondary-id={String(card.id)}
              data-scroll-anchor-content-key={`ai-card:${card.id}`}
              style={{ margin: '1rem' }}
            >
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
            padding: '5rem 1rem',
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
      {filteredLoadMoreShown && !loading && !filtersDirty && (
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
    const searchVersion = searchVersionRef.current;
    const lastCard = filteredCards[filteredCards?.length - 1];
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
    handleReportFilterMismatches({ cards: newCards, filters, loadMore: true });
    if (searchVersion === searchVersionRef.current) {
      onLoadMoreFilteredAICards({ cards: newCards, loadMoreShown });
    }
    setLoadingMore(false);
  }

  // Validates every filtered-search response against the filters that
  // requested it (the request/response pair stays valid evidence even if the
  // user has already moved on). Fire-and-forget telemetry, surfaced in
  // Management > Performance > AI Cards.
  function handleReportFilterMismatches({
    cards,
    filters: requestFilters,
    loadMore
  }: {
    cards: any[];
    filters: any;
    loadMore?: boolean;
  }) {
    const mismatches = findAICardFilterMismatches(cards || [], requestFilters);
    if (!mismatches.length) return;
    reportAICardIssueEvent({
      issueType: 'filter_mismatch',
      pathname: `${window.location.pathname}${window.location.search}`,
      filters: requestFilters,
      details: {
        mismatches: mismatches.slice(0, 5),
        mismatchCount: mismatches.length,
        cardsReturned: cards?.length || 0,
        loadMore: !!loadMore
      }
    });
  }
}
