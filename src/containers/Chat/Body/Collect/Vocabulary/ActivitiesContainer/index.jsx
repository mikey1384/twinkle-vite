import { memo, useEffect, useRef, useState, startTransition } from 'react';
import PropTypes from 'prop-types';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';

ActivitiesContainer.propTypes = {
  style: PropTypes.object
};

function ActivitiesContainer({ style }) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const ActivitiesContainerRef = useRef(null);
  const ContentRef = useRef(null);
  const timerRef = useRef(null);
  const { userId } = useKeyContext((v) => v.myState);
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
      }, 200);
    }
  });
  const loadVocabulary = useAppContext((v) => v.requestHelpers.loadVocabulary);
  const vocabActivities = useChatContext((v) => v.state.vocabActivities);
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const vocabActivitiesLoadMoreButton = useChatContext(
    (v) => v.state.vocabActivitiesLoadMoreButton
  );
  const onLoadMoreVocabulary = useChatContext(
    (v) => v.actions.onLoadMoreVocabulary
  );

  const fillerHeight =
    ActivitiesContainerRef.current?.offsetHeight >
    ContentRef.current?.offsetHeight
      ? ActivitiesContainerRef.current?.offsetHeight -
        ContentRef.current?.offsetHeight
      : 20;

  useEffect(() => {
    if (scrollHeight) {
      (ActivitiesContainerRef.current || {}).scrollTop =
        ContentRef.current?.offsetHeight - scrollHeight;
    }
  }, [scrollHeight]);

  return (
    <div
      ref={ActivitiesContainerRef}
      style={{ paddingLeft: '1rem', ...style }}
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
            color={loadMoreButtonColor}
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
      <div style={{ position: 'relative' }} ref={ContentRef}>
        {vocabActivities.map((vocab, index) => {
          const word = wordsObj[vocab] || {};
          return (
            <Activity
              key={word.id}
              activity={word}
              setScrollToBottom={handleSetScrollToBottom}
              isLastActivity={index === vocabActivities.length - 1}
              myId={userId}
              onReceiveNewActivity={handleReceiveNewActivity}
            />
          );
        })}
      </div>
    </div>
  );

  async function handleLoadMore() {
    if (vocabActivitiesLoadMoreButton) {
      const prevContentHeight = ContentRef.current?.offsetHeight || 0;
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

export default memo(ActivitiesContainer);
