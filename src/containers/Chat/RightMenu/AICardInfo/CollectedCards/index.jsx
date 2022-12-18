import { useEffect, useRef, useState } from 'react';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useNotiContext,
  useKeyContext,
  useChatContext
} from '~/contexts';
import CardItem from './CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

export default function CollectedCards() {
  const [activeTab, setActiveTab] = useState('myCollection');
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const CardItemsRef = useRef(null);
  const timeoutRef = useRef(null);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );
  const myCards = useChatContext((v) => v.state.myCards);
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
      onLoadMyAICards({ cards: myCards, loadMoreShown: myCardsLoadMoreShown });
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
    <div style={{ width: '100%', height: '50%' }}>
      <FilterBar
        style={{ height: '4.5rem', fontSize: '1.5rem', marginBottom: 0 }}
      >
        <nav
          className={activeTab === 'myCollection' ? 'active' : ''}
          onClick={() => setActiveTab('myCollection')}
        >
          My Collections
        </nav>
        <nav
          className={activeTab === 'myListed' ? 'active' : ''}
          onClick={() => setActiveTab('myListed')}
        >
          Listed
        </nav>
      </FilterBar>
      <div
        style={{
          height: 'CALC(100% - 5rem)',
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
          myCards.map((card) => <CardItem key={card.id} card={card} />)
        )}
        {loaded && myCardsLoadMoreButton && (
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
    </div>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = myCards[myCards.length - 1].id;
    const { myCards: loadedCards, myCardsLoadMoreShown } =
      await loadMyAICardCollections(lastId);
    onLoadMoreMyAICards({
      cards: loadedCards,
      loadMoreShown: myCardsLoadMoreShown
    });
    setLoadingMore(false);
  }
}
