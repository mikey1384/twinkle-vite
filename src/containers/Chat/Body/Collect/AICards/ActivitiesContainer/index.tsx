import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import { css } from '@emotion/css';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

export default function ActivitiesContainer({
  displayedThemeColor
}: {
  displayedThemeColor: string;
}) {
  const { userId: myId, username: myUsername } = useKeyContext(
    (v) => v.myState
  );
  const loadAICardFeeds = useAppContext(
    (v) => v.requestHelpers.loadAICardFeeds
  );
  const aiCardLoadMoreButton = useChatContext(
    (v) => v.state.aiCardLoadMoreButton
  );
  const aiCardFeedIds = useChatContext((v) => v.state.aiCardFeedIds);
  const aiCardFeedObj = useChatContext((v) => v.state.aiCardFeedObj);
  const aiCardFeeds = useMemo(
    () => aiCardFeedIds.map((id: number) => aiCardFeedObj[id]),
    [aiCardFeedIds, aiCardFeedObj]
  );
  const onLoadMoreAICards = useChatContext((v) => v.actions.onLoadMoreAICards);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
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

      const isAtBottom = checkScrollIsAtTheBottom({
        content: ContentRef.current,
        container: ActivitiesContainerRef.current
      });

      setScrollAtBottom(isAtBottom);
      setShowGoToBottom(
        ActivitiesContainerRef.current.scrollTop -
          ContentRef.current.offsetHeight <
          -10000
      );
    }
  });

  const fillerHeight =
    ActivitiesContainerRef.current?.offsetHeight >
    ContentRef.current?.offsetHeight
      ? ActivitiesContainerRef.current?.offsetHeight -
        ContentRef.current?.offsetHeight
      : 20;
  const cardObj = useChatContext((v) => v.state.cardObj);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
      `}
    >
      <div
        className={css`
          flex-grow: 1;
          overflow-y: auto;
          position: relative;
        `}
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
      >
        {aiCardLoadMoreButton ? (
          <div
            className={css`
              padding: 1rem 0;
              display: flex;
              justify-content: center;
              width: 100%;
            `}
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
          {(aiCardFeeds || []).map((feed: any, index: number) => (
            <Activity
              key={feed.id || index}
              feed={feed}
              cardObj={cardObj}
              isLastActivity={aiCardFeeds && index === aiCardFeeds?.length - 1}
              onReceiveNewActivity={handleReceiveNewActivity}
              onSetScrollToBottom={handleSetScrollToBottom}
              myId={myId}
              myUsername={myUsername}
            />
          ))}
        </div>
      </div>
      <div
        className={css`
          position: absolute;
          bottom: 1rem;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 1000;
        `}
      >
        {showGoToBottom && (
          <GoToBottomButton
            theme={displayedThemeColor}
            onClick={() => {
              handleSetScrollToBottom();
              setShowGoToBottom(false);
            }}
          />
        )}
      </div>
    </div>
  );

  async function handleLoadMore() {
    try {
      if (aiCardLoadMoreButton) {
        if (!loadingMore && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          setLoadingMore(true);

          const prevScrollTop = ActivitiesContainerRef.current?.scrollTop || 0;
          const prevContentHeight = ContentRef.current?.offsetHeight || 0;

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

          requestAnimationFrame(() => {
            const newContentHeight = ContentRef.current?.offsetHeight || 0;
            const heightDifference = newContentHeight - prevContentHeight;
            ActivitiesContainerRef.current.scrollTop =
              prevScrollTop + heightDifference;

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
