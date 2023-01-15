import { useState } from 'react';
import PropTypes from 'prop-types';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useExploreContext } from '~/contexts';

DefaultView.propTypes = {
  cards: PropTypes.array.isRequired,
  cardObj: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  loadAICards: PropTypes.func.isRequired,
  loadMoreButtonColor: PropTypes.string,
  navigate: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired
};

export default function DefaultView({
  cards,
  cardObj,
  loading,
  loadAICards,
  loadMoreButtonColor,
  navigate,
  search
}) {
  const loadMoreShown = useExploreContext((v) => v.state.aiCards.loadMoreShown);
  const onLoadMoreAICards = useExploreContext(
    (v) => v.actions.onLoadMoreAICards
  );
  const [loadingMore, setLoadingMore] = useState(false);

  return (
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
    </div>
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
