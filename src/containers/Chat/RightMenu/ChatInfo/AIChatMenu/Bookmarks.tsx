import React, { memo, useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { BookmarkView } from '~/constants/defaultValues';

function Bookmarks({
  channelId,
  topicId,
  bookmarksByView,
  bookmarkView,
  onSetSelectedBookmark,
  loadMoreBookmarksShown
}: {
  channelId: number;
  topicId?: number;
  bookmarksByView: Record<'ai' | 'me', any[]>;
  bookmarkView: BookmarkView;
  onSetSelectedBookmark: (message: any) => void;
  loadMoreBookmarksShown: { ai: boolean; me: boolean };
}) {
  const loadMoreBookmarks = useAppContext(
    (v) => v.requestHelpers.loadMoreBookmarks
  );
  const onLoadMoreBookmarks = useChatContext(
    (v) => v.actions.onLoadMoreBookmarks
  );
  const [loadingView, setLoadingView] = useState<BookmarkView | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const timeoutRef = useRef<any>(null);
  const bookmarks = bookmarksByView?.[bookmarkView] || [];
  const loadMoreShown = loadMoreBookmarksShown?.[bookmarkView] || false;
  const isLoading = loadingView === bookmarkView;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkView, bookmarks.length, loadMoreShown, isLoading]);

  return (
    <div
      className={css`
        display: grid;
        grid-template-rows: auto 1fr;
        overflow: hidden;
        height: 100%;
        width: 100%;
      `}
    >
      <h3
        className={css`
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
          color: #333;
          border-bottom: 1px solid var(--ui-border);
          padding-bottom: 0.5rem;
          white-space: normal;
        `}
      >
        <Icon icon="bookmark" />
        <span style={{ marginLeft: '0.7rem' }}>Bookmarks</span>
      </h3>
      {bookmarks.length === 0 ? (
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
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
            width: 100%;
          `}
        >
          {bookmarks.map((message, index) => (
            <li
              key={message.bookmarkId || message.id || index}
              className={css`
                font-size: 1rem;
                color: #666;
                margin-bottom: 0.5rem;
                cursor: pointer;
                white-space: normal;
                word-break: break-word;
                overflow-wrap: break-word;
                max-width: 100%;
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
          {loadMoreShown && (
            <LoadMoreButton
              filled
              loading={isLoading}
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

  async function handleLoadMore() {
    if (isLoading || !loadMoreShown || bookmarks.length === 0) return;
    const lastBookmark = bookmarks[bookmarks.length - 1];
    const lastBookmarkId = lastBookmark?.bookmarkId || lastBookmark?.id;
    if (!lastBookmarkId) return;
    try {
      setLoadingView(bookmarkView);
      const { bookmarks, loadMoreShown } = await loadMoreBookmarks({
        channelId,
        topicId,
        lastBookmarkId,
        view: bookmarkView
      });
      onLoadMoreBookmarks({
        channelId,
        topicId,
        bookmarks,
        loadMoreShown,
        view: bookmarkView
      });
    } catch (error) {
      console.error('Failed to load more bookmarks:', error);
    } finally {
      setLoadingView(null);
    }
  }
}

export default memo(Bookmarks);
