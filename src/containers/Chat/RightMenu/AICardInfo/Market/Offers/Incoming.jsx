import { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';

Incoming.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Incoming({ loadMoreButtonColor }) {
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const incomingOffers = useChatContext((v) => v.state.incomingOffers);
  const onLoadIncomingOffers = useChatContext(
    (v) => v.actions.onLoadIncomingOffers
  );
  const onLoadMoreIncomingOffers = useChatContext(
    (v) => v.actions.onLoadMoreIncomingOffers
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const displayedIncomingOffers = useMemo(() => {
    return incomingOffers.map((offer) => ({
      ...offer,
      card: cardObj[offer.card.id]
    }));
  }, [incomingOffers, cardObj]);
  const incomingOffersLoadMoreButton = useChatContext(
    (v) => v.state.incomingOffersLoadMoreButton
  );
  const getIncomingCardOffers = useAppContext(
    (v) => v.requestHelpers.getIncomingCardOffers
  );

  useEffect(() => {
    const container = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [displayedIncomingOffers]);

  useEffect(() => {
    init();
    async function init() {
      setLoaded(false);
      const { offers, loadMoreShown } = await getIncomingCardOffers();
      onLoadIncomingOffers({ offers, loadMoreShown });
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
          incomingOffersLoadMoreButton &&
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
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers/Outgoing">
      <div
        style={{
          height: 'CALC(100% - 80px)',
          overflow: 'scroll'
        }}
        ref={CardItemsRef}
      >
        {!loaded ? (
          <Loading style={{ height: '100%' }} />
        ) : displayedIncomingOffers.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'CALC(100% - 2rem)',
              padding: '3rem'
            }}
          >
            <b style={{ color: Color.darkerGray() }}>{`No incoming offers`}</b>
          </div>
        ) : (
          displayedIncomingOffers.map((offer, index) => (
            <CardItem
              isOverflown={overflown}
              isLast={index === displayedIncomingOffers.length - 1}
              card={offer.card}
              key={offer.id}
              offerObj={{
                user: offer.user,
                price: offer.offerPrice
              }}
            />
          ))
        )}
        {loaded && incomingOffersLoadMoreButton && (
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
    const lastId =
      displayedIncomingOffers[displayedIncomingOffers.length - 1].id;
    const { cards: offers, loadMoreShown } = await getIncomingCardOffers(
      lastId
    );
    onLoadMoreIncomingOffers({
      cards: offers,
      loadMoreShown
    });
    setLoadingMore(false);
  }
}
