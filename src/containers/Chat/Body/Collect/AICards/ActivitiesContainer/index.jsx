import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import PropTypes from 'prop-types';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

ActivitiesContainer.propTypes = {
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function ActivitiesContainer({ onSetAICardModalCardId }) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const { userId: myId } = useKeyContext((v) => v.myState);
  const loadAIImageChat = useAppContext(
    (v) => v.requestHelpers.loadAIImageChat
  );
  const aiDrawingsLoadMoreButton = useChatContext(
    (v) => v.state.aiDrawingsLoadMoreButton
  );
  const onLoadMoreAIImages = useChatContext(
    (v) => v.actions.onLoadMoreAIImages
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const timerRef = useRef(null);
  const ActivitiesContainerRef = useRef(null);
  const ContentRef = useRef(null);
  useEffect(() => {
    handleSetScrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const ActivitiesContainer = ActivitiesContainerRef.current;
    addEvent(ActivitiesContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(ActivitiesContainer, 'scroll', handleScroll);
    };

    function handleScroll() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (ActivitiesContainerRef.current?.scrollTop === 0) {
          handleLoadMore();
        }
      }, 100);
    }
  });
  useEffect(() => {
    if (scrollHeight) {
      (ActivitiesContainerRef.current || {}).scrollTop =
        ContentRef.current?.offsetHeight - scrollHeight;
    }
  }, [scrollHeight]);
  const fillerHeight =
    ActivitiesContainerRef.current?.offsetHeight >
    ContentRef.current?.offsetHeight
      ? ActivitiesContainerRef.current?.offsetHeight -
        ContentRef.current?.offsetHeight
      : 20;
  const aiCardIds = useChatContext((v) => v.state.aiCardIds);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const aiCards = useMemo(
    () => aiCardIds.map((id) => cardObj[id]),
    [aiCardIds, cardObj]
  );

  return (
    <div
      ref={ActivitiesContainerRef}
      onScroll={() => {
        if (
          checkScrollIsAtTheBottom({
            content: ContentRef.current,
            container: ActivitiesContainerRef.current
          })
        ) {
          setScrollAtBottom(true);
        } else {
          setScrollAtBottom(false);
        }
      }}
      style={{
        zIndex: 5,
        width: '100%',
        height: 'CALC(100% - 6.5rem)',
        overflow: 'scroll'
      }}
    >
      {aiDrawingsLoadMoreButton ? (
        <div
          style={{
            marginTop: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          <LoadMoreButton
            filled
            color={loadMoreButtonColor}
            loading={loadingMore}
            onClick={handleLoadMore}
          />
        </div>
      ) : (
        <div
          style={{
            height: fillerHeight + 'px'
          }}
        />
      )}
      <div style={{ position: 'relative' }} ref={ContentRef}>
        {aiCards.map((row, index) => {
          return (
            <Activity
              key={row.id}
              card={row}
              isLastActivity={index === aiCardIds.length - 1}
              onReceiveNewActivity={handleReceiveNewActivity}
              onSetScrollToBottom={handleSetScrollToBottom}
              onSetAICardModalCardId={onSetAICardModalCardId}
              myId={myId}
            />
          );
        })}
      </div>
    </div>
  );

  async function handleLoadMore() {
    if (aiDrawingsLoadMoreButton) {
      const prevContentHeight = ContentRef.current?.offsetHeight || 0;
      if (!loadingMore) {
        setLoadingMore(true);
        const { cards, loadMoreShown } = await loadAIImageChat(aiCardIds[0]);
        onLoadMoreAIImages({ cards, loadMoreShown });
        startTransition(() => {
          setScrollHeight(prevContentHeight);
        });
        setLoadingMore(false);
      }
    }
  }

  function handleReceiveNewActivity() {
    if (scrollAtBottom) {
      handleSetScrollToBottom();
    }
  }

  function handleSetScrollToBottom() {
    ActivitiesContainerRef.current.scrollTop =
      ContentRef.current?.offsetHeight || 0;
    setTimeout(
      () =>
        ((ActivitiesContainerRef.current || {}).scrollTop =
          ContentRef.current?.offsetHeight || 0),
      100
    );
    if (ContentRef.current?.offsetHeight) setScrollAtBottom(true);
  }
}
