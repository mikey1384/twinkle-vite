import React, { useEffect, useRef, useState, startTransition } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

export default function ActivitiesContainer() {
  const { userId: myId, username: myUsername } = useKeyContext(
    (v) => v.myState
  );
  const loadAICardFeeds = useAppContext(
    (v) => v.requestHelpers.loadAICardFeeds
  );
  const aiCardLoadMoreButton = useChatContext(
    (v) => v.state.aiCardLoadMoreButton
  );
  const onLoadMoreAICards = useChatContext((v) => v.actions.onLoadMoreAICards);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const loadingMoreRef = useRef(false);
  const ActivitiesContainerRef: React.RefObject<any> = useRef(null);
  const ContentRef: React.RefObject<any> = useRef(null);
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
  const aiCardFeeds = useChatContext((v) => v.state.aiCardFeeds);
  const cardObj = useChatContext((v) => v.state.cardObj);

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
      {aiCardLoadMoreButton ? (
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
      <div
        style={{
          position: 'relative'
        }}
        ref={ContentRef}
      >
        {(aiCardFeeds || []).map((feed: any, index: number) => {
          return (
            <Activity
              key={feed.id}
              feed={feed}
              cardObj={cardObj}
              isLastActivity={aiCardFeeds && index === aiCardFeeds?.length - 1}
              onReceiveNewActivity={handleReceiveNewActivity}
              onSetScrollToBottom={handleSetScrollToBottom}
              myId={myId}
              myUsername={myUsername}
            />
          );
        })}
      </div>
    </div>
  );

  async function handleLoadMore() {
    try {
      if (aiCardLoadMoreButton) {
        const prevContentHeight = ContentRef.current?.offsetHeight || 0;
        if (!loadingMore && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          setLoadingMore(true);
          const {
            cardFeeds,
            cardObj,
            loadMoreShown,
            mostRecentOfferTimeStamp
          } = await loadAICardFeeds(aiCardFeeds?.[0]?.id);
          onLoadMoreAICards({
            cardFeeds,
            cardObj,
            loadMoreShown,
            mostRecentOfferTimeStamp
          });
          startTransition(() => {
            setScrollHeight(prevContentHeight);
            setLoadingMore(false);
            loadingMoreRef.current = false;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setLoadingMore(false);
      loadingMoreRef.current = false;
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
