import React, { memo, useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

function Bookmarks({
  channelId,
  topicId,
  bookmarkedMessages,
  onSetSelectedBookmark,
  loadMoreBookmarksShown
}: {
  channelId: number;
  topicId: number;
  bookmarkedMessages: any[];
  onSetSelectedBookmark: (message: any) => void;
  loadMoreBookmarksShown: boolean;
}) {
  const loadMoreBookmarks = useAppContext(
    (v) => v.requestHelpers.loadMoreBookmarks
  );
  const onLoadMoreBookmarks = useChatContext(
    (v) => v.actions.onLoadMoreBookmarks
  );
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const onScroll = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          listElement.scrollTop + listElement.clientHeight >=
          listElement.scrollHeight * 0.7
        ) {
          handleLoadMore();
        }
      }, 200);
    };

    listElement.addEventListener('scroll', onScroll);
    return () => listElement.removeEventListener('scroll', onScroll);
  }, [handleLoadMore]);

  return (
    <div
      className={css`
        display: grid;
        grid-template-rows: auto 1fr;
        overflow: hidden;
        height: 100%;
      `}
    >
      <h3
        className={css`
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
          color: #333;
          border-bottom: 1px solid ${Color.borderGray()};
          padding-bottom: 0.5rem;
          white-space: normal;
        `}
      >
        <Icon icon="bookmark" />
        <span style={{ marginLeft: '0.7rem' }}>Bookmarks</span>
      </h3>
      {bookmarkedMessages.length === 0 ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #999;
            font-size: 1.3rem;
          `}
        >
          No bookmarks, yet
        </div>
      ) : (
        <ul
          ref={listRef}
          className={css`
            list-style: none;
            padding: 0;
            white-space: normal;
            overflow-y: auto;
            margin: 0;
            height: 100%;
          `}
        >
          {bookmarkedMessages.map((message, index) => (
            <li
              key={index}
              className={css`
                font-size: 1rem;
                color: #666;
                margin-bottom: 0.5rem;
                cursor: pointer;
                white-space: normal;
                &:hover {
                  color: #000;
                }
              `}
              onClick={() => onSetSelectedBookmark(message)}
            >
              {message.content.length > 100
                ? `${message.content.slice(0, 100)}...`
                : message.content}
            </li>
          ))}
          {loadMoreBookmarksShown && (
            <LoadMoreButton
              filled
              loading={loading}
              onClick={handleLoadMore}
              style={{
                width: '100%',
                borderRadius: 0,
                border: 0
              }}
            />
          )}
        </ul>
      )}
    </div>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function handleLoadMore() {
    if (loading || !loadMoreBookmarksShown) return;
    try {
      setLoading(true);
      const lastBookmarkId =
        bookmarkedMessages[bookmarkedMessages.length - 1].id;
      const { bookmarks, loadMoreShown } = await loadMoreBookmarks({
        channelId,
        topicId,
        lastBookmarkId
      });
      onLoadMoreBookmarks({ channelId, topicId, bookmarks, loadMoreShown });
    } catch (error) {
      console.error('Failed to load more bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }
}

export default memo(Bookmarks);
