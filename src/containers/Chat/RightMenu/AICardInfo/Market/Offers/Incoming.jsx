import { useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CardItem from '../../CardItem';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext, useNotiContext } from '~/contexts';

Incoming.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Incoming({ loadMoreButtonColor }) {
  const CardItemsRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [overflown, setOverflown] = useState(false);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const incomingOfferCardIds = useChatContext(
    (v) => v.state.incomingOfferCardIds
  );
  const onLoadIncomingOffers = useChatContext(
    (v) => v.actions.onLoadIncomingOffers
  );
  const onLoadMoreIncomingOffers = useChatContext(
    (v) => v.actions.onLoadMoreIncomingOffers
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const incomingOffers = useMemo(
    () => incomingOfferCardIds.map((id) => cardObj[id]),
    [incomingOfferCardIds, cardObj]
  );
  const incomingOffersLoadMoreButton = useChatContext(
    (v) => v.state.incomingOffersLoadMoreButton
  );
  const getIncomingCardOffers = useAppContext(
    (v) => v.requestHelpers.getIncomingCardOffers
  );

  useEffect(() => {
    const container = CardItemsRef.current;
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [incomingOffers]);

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

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers/Outgoing">
      <div
        style={{
          height: 'CALC(100% - 75px)',
          overflow: 'scroll'
        }}
        ref={CardItemsRef}
      >
        {!loaded ? (
          <Loading style={{ height: '100%' }} />
        ) : incomingOffers.length === 0 ? (
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
          incomingOffers.map((card, index) => (
            <CardItem
              isOverflown={overflown}
              isLast={index === incomingOffers.length - 1}
              card={card}
              key={index}
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
    const lastId = incomingOffers[incomingOffers.length - 1].id;
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
