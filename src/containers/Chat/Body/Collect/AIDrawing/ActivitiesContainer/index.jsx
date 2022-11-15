import { useEffect, useRef, useState, startTransition } from 'react';
import { useChatContext, useKeyContext } from '~/contexts';
import { checkScrollIsAtTheBottom } from '~/helpers';
import Activity from './Activity';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function ActivitiesContainer() {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const aiDrawingsLoadMoreButton = useChatContext(
    (v) => v.state.aiDrawingsLoadMoreButton
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(0);
  const ActivitiesContainerRef = useRef(null);
  const ContentRef = useRef(null);
  useEffect(() => {
    handleSetScrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (scrollHeight) {
      (ActivitiesContainerRef.current || {}).scrollTop =
        ContentRef.current?.offsetHeight - scrollHeight;
    }
  }, [scrollHeight]);
  const fillerHeight =
    ActivitiesContainerRef.current?.offsetHeight >
    ContentRef.current?.offsetHeight
      ? ActivitiesContainerRef.current?.offsetHeight -
        ContentRef.current?.offsetHeight
      : 20;
  const aiImageRows = useChatContext((v) => v.state.aiImages);
  return (
    <div
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
      style={{
        zIndex: 5,
        width: '100%',
        height: 'CALC(100% - 6.5rem)',
        overflow: 'scroll'
      }}
    >
      {aiDrawingsLoadMoreButton ? (
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
        {aiImageRows.map((row) => {
          return (
            <Activity
              key={row.id}
              activity={row}
              onReceiveNewActivity={handleReceiveNewActivity}
            />
          );
        })}
      </div>
    </div>
  );

  async function handleLoadMore() {
    if (aiDrawingsLoadMoreButton) {
      const prevContentHeight = ContentRef.current?.offsetHeight || 0;
      if (!loadingMore) {
        setLoadingMore(true);
        console.log('loading');
        startTransition(() => {
          setScrollHeight(prevContentHeight);
        });
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
