import React, { memo, useMemo, useState } from 'react';
import BookmarkModal from './BookmarkModal';
import Bookmarks from './Bookmarks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import FileSelector from './FileSelector';
import ThinkHardToggle from './ThinkHardToggle';
import { FileData } from '~/types';
import { useChatContext, useKeyContext } from '~/contexts';

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
  bookmarkedMessages: any[];
  isTwoPeopleConnected: boolean;
  loadMoreBookmarksShown: boolean;
  channelId: number;
  displayedThemeColor: string;
  topicId: number;
  isCielChat: boolean;
  isCallButtonShown: boolean;
  topicObj: Record<
    number,
    {
      bookmarkedMessages: any[];
      loadMoreBookmarksShown: boolean;
    }
  >;
  files: FileData[];
  hasMoreFiles: boolean;
}) {
  const currentTopic = useMemo(() => {
    if (!topicId || !topicObj) return null;
    return topicObj?.[topicId] || null;
  }, [topicId, topicObj]);
  const appliedBookmarkedMessages = useMemo(() => {
    if (currentTopic) {
      return currentTopic.bookmarkedMessages || [];
    }
    return bookmarkedMessages || [];
  }, [bookmarkedMessages, currentTopic]);
  const appliedLoadMoreBookmarksShown = useMemo(() => {
    if (currentTopic) {
      return !!currentTopic.loadMoreBookmarksShown;
    }
    return loadMoreBookmarksShown;
  }, [currentTopic, loadMoreBookmarksShown]);
  const [selectedBookmark, setSelectedBookmark] = useState<{
    id: number;
  } | null>(null);
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const thinkHardZero = useChatContext((v) => v.state.thinkHardZero);
  const thinkHardCiel = useChatContext((v) => v.state.thinkHardCiel);
  const onSetThinkHardZero = useChatContext((v) => v.actions.onSetThinkHardZero);
  const onSetThinkHardCiel = useChatContext((v) => v.actions.onSetThinkHardCiel);

  const thinkHard = isCielChat ? thinkHardCiel : thinkHardZero;
  const onSetThinkHard = isCielChat ? onSetThinkHardCiel : onSetThinkHardZero;

  return (
    <div
      className={css`
        height: ${isCallButtonShown
          ? 'CALC(100% - 11.9rem)'
          : 'CALC(100% - 5.8rem)'};
        width: 100%;
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 1rem 0 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        display: grid;
        grid-template-rows: 1fr auto auto;
        @media (max-width: ${mobileMaxWidth}) {
          height: ${isCallButtonShown
            ? 'CALC(100% - 10.9rem)'
            : 'CALC(100% - 4.9rem)'};
        }
      `}
    >
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
          bookmarkedMessages={appliedBookmarkedMessages}
          onSetSelectedBookmark={setSelectedBookmark}
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
            onToggle={onSetThinkHard} 
          />
        </>
      )}
      {selectedBookmark && (
        <BookmarkModal
          bookmark={selectedBookmark}
          isCurrentlyBookmarked={appliedBookmarkedMessages.some(
            (message) => message.id === selectedBookmark.id
          )}
          channelId={channelId}
          isCielChat={isCielChat}
          displayedThemeColor={displayedThemeColor}
          onHide={() => setSelectedBookmark(null)}
        />
      )}
    </div>
  );
}

export default memo(AIChatMenu);
