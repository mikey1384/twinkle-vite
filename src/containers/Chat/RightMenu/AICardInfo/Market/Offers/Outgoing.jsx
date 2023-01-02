import { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';

Outgoing.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Outgoing({ loadMoreButtonColor }) {
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const outgoingOffers = useChatContext((v) => v.state.outgoingOffers);
  const onLoadOutgoingOffers = useChatContext(
    (v) => v.actions.onLoadOutgoingOffers
  );
  const onLoadMoreOutgoingOffers = useChatContext(
    (v) => v.actions.onLoadMoreOutgoingOffers
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const displayedOutgoingOffers = useMemo(
    () =>
      outgoingOffers.map((offer) => ({
        ...offer,
        card: cardObj[offer.card.id]
      })),
    [outgoingOffers, cardObj]
  );
  const outgoingOffersLoadMoreButton = useChatContext(
    (v) => v.state.outgoingOffersLoadMoreButton
  );
  const getMyAICardOffers = useAppContext(
    (v) => v.requestHelpers.getMyAICardOffers
  );

  useEffect(() => {
    const container = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [outgoingOffers]);

  useEffect(() => {
    init();
    async function init() {
      setLoaded(false);
      const { offers, loadMoreShown } = await getMyAICardOffers();
      onLoadOutgoingOffers({ offers, loadMoreShown });
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
          outgoingOffersLoadMoreButton &&
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
        className={css`
          height: CALC(100% - 80px);
          overflow: scroll;
          @media (max-width: ${mobileMaxWidth}) {
            height: CALC(100% - 71px);
          }
        `}
        ref={CardItemsRef}
      >
        {!loaded ? (
          <Loading style={{ height: '100%' }} />
        ) : displayedOutgoingOffers.length === 0 ? (
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
              You have not made any offers yet
            </b>
          </div>
        ) : (
          displayedOutgoingOffers.map((offer, index) => (
            <CardItem
              isOverflown={overflown}
              isLast={index === displayedOutgoingOffers.length - 1}
              card={offer.card}
              key={offer.id}
              offerObj={{
                user: offer.user,
                price: offer.price
              }}
            />
          ))
        )}
        {loaded && outgoingOffersLoadMoreButton && (
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
      displayedOutgoingOffers[displayedOutgoingOffers.length - 1].id;
    const { cards: offers, loadMoreShown } = await getMyAICardOffers(lastId);
    onLoadMoreOutgoingOffers({
      cards: offers,
      loadMoreShown
    });
    setLoadingMore(false);
  }
}
