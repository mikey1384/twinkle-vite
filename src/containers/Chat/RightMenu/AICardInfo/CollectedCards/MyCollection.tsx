import React, { useEffect, useMemo, useRef, useState } from 'react';
import CardItem from '../CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { useAppContext, useNotiContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function MyCollection() {
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const loadingMoreRef = useRef(false);
  const CardItemsRef: React.RefObject<any> = useRef(null);
  const timeoutRef: React.MutableRefObject<any> = useRef(null);
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );
  const myCardIds = useChatContext((v) => v.state.myCardIds);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const myCards = useMemo(
    () =>
      myCardIds
        .filter((id: number) => !!cardObj[id])
        .map((id: number) => cardObj[id]),
    [myCardIds, cardObj]
  );
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
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
      setLoaded(false);
      const { myCards, myCardsLoadMoreShown } = await loadMyAICardCollections();
      onLoadMyAICards({
        cards: myCards,
        loadMoreShown: myCardsLoadMoreShown
      });
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnected]);

  useEffect(() => {
    const container: any = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [myCards]);

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
    <div
      style={{
        height: '100%',
        overflow: 'scroll'
      }}
      ref={CardItemsRef}
    >
      {!loaded ? (
        <Loading style={{ height: '100%' }} />
      ) : myCards.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'CALC(100% - 2rem)'
          }}
        >
          <b style={{ color: Color.darkerGray() }}>No cards collected</b>
        </div>
      ) : (
        myCards.map((card: any, index: number) => (
          <CardItem
            isOverflown={overflown}
            isLast={index === myCards.length - 1}
            key={card.id}
            card={card}
          />
        ))
      )}
      {loaded && myCardsLoadMoreButton && (
        <LoadMoreButton
          filled
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
  );

  async function handleLoadMore() {
    if (loadingMore || loadingMoreRef.current) return;
    try {
      setLoadingMore(true);
      loadingMoreRef.current = true;
      const lastTimeStamp = myCards[myCards.length - 1].lastInteraction;
      const lastId = myCards[myCards.length - 1].id;
      const { myCards: loadedCards, myCardsLoadMoreShown } =
        await loadMyAICardCollections({ lastTimeStamp, lastId });
      onLoadMoreMyAICards({
        cards: loadedCards,
        loadMoreShown: myCardsLoadMoreShown
      });
      setLoadingMore(false);
      loadingMoreRef.current = false;
    } catch (error) {
      console.error(error);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }
}
