import { useEffect, useState } from 'react';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import CardItem from './CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function CollectedCards() {
  const [loadingMore, setLoadingMore] = useState(false);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );
  const myCards = useChatContext((v) => v.state.myCards);
  const myCardsLoadMoreButton = useChatContext(
    (v) => v.state.myCardsLoadMoreButton
  );
  const onLoadMyAICards = useChatContext((v) => v.actions.onLoadMyAICards);

  useEffect(() => {
    init();
    async function init() {
      const { myCards, myCardsLoadMoreShown } = await loadMyAICardCollections();
      onLoadMyAICards({ cards: myCards, loadMoreShown: myCardsLoadMoreShown });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%', height: '50%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 0',
          fontSize: '1.7rem',
          height: '5rem',
          borderBottom: `1px solid ${Color.borderGray()}`
        }}
      >
        <b>My Collections</b>
      </div>
      <div
        style={{
          height: 'CALC(100% - 5rem)',
          overflow: 'scroll'
        }}
      >
        {myCards.map((card, index) => (
          <CardItem key={card.id} index={index} card={card} />
        ))}
        {myCardsLoadMoreButton && (
          <LoadMoreButton
            filled
            color={loadMoreButtonColor}
            loading={loadingMore}
            onClick={handleLoadMore}
            style={{
              width: '100%',
              borderRadius: 0,
              border: 0
            }}
          />
        )}
      </div>
    </div>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
  }
}
