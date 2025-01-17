import React, {
  memo,
  useEffect,
  useRef,
  useState,
  startTransition,
  useCallback,
  useMemo
} from 'react';
import Feed from './Feed';
import { vocabScrollHeight } from '~/constants/state';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useVirtualListWithKeys } from '~/helpers/hooks/useVirtualList';

function FeedsContainer({
  style,
  containerRef,
  contentRef,
  onSetScrollToBottom,
  scrollAtBottom,
  onSetScrollAtBottom
}: {
  style?: React.CSSProperties;
  containerRef: React.RefObject<any>;
  contentRef: React.RefObject<any>;
  onSetScrollToBottom: () => boolean;
  scrollAtBottom: boolean;
  onSetScrollAtBottom: (isAtBottom: boolean) => void;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(vocabScrollHeight.current);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const timerRef = useRef<any>(null);
  const measurementsRef = useRef<Record<string, number>>({});
  const measurementCountRef = useRef<Record<string, number>>({});

  const loadVocabularyFeeds = useAppContext(
    (v) => v.requestHelpers.loadVocabularyFeeds
  );
  const vocabFeedIds = useChatContext((v) => v.state.vocabFeedIds);
  const vocabFeedObj = useChatContext((v) => v.state.vocabFeedObj);
  const currentYear = useChatContext((v) => v.state.currentYear);
  const vocabFeedsLoadMoreButton = useChatContext(
    (v) => v.state.vocabFeedsLoadMoreButton
  );
  const onLoadMoreVocabulary = useChatContext(
    (v) => v.actions.onLoadMoreVocabulary
  );
  const { userId } = useKeyContext((v) => v.myState);

  const vocabFeeds = useMemo(
    () =>
      vocabFeedIds.map((id: number) => ({
        ...vocabFeedObj[id],
        id
      })),
    [vocabFeedIds, vocabFeedObj]
  );

  const handleLoadMore = useCallback(async () => {
    if (vocabFeedsLoadMoreButton && !loadingMore) {
      const prevContentHeight = contentRef.current?.offsetHeight || 0;
      setLoadingMore(true);
      try {
        const data = await loadVocabularyFeeds(vocabFeeds[0]?.id);
        onLoadMoreVocabulary(data);
        startTransition(() => {
          vocabScrollHeight.current = prevContentHeight;
          setScrollHeight(prevContentHeight);
        });
      } catch (error) {
        console.error(error);
      }
      setLoadingMore(false);
    }
  }, [
    vocabFeedsLoadMoreButton,
    loadingMore,
    contentRef,
    loadVocabularyFeeds,
    vocabFeeds,
    onLoadMoreVocabulary
  ]);

  const handleScroll = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (containerRef.current?.scrollTop === 0) {
        handleLoadMore();
      }
    }, 200);

    const isAtBottom = checkScrollIsAtTheBottom({
      content: contentRef.current,
      container: containerRef.current
    });

    onSetScrollAtBottom(isAtBottom);
    setShowGoToBottom(
      containerRef.current.scrollTop - contentRef.current.offsetHeight < -10000
    );
  }, [containerRef, contentRef, handleLoadMore, onSetScrollAtBottom]);

  const handleReceiveNewFeed = useCallback(() => {
    if (scrollAtBottom) {
      onSetScrollToBottom();
    }
  }, [scrollAtBottom, onSetScrollToBottom]);

  const { virtualItems, totalHeight, measureItem } = useVirtualListWithKeys({
    items: vocabFeeds,
    estimateItemHeight: 180,
    overscan: 5,
    containerRef,
    getItemKey: (item) => item.id
  });

  // Memoize the measurement handler to prevent unnecessary re-renders
  const handleMeasure = useCallback(
    (key: string | number, height: number) => {
      const currentHeight = measurementsRef.current[key];
      const measureCount = measurementCountRef.current[key] || 0;

      // Skip if we've already measured this item multiple times
      if (measureCount > 5) {
        return;
      }

      measurementCountRef.current[key] = measureCount + 1;
      const diff = Math.abs((currentHeight || 0) - height);
      const roundedHeight = Math.round(height);

      // Only update if it's the first measurement or there's a significant change
      if (!currentHeight || diff >= 5) {
        measurementsRef.current[key] = roundedHeight;
        measureItem(key, roundedHeight);
      }
    },
    [measureItem]
  );

  useEffect(() => {
    if (!vocabScrollHeight.current) onSetScrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const FeedsContainer = containerRef.current;
    if (!FeedsContainer) return;

    addEvent(FeedsContainer, 'scroll', handleScroll);
    return () => removeEvent(FeedsContainer, 'scroll', handleScroll);
  }, [containerRef, handleScroll]);

  useEffect(() => {
    if (scrollHeight) {
      (containerRef.current || {}).scrollTop =
        contentRef.current?.offsetHeight - scrollHeight;
      setTimeout(() => {
        (containerRef.current || {}).scrollTop =
          contentRef.current?.offsetHeight - scrollHeight;
      }, 100);
    }
  }, [scrollHeight, containerRef, contentRef]);

  return (
    <div ref={containerRef} style={{ paddingLeft: '1rem', ...style }}>
      {vocabFeedsLoadMoreButton ? (
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
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: ${Math.max(
              containerRef.current?.offsetHeight || 0,
              100
            )}px;
            margin-top: 1rem;
            margin-bottom: 1.5rem;
            margin-right: 1rem;
            border-radius: ${wideBorderRadius};
            background: linear-gradient(
              135deg,
              rgba(62, 138, 230, 0.2) 0%,
              rgba(255, 179, 230, 0.2) 100%
            );
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
            padding: 1rem 2rem;
            text-align: center;

            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.8rem 1rem;
            }
          `}
        >
          <div
            className={css`
              font-size: 1.6rem;
              font-weight: 700;
              color: #444;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
          >
            {`${currentYear} Word Master League`}
          </div>
          <div
            className={css`
              margin-top: 0.5rem;
              font-size: 1rem;
              font-weight: 500;
              color: #666;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.9rem;
              }
            `}
          >
            {`Good luck, and let the word battles commence!`}
          </div>
        </div>
      )}
      <div
        style={{
          position: 'relative',
          paddingRight: '1rem',
          height: totalHeight
        }}
        ref={contentRef}
      >
        {virtualItems.map((virtualItem) => {
          const feed = vocabFeeds[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                transform: `translateY(${virtualItem.start}px)`,
                width: '100%'
              }}
            >
              <Feed
                feed={feed}
                setScrollToBottom={onSetScrollToBottom}
                isLastFeed={virtualItem.index === vocabFeeds.length - 1}
                myId={userId}
                onReceiveNewFeed={handleReceiveNewFeed}
                onMeasure={(height: number) =>
                  handleMeasure(virtualItem.key, height)
                }
              />
            </div>
          );
        })}
      </div>
      {showGoToBottom && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            zIndex: 1000,
            bottom: '17rem'
          }}
        >
          <GoToBottomButton
            theme="blue"
            onClick={() => {
              onSetScrollToBottom();
              setShowGoToBottom(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(FeedsContainer);
