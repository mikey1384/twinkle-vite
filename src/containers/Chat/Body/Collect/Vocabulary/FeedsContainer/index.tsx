import React, { useCallback, useEffect, useRef, useState } from 'react';
import Feed from './Feed';
import { vocabScrollHeight } from '~/constants/state';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, isTablet } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

export default function FeedsContainer({
  style,
  contentRef
}: {
  style?: React.CSSProperties;
  contentRef: React.RefObject<any>;
}) {
  const { userId } = useKeyContext((v) => v.myState);
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
    if (FeedsRef.current) {
      FeedsRef.current.scrollTop = vocabScrollHeight.current;
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
              isLastFeed={index === vocabFeeds.length - 1}
              myId={userId}
            />
          ))}
        </div>

        <div
          key="loadMoreOrFiller"
          style={{
            marginTop: '1rem',
            marginBottom: '1rem',
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
