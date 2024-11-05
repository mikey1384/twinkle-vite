import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, isTablet } from '~/helpers';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

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
  const cardObj = useChatContext((v) => v.state.cardObj);
  const onLoadMoreAICards = useChatContext((v) => v.actions.onLoadMoreAICards);

  const aiCardFeeds = useMemo(
    () => aiCardFeedIds.map((id: number) => aiCardFeedObj[id]),
    [aiCardFeedIds, aiCardFeedObj]
  );

  const [loadingMore, setLoadingMore] = useState(false);
  const [showGoToBottom, setShowGoToBottom] = useState(false);

  const ActivitiesRef = useRef<any>(null);
  const prevScrollPosition = useRef<number | null>(null);

  const loadMoreButtonLock = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (!aiCardLoadMoreButton || loadMoreButtonLock.current) return;

    loadMoreButtonLock.current = true;
    setLoadingMore(true);
    prevScrollPosition.current = ActivitiesRef.current?.scrollTop;

    try {
      const { cardFeeds, cardObj, loadMoreShown, mostRecentOfferTimeStamp } =
        await loadAICardFeeds(aiCardFeeds?.[aiCardFeeds.length - 1]?.id);

      onLoadMoreAICards({
        cardFeeds,
        cardObj,
        loadMoreShown,
        mostRecentOfferTimeStamp
      });
    } catch (error) {
      console.error(error);
    } finally {
      loadMoreButtonLock.current = false;
      setLoadingMore(false);

      if (deviceIsMobile) {
        setTimeout(() => {
          if (ActivitiesRef.current && prevScrollPosition.current !== null) {
            ActivitiesRef.current.scrollTop = prevScrollPosition.current;
          }
        }, 50);
      }
    }
  }, [aiCardLoadMoreButton, aiCardFeeds, loadAICardFeeds, onLoadMoreAICards]);

  useEffect(() => {
    handleScrollToBottom();
  }, []);

  useEffect(() => {
    const ActivitiesContainer = ActivitiesRef.current;
    addEvent(ActivitiesContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(ActivitiesContainer, 'scroll', handleScroll);
    };

    function handleScroll() {
      const scrollThreshold =
        (ActivitiesRef.current || {}).scrollHeight -
        (ActivitiesRef.current || {}).offsetHeight;
      const scrollTop = (ActivitiesRef.current || {}).scrollTop;
      const distanceFromTop = scrollThreshold + scrollTop;
      if (distanceFromTop < 3) {
        handleLoadMore();
      }
      setShowGoToBottom(scrollTop < -10000);
    }
  });

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/AICards/ActivitiesContainer">
      <div
        ref={ActivitiesRef}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column-reverse',
          overflowY: 'scroll'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          {aiCardFeeds.map((feed: any, index: number) => (
            <Activity
              key={feed.id}
              isLastActivity={index === aiCardFeeds.length - 1}
              cardObj={cardObj}
              feed={feed}
              myId={myId}
              myUsername={myUsername}
              onReceiveNewActivity={() => {}}
              onSetScrollToBottom={() => {}}
            />
          ))}
          {aiCardLoadMoreButton && (
            <LoadMoreButton
              filled
              loading={loadingMore}
              onClick={handleLoadMore}
              style={{ margin: '1rem auto' }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '7.5rem',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        {showGoToBottom && (
          <GoToBottomButton
            theme={displayedThemeColor}
            onClick={() => {
              handleScrollToBottom();
              setShowGoToBottom(false);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleScrollToBottom() {
    if (ActivitiesRef.current) {
      if (deviceIsMobile || deviceIsTablet) {
        (ActivitiesRef.current || {}).scrollTop = 0;
        (ActivitiesRef.current || {}).scrollTop = 1000;
        if (deviceIsTablet) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const lastMessage = ActivitiesRef.current.lastElementChild;
          if (lastMessage) {
            lastMessage.scrollIntoView({ block: 'end' });
          }
        }
      }
      (ActivitiesRef.current || {}).scrollTop = 0;
    }
  }
}
