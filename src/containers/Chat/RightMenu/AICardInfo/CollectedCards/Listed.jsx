import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CardItem from '../CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { useAppContext, useNotiContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';

Listed.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Listed({ loadMoreButtonColor }) {
  const [loaded, setLoaded] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const loadMyListedAICards = useAppContext(
    (v) => v.requestHelpers.loadMyListedAICards
  );
  const myListedCardIds = useChatContext((v) => v.state.myListedCardIds);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const myListedCards = useMemo(
    () => myListedCardIds.map((id) => cardObj[id]),
    [myListedCardIds, cardObj]
  );
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const myListedCardsLoadMoreButton = useChatContext(
    (v) => v.state.myListedCardsLoadMoreButton
  );
  const onLoadMyListedAICards = useChatContext(
    (v) => v.actions.onLoadMyListedAICards
  );
  const onLoadMoreMyListedAICards = useChatContext(
    (v) => v.actions.onLoadMoreMyListedAICards
  );

  useEffect(() => {
    init();
    async function init() {
      setLoaded(false);
      const { cards, loadMoreShown } = await loadMyListedAICards();
      onLoadMyListedAICards({
        cards,
        loadMoreShown
      });
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnected]);

  useEffect(() => {
    const container = CardItemsRef.current;
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [myListedCards]);

  useEffect(() => {
    const CardItems = CardItemsRef.current;
    addEvent(CardItems, 'scroll', onListScroll);

    function onListScroll() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          myListedCardsLoadMoreButton &&
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
      ) : myListedCards.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'CALC(100% - 2rem)',
            textAlign: 'center',
            padding: '3rem'
          }}
        >
          <b style={{ color: Color.darkerGray() }}>
            You have not listed any cards for sale
          </b>
        </div>
      ) : (
        myListedCards.map((card, index) => (
          <CardItem
            isOverflown={overflown}
            isLast={index === myListedCards.length - 1}
            key={card.id}
            card={card}
          />
        ))
      )}
      {loaded && myListedCardsLoadMoreButton && (
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
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = myListedCards[myListedCards.length - 1].id;
    const { cards, loadMoreShown } = await loadMyListedAICards(lastId);
    onLoadMoreMyListedAICards({
      cards,
      loadMoreShown
    });
    setLoadingMore(false);
  }
}
