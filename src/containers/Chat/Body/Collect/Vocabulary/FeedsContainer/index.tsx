import React, {
  memo,
  useEffect,
  useRef,
  useState,
  startTransition
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
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const loadVocabulary = useAppContext((v) => v.requestHelpers.loadVocabulary);
  const vocabFeedIds = useChatContext((v) => v.state.vocabFeedIds);
  const vocabFeedObj = useChatContext((v) => v.state.vocabFeedObj);
  const currentYear = useChatContext((v) => v.state.currentYear);
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const vocabFeedsLoadMoreButton = useChatContext(
    (v) => v.state.vocabFeedsLoadMoreButton
  );
  const onLoadMoreVocabulary = useChatContext(
    (v) => v.actions.onLoadMoreVocabulary
  );
  const { userId } = useKeyContext((v) => v.myState);

  const vocabFeeds = vocabFeedIds.map((id: number) => vocabFeedObj[id] || null);

  useEffect(() => {
    if (!vocabScrollHeight.current) onSetScrollToBottom();
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
        containerRef.current.scrollTop - contentRef.current.offsetHeight <
          -10000
      );
    }
  });

  const fillerHeight =
    containerRef.current?.offsetHeight > contentRef.current?.offsetHeight
      ? containerRef.current?.offsetHeight - contentRef.current?.offsetHeight
      : 20;

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
      <div
        style={{ position: 'relative', paddingRight: '1rem' }}
        ref={contentRef}
      >
        {vocabFeeds.map((feed: any, index: number) => {
          return (
            <Feed
              key={feed.id}
              feed={feed}
              setScrollToBottom={onSetScrollToBottom}
              isLastFeed={index === vocabFeeds.length - 1}
              myId={userId}
              onReceiveNewFeed={handleReceiveNewFeed}
            />
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

  async function handleLoadMore() {
    if (vocabFeedsLoadMoreButton) {
      const prevContentHeight = contentRef.current?.offsetHeight || 0;
      if (!loadingMore) {
        setLoadingMore(true);
        try {
          const data = await loadVocabulary(wordsObj[vocabFeeds[0]]?.id);
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
    }
  }

  function handleReceiveNewFeed() {
    if (scrollAtBottom) {
      onSetScrollToBottom();
    }
  }
}

export default memo(FeedsContainer);
