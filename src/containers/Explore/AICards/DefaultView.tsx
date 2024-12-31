import React, { useState } from 'react';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useExploreContext } from '~/contexts';

export default function DefaultView({
  cards,
  cardObj,
  loading,
  loadAICards,
  navigate,
  search
}: {
  cards: any[];
  cardObj: any;
  loading: boolean;
  loadAICards: (lastInteraction: number, lastId: number) => any;
  navigate: (url: string) => any;
  search: string;
}) {
  const loadMoreShown = useExploreContext((v) => v.state.aiCards.loadMoreShown);
  const onLoadMoreAICards = useExploreContext(
    (v) => v.actions.onLoadMoreAICards
  );
  const [loadingMore, setLoadingMore] = useState(false);

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
          onClick={handleLoadMoreAICards}
        />
      )}
    </div>
  );

  async function handleLoadMoreAICards() {
    const lastInteraction = cards[cards.length - 1]?.lastInteraction;
    setLoadingMore(true);
    const lastId = cards[cards.length - 1]?.id;
    const { cards: newCards, loadMoreShown } = await loadAICards(
      lastInteraction,
      lastId
    );
    onLoadMoreAICards({ cards: newCards, loadMoreShown });
    setLoadingMore(false);
  }
}
