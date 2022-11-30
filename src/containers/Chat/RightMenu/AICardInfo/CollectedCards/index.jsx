import { useEffect, useRef, useState } from 'react';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import CardItem from './CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

export default function CollectedCards() {
  const [loadingMore, setLoadingMore] = useState(false);
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const {
    loadMoreButton: { color: loadMoreButtonColor },
    myCollection: { color: myCollectionColor, shadow: myCollectionShadowColor }
  } = useKeyContext((v) => v.theme);
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );
  const myCards = useChatContext((v) => v.state.myCards);
  const myCardsLoadMoreButton = useChatContext(
    (v) => v.state.myCardsLoadMoreButton
  );
  const onLoadMyAICards = useChatContext((v) => v.actions.onLoadMyAICards);
  const onLoadMoreMyAICards = useChatContext(
    (v) => v.actions.onLoadMoreMyAICards
  );

  useEffect(() => {
    init();
    async function init() {
      const { myCards, myCardsLoadMoreShown } = await loadMyAICardCollections();
      onLoadMyAICards({ cards: myCards, loadMoreShown: myCardsLoadMoreShown });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const CardItems = CardItemsRef.current;
    addEvent(CardItems, 'scroll', onListScroll);

    function onListScroll() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          myCardsLoadMoreButton &&
          CardItemsRef.current.scrollTop >=
            (CardItemsRef.current.scrollHeight -
              CardItemsRef.current.offsetHeight) *
              0.7
        ) {
          handleLoadMore();
        }
      }, 250);
    }

    return function cleanUp() {
      removeEvent(CardItems, 'scroll', onListScroll);
    };
  });

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
        <b
          style={{
            color: Color[myCollectionColor](),
            textShadow: myCollectionShadowColor
              ? `0 0.05rem ${Color[myCollectionShadowColor]()}`
              : 'none'
          }}
        >
          My Collections
        </b>
      </div>
      <div
        style={{
          height: 'CALC(100% - 5rem)',
          overflow: 'scroll'
        }}
        ref={CardItemsRef}
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
    const lastId = myCards[myCards.length - 1].id;
    const { myCards: loadedCards, myCardsLoadMoreShown } =
      await loadMyAICardCollections(lastId);
    onLoadMoreMyAICards({
      cards: loadedCards,
      loadMoreShown: myCardsLoadMoreShown
    });
    setLoadingMore(false);
  }
}
