import React, { memo, useEffect, useMemo, useState } from 'react';
import BookmarkModal from './BookmarkModal';
import Bookmarks from './Bookmarks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import FileSelector from './FileSelector';
import ThinkHardToggle from './ThinkHardToggle';
import { FileData } from '~/types';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { BOOKMARK_VIEWS, BookmarkView } from '~/constants/defaultValues';
import FilterBar from '~/components/FilterBar';

function AIChatMenu({
  bookmarkedMessages,
  isTwoPeopleConnected,
  loadMoreBookmarksShown,
  channelId,
  displayedThemeColor,
  topicId,
  isCielChat,
  isCallButtonShown,
  topicObj,
  files,
  hasMoreFiles
}: {
  bookmarkedMessages: Record<'ai' | 'me', any[]> | any[];
  isTwoPeopleConnected: boolean;
  loadMoreBookmarksShown: { ai: boolean; me: boolean } | boolean | undefined;
  channelId: number;
  displayedThemeColor: string;
  topicId: number;
  isCielChat: boolean;
  isCallButtonShown: boolean;
  topicObj: Record<
    number,
    {
      bookmarkedMessages?: Record<'ai' | 'me', any[]> | any[];
      loadMoreBookmarksShown?:
        | { ai: boolean; me: boolean }
        | boolean
        | undefined;
      bookmarksLoaded?: boolean;
    }
  >;
  files: FileData[];
  hasMoreFiles: boolean;
}) {
  const loadBookmarksForTopic = useAppContext(
    (v) => v.requestHelpers.loadBookmarksForTopic
  );
  const onLoadTopicBookmarks = useChatContext(
    (v) => v.actions.onLoadTopicBookmarks
  );
  const username = useKeyContext((v) => v.myState.username);
  const currentTopic = useMemo(() => {
    if (!topicId || !topicObj) return null;
    return topicObj?.[topicId] || null;
  }, [topicId, topicObj]);
  const bookmarksLoaded = currentTopic?.bookmarksLoaded;
  const appliedBookmarkedMessages = useMemo(() => {
    if (currentTopic) {
      return normalizeBookmarkMap(currentTopic.bookmarkedMessages);
    }
    return normalizeBookmarkMap(bookmarkedMessages);
  }, [bookmarkedMessages, currentTopic]);
  const appliedLoadMoreBookmarksShown = useMemo(() => {
    if (currentTopic) {
      return normalizeLoadMoreMap(currentTopic.loadMoreBookmarksShown);
    }
    return normalizeLoadMoreMap(loadMoreBookmarksShown);
  }, [currentTopic, loadMoreBookmarksShown]);
  const [bookmarkView, setBookmarkView] = useState<BookmarkView>(
    BOOKMARK_VIEWS.AI
  );
  const [selectedBookmark, setSelectedBookmark] = useState<{
    view: BookmarkView;
    data: any;
  } | null>(null);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const communityFunds = useKeyContext((v) => v.myState.communityFunds);
  const thinkHardState = useChatContext((v) => v.state.thinkHard);
  const onSetThinkHardZero = useChatContext(
    (v) => v.actions.onSetThinkHardZero
  );
  const onSetThinkHardCiel = useChatContext(
    (v) => v.actions.onSetThinkHardCiel
  );
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );

  useEffect(() => {
    async function loadBookmarks() {
      if (topicId && !bookmarksLoaded) {
        const { bookmarkedMessages, loadMoreBookmarksShown } =
          await loadBookmarksForTopic({ channelId, topicId });
        onLoadTopicBookmarks({
          channelId,
          topicId,
          bookmarkedMessages,
          loadMoreBookmarksShown
        });
      }
    }
    loadBookmarks();
  }, [
    topicId,
    channelId,
    bookmarksLoaded,
    loadBookmarksForTopic,
    onLoadTopicBookmarks
  ]);

  const aiType = isCielChat ? 'ciel' : 'zero';
  const key = topicId ? topicId.toString() : 'global';
  const thinkHard =
    thinkHardState[aiType][key] ?? thinkHardState[aiType].global;

  return (
    <div
      className={css`
        height: ${isCallButtonShown
          ? 'CALC(100% - 11.9rem)'
          : 'CALC(100% - 5.8rem)'};
        width: 100%;
        min-width: 0;
        border-top: 1px solid var(--ui-border);
        padding: 1rem 1rem 0 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto 1fr;
        overflow: hidden;
        @media (max-width: ${mobileMaxWidth}) {
          height: ${isCallButtonShown
            ? 'CALC(100% - 10.9rem)'
            : 'CALC(100% - 4.9rem)'};
        }
      `}
    >
      <div>
        <FilterBar>
          <nav
            className={bookmarkView === BOOKMARK_VIEWS.AI ? 'active' : ''}
            onClick={() => setBookmarkView(BOOKMARK_VIEWS.AI)}
          >
            {isCielChat ? 'Ciel' : 'Zero'}
          </nav>
          <nav
            className={bookmarkView === BOOKMARK_VIEWS.ME ? 'active' : ''}
            onClick={() => setBookmarkView(BOOKMARK_VIEWS.ME)}
          >
            {username}
          </nav>
        </FilterBar>
      </div>
      <div
        className={css`
          overflow-y: auto;
          margin-bottom: 1rem;
          width: 100%;
          flex: 2;
        `}
      >
        <Bookmarks
          channelId={channelId}
          topicId={topicId}
          bookmarksByView={appliedBookmarkedMessages}
          bookmarkView={bookmarkView}
          onSetSelectedBookmark={(bookmark) =>
            setSelectedBookmark({ view: bookmarkView, data: bookmark })
          }
          loadMoreBookmarksShown={appliedLoadMoreBookmarksShown}
        />
      </div>
      {isTwoPeopleConnected && (
        <>
          <FileSelector
            channelId={channelId}
            topicId={topicId}
            files={files}
            isTopic={!!topicId}
            hasMore={hasMoreFiles}
          />
          <ThinkHardToggle
            thinkHard={thinkHard}
            twinkleCoins={twinkleCoins || 0}
            communityFundsAvailable={communityFunds > 500}
            onToggle={handleSetThinkHard}
          />
        </>
      )}
      {selectedBookmark && (
        <BookmarkModal
          bookmark={selectedBookmark.data}
          bookmarkView={selectedBookmark.view}
          isCurrentlyBookmarked={appliedBookmarkedMessages[
            selectedBookmark.view
          ].some(
            (message: { id: number }) => message.id === selectedBookmark.data.id
          )}
          channelId={channelId}
          isCielChat={isCielChat}
          displayedThemeColor={displayedThemeColor}
          onHide={() => setSelectedBookmark(null)}
        />
      )}
    </div>
  );

  function handleSetThinkHard(value: boolean) {
    if (topicId) {
      onSetThinkHardForTopic({ aiType, topicId, thinkHard: value });
    } else if (isCielChat) {
      onSetThinkHardCiel(value);
    } else {
      onSetThinkHardZero(value);
    }
    let stored = localStorage.getItem('thinkHard') || '';
    const parsed = stored ? JSON.parse(stored) : {};
    const updatedThinkHard = {
      ...parsed,
      [aiType]: {
        ...parsed[aiType],
        [key]: value
      }
    };
    localStorage.setItem('thinkHard', JSON.stringify(updatedThinkHard));
  }
}

export default memo(AIChatMenu);

function normalizeBookmarkMap(bookmarks?: any) {
  if (Array.isArray(bookmarks)) {
    return {
      ai: bookmarks,
      me: []
    };
  }
  return {
    ai: bookmarks?.ai || [],
    me: bookmarks?.me || []
  };
}

function normalizeLoadMoreMap(loadMore?: any) {
  if (typeof loadMore === 'boolean') {
    return {
      ai: loadMore,
      me: loadMore
    };
  }
  return {
    ai: !!loadMore?.ai,
    me: !!loadMore?.me
  };
}
