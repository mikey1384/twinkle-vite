import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useExploreContext } from '~/contexts';

SearchView.propTypes = {
  cardObj: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  onSetNumCards: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired
};

export default function SearchView({
  cardObj,
  filters,
  navigate,
  onSetNumCards,
  search
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
  const prevFilters = useExploreContext((v) => v.state.aiCards.prevFilters);

  useEffect(() => {
    init();
    async function init() {
      const filterChanged =
        prevFilters.owner !== filters?.owner ||
        prevFilters.quality !== filters?.quality ||
        prevFilters.color !== filters?.color ||
        prevFilters.isBuyNow !== filters?.isBuyNow;
      if (!filteredLoaded || filterChanged) {
        onSetNumCards(0);
        setLoading(true);
        const { cards, loadMoreShown, numCards } = await loadFilteredAICards({
          filters
        });
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
  }, [filters?.owner, filters?.quality, filters?.color, filters?.isBuyNow]);

  return (
    <div
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {loading || !filteredLoaded ? (
        <Loading />
      ) : filteredCards.length ? (
        filteredCards.map((card) => (
          <div key={card.id} style={{ margin: '1rem' }}>
            <AICard
              card={cardObj[card.id] ? cardObj[card.id] : card}
              onClick={() => {
                const searchParams = new URLSearchParams(search);
                searchParams.append('cardId', card.id);
                const decodedURL = decodeURIComponent(searchParams.toString());
                navigate(`./?${decodedURL}`);
              }}
              detailShown
            />
          </div>
        ))
      ) : (
        <div style={{ fontWeight: 'bold', fontSize: '2rem', padding: '5rem' }}>
          No Matching Cards
        </div>
      )}
      {filteredLoadMoreShown && !loading && (
        <LoadMoreButton
          loading={loadingMore}
          style={{ marginTop: '5rem' }}
          filled
          onClick={handleLoadMoreAICards}
        />
      )}
    </div>
  );

  async function handleLoadMoreAICards() {
    const lastInteraction =
      filteredCards[filteredCards.length - 1]?.lastInteraction;
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      filters
    });
    onLoadMoreFilteredAICards({ cards: newCards, loadMoreShown });
    setLoadingMore(false);
  }
}
