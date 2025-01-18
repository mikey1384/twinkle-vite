import React, { memo, useEffect, useRef, useState } from 'react';
import Feed from './Feed';
import { vocabScrollHeight } from '~/constants/state';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { isMobile, isTablet } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

function FeedsContainer({
  style,
  containerRef,
  contentRef
}: {
  style?: React.CSSProperties;
  containerRef: React.RefObject<any>;
  contentRef: React.RefObject<any>;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const prevScrollPosition = useRef<number | null>(null);
  const loadMoreButtonLock = useRef(false);
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

  const vocabFeeds = vocabFeedIds.map((id: number) => vocabFeedObj[id] || null);

  useEffect(() => {
    (containerRef.current || {}).scrollTop = vocabScrollHeight.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const FeedsContainer = containerRef.current;
    addEvent(FeedsContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(FeedsContainer, 'scroll', handleScroll);
    };

    function handleScroll() {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const scrollThreshold =
          (containerRef.current || {}).scrollHeight -
          (containerRef.current || {}).offsetHeight;
        const scrollTop = (containerRef.current || {}).scrollTop;
        const distanceFromTop = scrollThreshold + scrollTop;
        if (distanceFromTop < 3) {
          prevScrollPosition.current = scrollTop;
          handleLoadMore();
        }
      }, 200);

      const scrollTop = (containerRef.current || {}).scrollTop;
      setShowGoToBottom(scrollTop < -5000);
      vocabScrollHeight.current = scrollTop;
    }
  });

  const fillerHeight =
    containerRef.current?.offsetHeight > contentRef.current?.offsetHeight
      ? containerRef.current?.offsetHeight - contentRef.current?.offsetHeight
      : 20;

  return (
    <div
      ref={containerRef}
      style={{
        paddingLeft: '1rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column-reverse',
        overflowY: 'scroll',
        ...style
      }}
    >
      <div
        style={{ position: 'relative', paddingRight: '1rem' }}
        ref={contentRef}
      >
        {vocabFeeds.map((feed: any, index: number) => {
          return (
            <Feed
              key={feed.id}
              feed={feed}
              isLastFeed={index === vocabFeeds.length - 1}
              myId={userId}
            />
          );
        })}
      </div>
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
            min-height: ${Math.max(fillerHeight, 100)}px;
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
  );

  async function handleLoadMore() {
    if (vocabFeedsLoadMoreButton && !loadMoreButtonLock.current) {
      if (!loadingMore) {
        loadMoreButtonLock.current = true;
        setLoadingMore(true);
        try {
          const data = await loadVocabularyFeeds(vocabFeeds[0]?.id);
          onLoadMoreVocabulary(data);
          if (deviceIsMobile) {
            setTimeout(() => {
              if (containerRef.current && prevScrollPosition.current !== null) {
                containerRef.current.scrollTop = prevScrollPosition.current;
              }
            }, 50);
          }
        } catch (error) {
          console.error(error);
        }
        setLoadingMore(false);
        loadMoreButtonLock.current = false;
      }
    }
  }

  async function handleScrollToBottom() {
    if (containerRef.current) {
      if (deviceIsMobile || deviceIsTablet) {
        (containerRef.current || {}).scrollTop = 0;
        (containerRef.current || {}).scrollTop = 1000;
        if (deviceIsTablet) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const lastMessage = containerRef.current.lastElementChild;
          if (lastMessage) {
            lastMessage.scrollIntoView({ block: 'end' });
          }
        }
      }
      (containerRef.current || {}).scrollTop = 0;
    }
  }
}

export default memo(FeedsContainer);
