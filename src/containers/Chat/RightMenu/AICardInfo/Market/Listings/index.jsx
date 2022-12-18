import { useEffect, useRef, useState } from 'react';
import {
  useAppContext,
  useChatContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import AICardModal from '~/components/Modals/AICardModal';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Listing from './Listing';
import Loading from '~/components/Loading';

export default function Listings() {
  const CardItemsRef = useRef(null);
  const [overflown, setOverflown] = useState(false);
  const [cardModalCard, setCardModalCard] = useState(null);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const listedCards = useChatContext((v) => v.state.listedCards);
  const listedCardsLoadMoreButton = useChatContext(
    (v) => v.state.listedCardsLoadMoreButton
  );

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
    const container = CardItemsRef.current;
    setOverflown(container.offsetHeight < container.scrollHeight);
  }, [listedCards]);

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Listings">
      <div
        style={{
          height: 'CALC(100% - 45px)',
          overflow: 'scroll'
        }}
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
              height: 'CALC(100% - 2rem)'
            }}
          >
            <b style={{ color: Color.darkerGray() }}>No cards collected</b>
          </div>
        ) : (
          listedCards.map((card, index) => (
            <Listing
              card={card}
              onSetCardModalCard={setCardModalCard}
              isOverflown={overflown}
              isLast={index === listedCards.length - 1}
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
      {cardModalCard && (
        <AICardModal
          card={cardModalCard}
          onHide={() => setCardModalCard(null)}
          onDelist={() =>
            setCardModalCard((card) => ({
              ...card,
              isListed: false,
              askPrice: 0
            }))
          }
        />
      )}
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = listedCards[listedCards.length - 1].id;
    const { cards: listedCards, loadMoreShown: listedCardsLoadMoreShown } =
      await loadListedAICards(lastId);
    onLoadMoreListedAICards({
      cards: listedCards,
      loadMoreShown: listedCardsLoadMoreShown
    });
    setLoadingMore(false);
  }
}
