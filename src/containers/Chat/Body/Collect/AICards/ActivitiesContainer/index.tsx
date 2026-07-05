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
import { aiCardScrollHeight } from '~/constants/state';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

// column-reverse: scrollTop is 0 at the bottom and negative when scrolled up.
// Native bottom-pinning only happens at exactly 0; past that, scroll anchoring
// keeps the old content in view when a new card is inserted, so positions
// within this band are treated as "at bottom" and re-pinned manually when
// another user's feed arrives. The user's own summons use a wider band of one
// viewport height (see pinBand below).
const SCROLL_AT_BOTTOM_BAND = 100;

export default function ActivitiesContainer({
  displayedThemeColor
}: {
  displayedThemeColor: string;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const myUsername = useKeyContext((v) => v.myState.username);
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
  // seeded from the persisted position: the mount restore effect runs before
  // any feed can arrive, so a hardcoded 0 would let a feed arriving within
  // the first frame re-pin to bottom and wipe the restore
  const scrollTopBeforeChangeRef = useRef(aiCardScrollHeight.current);
  const prevFeedsLengthRef = useRef(aiCardFeeds.length);
  const prevNewestFeedIdRef = useRef(aiCardFeeds?.[0]?.id);
  const prevScrollPosition = useRef<number | null>(null);

  // Render-phase snapshot: this render was caused by the feed-list change, but
  // the DOM has not been mutated yet, so scroll anchoring has not had a chance
  // to shift scrollTop away from the bottom. Reading the pre-insert position
  // here is the only reliable option — by the time the post-commit effect
  // runs, anchoring has already moved scrollTop by a full card height and
  // fired a scroll event, so any scroll-listener-maintained value is stale.
  if (aiCardFeeds.length !== prevFeedsLengthRef.current) {
    prevFeedsLengthRef.current = aiCardFeeds.length;
    if (ActivitiesRef.current) {
      scrollTopBeforeChangeRef.current = ActivitiesRef.current.scrollTop;
    }
  }

  const loadMoreButtonLock = useRef(false);

  // scroll events can invoke a handleLoadMore closure from a previous render
  // after the lock is released; reading the cursor from a ref instead of the
  // closure prevents refetching a page that was already appended
  const aiCardFeedsRef = useRef(aiCardFeeds);
  useEffect(() => {
    aiCardFeedsRef.current = aiCardFeeds;
  }, [aiCardFeeds]);

  const handleLoadMore = useCallback(async () => {
    if (!aiCardLoadMoreButton || loadMoreButtonLock.current) return;

    loadMoreButtonLock.current = true;
    setLoadingMore(true);
    prevScrollPosition.current = ActivitiesRef.current?.scrollTop;

    try {
      const loadedFeeds = aiCardFeedsRef.current;
      const { cardFeeds, cardObj, loadMoreShown, mostRecentOfferTimeStamp } =
        await loadAICardFeeds(loadedFeeds?.[loadedFeeds.length - 1]?.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCardLoadMoreButton]);

  useEffect(() => {
    const newestFeed = aiCardFeeds?.[0];
    const newestFeedChanged = newestFeed?.id !== prevNewestFeedIdRef.current;
    prevNewestFeedIdRef.current = newestFeed?.id;
    // load-more appends older feeds at the top; only a new newest feed means
    // something was inserted at the bottom of the view
    if (!newestFeedChanged) return;
    // The summoner gets a much wider "at bottom" zone (one viewport height):
    // positions that merely look like the bottom next to 500-900px cards must
    // still show the card they just summoned. Beyond that they are deliberately
    // reading old cards, so stay anchored like for other users' feeds.
    const isMyOwnSummon =
      newestFeed?.type === 'summon' &&
      cardObj[newestFeed?.contentId]?.creator?.id === myId;
    const pinBand = isMyOwnSummon
      ? Math.max(
          ActivitiesRef.current?.clientHeight || 0,
          SCROLL_AT_BOTTOM_BAND
        )
      : SCROLL_AT_BOTTOM_BAND;
    if (scrollTopBeforeChangeRef.current > -pinBand) {
      handleScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiCardFeeds?.length]);

  useEffect(() => {
    (ActivitiesRef.current || {}).scrollTop = aiCardScrollHeight.current;
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
      setShowGoToBottom(scrollTop < -5000);
      aiCardScrollHeight.current = scrollTop;
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
