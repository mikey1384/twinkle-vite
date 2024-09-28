import React, { useEffect, useMemo, useState, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';

export default function Incoming() {
  const { userId, notifications } = useKeyContext((v) => v.myState);
  const CardItemsRef: React.RefObject<any> = useRef(null);
  const timeoutRef: React.MutableRefObject<any> = useRef(null);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const [prevOfferCheckTimeStamp] = useState(
    notifications?.recentAICardOfferCheckTimeStamp
  );
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
    let isMounted = true;
    let success = false;
    init();
    async function init(retryCount = 0) {
      try {
        setLoaded(false);
        const { offers, loadMoreShown, recentAICardOfferCheckTimeStamp } =
          await getIncomingCardOffers();
        if (isMounted) {
          onUpdateAICardOfferCheckTimeStamp(recentAICardOfferCheckTimeStamp);
          onLoadIncomingOffers({ offers, loadMoreShown });
          success = true;
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
        if (retryCount < 3) {
          setTimeout(() => {
            if (isMounted) init(retryCount + 1);
          }, 1000);
        }
      } finally {
        if (isMounted && (retryCount >= 3 || success)) {
          setLoaded(true);
        }
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnected]);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_card_sold', handleAICardSold);

    function handleAICardOfferPosted({ card }: { card: any }) {
      if (card.ownerId === userId) {
        refreshOffers();
      }
    }
    function handleAICardOfferCancel({ ownerId }: { ownerId: number }) {
      if (ownerId === userId) {
        refreshOffers();
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
        refreshOffers();
      }
    }

    async function refreshOffers() {
      setLoaded(false);
      const { offers, loadMoreShown, recentAICardOfferCheckTimeStamp } =
        await getIncomingCardOffers();
      onUpdateAICardOfferCheckTimeStamp(recentAICardOfferCheckTimeStamp);
      onLoadIncomingOffers({ offers, loadMoreShown });
      setLoaded(true);
    }

    return function cleanUp() {
      socket.removeListener('ai_card_offer_posted', handleAICardOfferPosted);
      socket.removeListener('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.removeListener('ai_card_sold', handleAICardSold);
    };
  });

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
