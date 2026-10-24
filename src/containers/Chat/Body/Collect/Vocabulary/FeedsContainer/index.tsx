import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Feed from './Feed';
import { vocabScrollHeight } from '~/constants/state';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext } from '~/contexts';
import { isMobile, isTablet } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { recordOwnerTrace } from '~/helpers/ownerTrace';
import { mobileMaxWidth, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);
const HOLD_AT_NEWEST_MS = 3000;
// About three phone screens of the newest cards (~140px each on an iPhone).
const EAGER_NEWEST_FEEDS = 8;

function FeedsContainer({
  displayedThemeColor,
  style,
  contentRef,
  onWordMasterBreak
}: {
  displayedThemeColor: string;
  style?: React.CSSProperties;
  contentRef: React.RefObject<any>;
  onWordMasterBreak?: (status: any) => void;
}) {
  const loadVocabularyFeeds = useAppContext(
    (v) => v.requestHelpers.loadVocabularyFeeds
  );
  const vocabFeedsLoadMoreButton = useChatContext(
    (v) => v.state.vocabFeedsLoadMoreButton
  );
  const vocabFeedIds = useChatContext((v) => v.state.vocabFeedIds);
  const vocabFeedObj = useChatContext((v) => v.state.vocabFeedObj);
  const onLoadMoreVocabulary = useChatContext(
    (v) => v.actions.onLoadMoreVocabulary
  );
  const currentYear = useChatContext((v) => v.state.currentYear);

  const vocabFeeds = vocabFeedIds.map((id: number) => vocabFeedObj[id] || null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [showGoToBottom, setShowGoToBottom] = useState(false);

  const FeedsRef = useRef<any>(null);
  const isScrollAtBottomRef = useRef(false);
  const prevScrollPosition = useRef<number | null>(null);

  const loadMoreButtonLock = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (!vocabFeedsLoadMoreButton || loadMoreButtonLock.current) {
      return;
    }
    loadMoreButtonLock.current = true;
    setLoadingMore(true);
    prevScrollPosition.current = FeedsRef.current?.scrollTop;

    try {
      const data = await loadVocabularyFeeds(
        vocabFeeds[vocabFeeds.length - 1]?.id
      );
      onLoadMoreVocabulary(data);
    } catch (error) {
      console.error(error);
    } finally {
      loadMoreButtonLock.current = false;
      setLoadingMore(false);

      if (deviceIsMobile) {
        setTimeout(() => {
          if (FeedsRef.current && prevScrollPosition.current !== null) {
            FeedsRef.current.scrollTop = prevScrollPosition.current;
          }
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabFeedsLoadMoreButton, vocabFeeds]);

  useEffect(() => {
    if (isScrollAtBottomRef.current) handleScrollToBottom();
  }, [vocabFeeds?.length]);

  useEffect(() => {
    const Container = FeedsRef.current;
    if (!Container) return;
    const restoreTo = vocabScrollHeight.current;
    Container.scrollTop = restoreTo;
    // A returning reader keeps their place; only an open at the newest word
    // is held there.
    if (restoreTo !== 0) return;
    // On iPhone the list drifted up about a card right after opening (Mikey
    // 10-25, not reproducible in WebKit here). Hold it at the newest word
    // for the first seconds unless the user scrolls, and trace each pull back
    // so the owner trace shows what moved it.
    const startedAt = Date.now();
    let released = false;
    let frame = 0;
    const release = () => (released = true);
    const inputs = ['touchstart', 'wheel', 'pointerdown', 'keydown'];
    inputs.forEach((type) =>
      Container.addEventListener(type, release, { passive: true })
    );
    hold();
    return stop;

    function hold() {
      if (released || Date.now() - startedAt > HOLD_AT_NEWEST_MS) {
        stop();
        return;
      }
      // Sub-pixel rest positions (-0.33 on a 3x iPhone) are not a drift.
      if (Math.abs(Container.scrollTop) >= 1) {
        recordOwnerTrace('wordmaster-pin', {
          ms: Date.now() - startedAt,
          drift: Math.round(Container.scrollTop),
          scrollHeight: Container.scrollHeight,
          clientHeight: Container.clientHeight
        });
        Container.scrollTop = 0;
      }
      frame = requestAnimationFrame(hold);
    }
    function stop() {
      cancelAnimationFrame(frame);
      inputs.forEach((type) => Container.removeEventListener(type, release));
    }
  }, []);

  useEffect(() => {
    const Container = FeedsRef.current;
    addEvent(Container, 'scroll', handleScroll);
    return function cleanUp() {
      removeEvent(Container, 'scroll', handleScroll);
    };

    function handleScroll() {
      const scrollThreshold =
        (FeedsRef.current || {}).scrollHeight -
        (FeedsRef.current || {}).offsetHeight;
      const scrollTop = (FeedsRef.current || {}).scrollTop;
      const distanceFromTop = scrollThreshold + scrollTop;
      if (distanceFromTop < 3) {
        handleLoadMore();
      }
      isScrollAtBottomRef.current = (FeedsRef.current || {}).scrollTop > -10;
      setShowGoToBottom(scrollTop < -5000);
      vocabScrollHeight.current = scrollTop;
    }
  });

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/FeedsContainer">
      <div
        ref={FeedsRef}
        style={{
          padding: '0 1rem',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column-reverse',
          overflowY: 'scroll',
          ...style
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column-reverse'
          }}
          ref={contentRef}
        >
          {vocabFeeds.map((feed: any, index: number) => (
            <Feed
              key={feed.id}
              feed={feed}
              eager={index < EAGER_NEWEST_FEEDS}
              onWordMasterBreak={onWordMasterBreak}
            />
          ))}
        </div>

        <div
          key="loadMoreOrFiller"
          style={{
            paddingTop: '1rem',
            paddingBottom: '1rem',
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}
        >
          {vocabFeedsLoadMoreButton ? (
            <LoadMoreButton
              filled
              loading={loadingMore}
              onClick={handleLoadMore}
            />
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin-top: 1rem;
                margin-bottom: 1.5rem;
                margin-right: 1rem;
                border-radius: ${borderRadius};
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
                {`${currentYear} Word Master League has commenced!`}
              </div>
              <div
                className={css`
                  margin-top: 0.5rem;
                  font-size: 1.1rem;
                  font-weight: 500;
                  color: #666;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.1rem;
                  }
                `}
              >
                {`Good luck, and let the word battles begin!`}
              </div>
            </div>
          )}
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
              theme={displayedThemeColor}
              onClick={async () => {
                await handleScrollToBottom();
                setShowGoToBottom(false);
              }}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleScrollToBottom() {
    if (!FeedsRef.current) return;

    if (deviceIsMobile || deviceIsTablet) {
      FeedsRef.current.scrollTop = 0;
      FeedsRef.current.scrollTop = 1000;
      if (deviceIsTablet) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const lastMessage = FeedsRef.current.lastElementChild;
        if (lastMessage) {
          lastMessage.scrollIntoView({ block: 'end' });
        }
      }
    }
    FeedsRef.current.scrollTop = 0;
  }
}

export default memo(FeedsContainer);
