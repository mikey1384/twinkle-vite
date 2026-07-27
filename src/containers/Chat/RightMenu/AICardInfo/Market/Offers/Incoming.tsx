import React, { useEffect, useMemo, useState, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';

export default function Incoming() {
  const userId = useKeyContext((v) => v.myState.userId);
  const notifications = useKeyContext((v) => v.myState.notifications);
  const CardItemsRef: React.RefObject<any> = useRef(null);
  const timeoutRef: React.RefObject<any> = useRef(null);
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const [prevOfferCheckTimeStamp] = useState(
    notifications?.recentAICardOfferCheckTimeStamp
  );
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const incomingOffers = useChatContext((v) => v.state.incomingOffers);
  // The offers themselves live in shared chat state, so a remount already has
  // server-confirmed rows to show. The spinner only ever stands in for "nothing
  // has been loaded yet" - a reconnect or a post-sale refresh swaps the rows
  // underneath instead of blanking the panel.
  const [loaded, setLoaded] = useState(() => incomingOffers.length > 0);
  const onLoadIncomingOffers = useChatContext(
    (v) => v.actions.onLoadIncomingOffers
  );
  const onUpdateMostRecentAICardOfferTimeStamp = useChatContext(
    (v) => v.actions.onUpdateMostRecentAICardOfferTimeStamp
  );
  const onLoadMoreIncomingOffers = useChatContext(
    (v) => v.actions.onLoadMoreIncomingOffers
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const displayedIncomingOffers = useMemo(() => {
    return incomingOffers.map((offer: any) => ({
      ...offer,
      card: cardObj[offer.card.id]
    }));
  }, [incomingOffers, cardObj]);
  const incomingOffersLoadMoreButton = useChatContext(
    (v) => v.state.incomingOffersLoadMoreButton
  );
  const onUpdateAICardOfferCheckTimeStamp = useAppContext(
    (v) => v.user.actions.onUpdateAICardOfferCheckTimeStamp
  );
  const getIncomingCardOffers = useAppContext(
    (v) => v.requestHelpers.getIncomingCardOffers
  );

  useEffect(() => {
    const container: any = CardItemsRef.current || {};
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [displayedIncomingOffers]);

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
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_card_sold', handleAICardSold);
    socket.on('ai_card_offer_hidden', handleAICardOfferHidden);

    function handleAICardOfferPosted({ card }: { card: any }) {
      if (card.ownerId === userId) {
        loadOffers();
      }
    }
    function handleAICardOfferHidden({ ownerId }: { ownerId: number }) {
      if (ownerId === userId) {
        loadOffers();
      }
    }
    function handleAICardOfferCancel({ ownerId }: { ownerId: number }) {
      if (ownerId === userId) {
        loadOffers();
      }
    }
    function handleAICardSold({
      card,
      sellerId
    }: {
      card: any;
      sellerId: number;
    }) {
      if (card.ownerId === userId || sellerId === userId) {
        loadOffers();
      }
    }

    return function cleanUp() {
      socket.off('ai_card_offer_posted', handleAICardOfferPosted);
      socket.off('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.off('ai_card_sold', handleAICardSold);
      socket.off('ai_card_offer_hidden', handleAICardOfferHidden);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        className={css`
          height: calc(100% - 3.5rem - 1px);
          overflow: auto;
          padding: 0 0 2.4rem 0;
        `}
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
          displayedIncomingOffers.map((offer: any, index: number) => {
            return (
              <CardItem
                isOverflown={overflown}
                isNew={
                  !selectedCardIds.includes(offer.card.id) &&
                  offer.timeStamp > prevOfferCheckTimeStamp
                }
                isLast={index === displayedIncomingOffers.length - 1}
                card={offer.card}
                key={offer.id}
                onClick={() =>
                  setSelectedCardIds((cardIds) =>
                    cardIds.includes(offer.card.id)
                      ? cardIds
                      : [...cardIds, offer.card.id]
                  )
                }
                offerObj={{
                  user: offer.user,
                  price: offer.price
                }}
              />
            );
          })
        )}
        {loaded && incomingOffersLoadMoreButton && (
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

  // Every trigger - first mount, socket reconnect, and each offer/sale event -
  // goes through here so their responses can never land out of order: only the
  // newest request is allowed to write to shared state.
  async function loadOffers(retryCount = 0) {
    const requestId = ++loadRequestIdRef.current;
    try {
      const {
        offers,
        loadMoreShown,
        mostRecentOfferTimeStamp,
        recentAICardOfferCheckTimeStamp
      } = await getIncomingCardOffers();
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }
      onUpdateAICardOfferCheckTimeStamp(recentAICardOfferCheckTimeStamp);
      onUpdateMostRecentAICardOfferTimeStamp(mostRecentOfferTimeStamp || 0);
      onLoadIncomingOffers({ offers, loadMoreShown });
      setLoaded(true);
    } catch (error) {
      console.error('Error fetching offers:', error);
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
    const lastPrice =
      displayedIncomingOffers[displayedIncomingOffers.length - 1].price;
    const { offers, loadMoreShown } = await getIncomingCardOffers(lastPrice);
    onLoadMoreIncomingOffers({
      offers,
      loadMoreShown
    });
    setLoadingMore(false);
  }
}
