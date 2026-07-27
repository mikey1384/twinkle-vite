import React, { useEffect, useMemo, useState, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';

export default function Outgoing() {
  const CardItemsRef: React.RefObject<any> = useRef(null);
  const timeoutRef: React.RefObject<any> = useRef(null);
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const outgoingOffers = useChatContext((v) => v.state.outgoingOffers);
  // Same rule as the incoming list: the spinner only stands in for "nothing has
  // been loaded yet", so a reconnect refreshes the rows in place.
  const [loaded, setLoaded] = useState(() => outgoingOffers.length > 0);
  const onLoadOutgoingOffers = useChatContext(
    (v) => v.actions.onLoadOutgoingOffers
  );
  const onLoadMoreOutgoingOffers = useChatContext(
    (v) => v.actions.onLoadMoreOutgoingOffers
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const displayedOutgoingOffers = useMemo(
    () =>
      outgoingOffers.map((offer: any) => ({
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
    const container: any = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [outgoingOffers]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadOffers();
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
          height: calc(100% - 3.5rem - 1px);
          overflow: auto;
          padding: 0 0 2.4rem 0;
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
              You have no outgoing offers
            </b>
          </div>
        ) : (
          displayedOutgoingOffers.map((offer: any, index: number) => (
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

  // Only the newest request is allowed to write to shared state, so a reconnect
  // that overlaps an in-flight read can never resurrect the older response.
  async function loadOffers(retryCount = 0) {
    const requestId = ++loadRequestIdRef.current;
    try {
      const { offers, loadMoreShown } = await getMyAICardOffers();
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }
      onLoadOutgoingOffers({ offers, loadMoreShown });
      setLoaded(true);
    } catch (error) {
      console.error('Error fetching my AI card offers:', error);
      const isStale =
        !isMountedRef.current || requestId !== loadRequestIdRef.current;
      if (isStale) return;
      if (retryCount < 3) {
        setTimeout(() => {
          if (isMountedRef.current && requestId === loadRequestIdRef.current) {
            loadOffers(retryCount + 1);
          }
        }, 1000);
        return;
      }
      setLoaded(true);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId =
      displayedOutgoingOffers[displayedOutgoingOffers.length - 1].id;
    const { offers, loadMoreShown } = await getMyAICardOffers(lastId);
    onLoadMoreOutgoingOffers({
      offers,
      loadMoreShown
    });
    setLoadingMore(false);
  }
}
