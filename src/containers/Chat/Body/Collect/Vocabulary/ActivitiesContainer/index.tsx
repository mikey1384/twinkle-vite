import React, {
  memo,
  useEffect,
  useRef,
  useState,
  startTransition
} from 'react';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GoToBottomButton from '~/components/Buttons/GoToBottomButton';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

interface ActivitiesContainerProps {
  style?: React.CSSProperties;
  containerRef: React.RefObject<any>;
  contentRef: React.RefObject<any>;
  onSetScrollToBottom: () => boolean;
  scrollAtBottom: boolean;
  onSetScrollAtBottom: (isAtBottom: boolean) => void;
}

function ActivitiesContainer({
  style,
  containerRef,
  contentRef,
  onSetScrollToBottom,
  scrollAtBottom,
  onSetScrollAtBottom
}: ActivitiesContainerProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const loadVocabulary = useAppContext((v) => v.requestHelpers.loadVocabulary);
  const vocabActivities = useChatContext((v) => v.state.vocabActivities);
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const vocabActivitiesLoadMoreButton = useChatContext(
    (v) => v.state.vocabActivitiesLoadMoreButton
  );
  const onLoadMoreVocabulary = useChatContext(
    (v) => v.actions.onLoadMoreVocabulary
  );
  const { userId } = useKeyContext((v) => v.myState);

  useEffect(() => {
    onSetScrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ActivitiesContainer = containerRef.current;
    addEvent(ActivitiesContainer, 'scroll', handleScroll);

    return function cleanUp() {
      removeEvent(ActivitiesContainer, 'scroll', handleScroll);
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
    }
  }, [scrollHeight, containerRef, contentRef]);

  return (
    <div ref={containerRef} style={{ paddingLeft: '1rem', ...style }}>
      {vocabActivitiesLoadMoreButton ? (
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
      <div style={{ position: 'relative' }} ref={contentRef}>
        {vocabActivities.map((vocab: string, index: number) => {
          const word = wordsObj[vocab] || {};
          return (
            <Activity
              key={word.id}
              activity={word}
              setScrollToBottom={onSetScrollToBottom}
              isLastActivity={index === vocabActivities.length - 1}
              myId={userId}
              onReceiveNewActivity={handleReceiveNewActivity}
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
    if (vocabActivitiesLoadMoreButton) {
      const prevContentHeight = contentRef.current?.offsetHeight || 0;
      if (!loadingMore) {
        setLoadingMore(true);
        try {
          const data = await loadVocabulary(wordsObj[vocabActivities[0]]?.id);
          onLoadMoreVocabulary(data);
          startTransition(() => {
            setScrollHeight(prevContentHeight);
          });
        } catch (error) {
          console.error(error);
        }
        setLoadingMore(false);
      }
    }
  }

  function handleReceiveNewActivity() {
    if (scrollAtBottom) {
      onSetScrollToBottom();
    }
  }
}

export default memo(ActivitiesContainer);
