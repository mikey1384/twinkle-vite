import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../CardItem';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Listings.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Listings({ loadMoreButtonColor }) {
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const loadListedAICards = useAppContext(
    (v) => v.requestHelpers.loadListedAICards
  );
  const onLoadListedAICards = useChatContext(
    (v) => v.actions.onLoadListedAICards
  );
  const onLoadMoreListedAICards = useChatContext(
    (v) => v.actions.onLoadMoreListedAICards
  );
  const listedCardIds = useChatContext((v) => v.state.listedCardIds);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const listedCards = useMemo(
    () => listedCardIds.filter((id) => !!cardObj[id]).map((id) => cardObj[id]),
    [listedCardIds, cardObj]
  );
  const listedCardsLoadMoreButton = useChatContext(
    (v) => v.state.listedCardsLoadMoreButton
  );

  useEffect(() => {
    const container = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [listedCards]);

  useEffect(() => {
    init();
    async function init() {
      setLoaded(false);
      const { cards: listedCards, loadMoreShown: listedCardsLoadMoreShown } =
        await loadListedAICards();
      onLoadListedAICards({
        cards: listedCards,
        loadMoreShown: listedCardsLoadMoreShown
      });
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnected]);

  useEffect(() => {
    const CardItems = CardItemsRef.current;
    addEvent(CardItems, 'scroll', onListScroll);

    function onListScroll() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          listedCardsLoadMoreButton &&
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
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Listings">
      <div
        className={css`
          height: CALC(100% - 45px);
          overflow: scroll;
          @media (max-width: ${mobileMaxWidth}) {
            height: CALC(100% - 36px);
          }
        `}
        ref={CardItemsRef}
      >
        {!loaded ? (
          <Loading style={{ height: '100%' }} />
        ) : listedCards.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'CALC(100% - 2rem)',
              padding: '3rem'
            }}
          >
            <b style={{ color: Color.darkerGray() }}>
              There are no cards you can buy at the moment
            </b>
          </div>
        ) : (
          listedCards.map((card, index) => (
            <CardItem
              isOverflown={overflown}
              isLast={index === listedCards.length - 1}
              card={card}
              key={index}
            />
          ))
        )}
        {loaded && listedCardsLoadMoreButton && (
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
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = listedCards[listedCards.length - 1].id;
    const { cards: newListedCards, loadMoreShown: listedCardsLoadMoreShown } =
      await loadListedAICards(lastId);
    onLoadMoreListedAICards({
      cards: newListedCards,
      loadMoreShown: listedCardsLoadMoreShown
    });
    setLoadingMore(false);
  }
}
