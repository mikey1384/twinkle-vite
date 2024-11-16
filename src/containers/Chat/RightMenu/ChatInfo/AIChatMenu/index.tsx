import React, { memo, useMemo, useState, useEffect } from 'react';
import BookmarkModal from './BookmarkModal';
import Bookmarks from './Bookmarks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import AIThinkingLevelSelector from './AIThinkingLevelSelector';
import FileSelector from './FileSelector';

type ThinkingLevel = 0 | 1 | 2;

interface FileData {
  id: number;
  fileName: string;
  actualFileName: string;
}

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
  aiThinkingLevel,
  files
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
  aiThinkingLevel: ThinkingLevel;
  files: FileData[];
}) {
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
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

  useEffect(() => {
    const prices = [0, 100, 1000];
    const affordableLevel = prices.reduce((maxAffordable, price, index) => {
      return twinkleCoins >= price ? index : maxAffordable;
    }, 0) as ThinkingLevel;

    if (aiThinkingLevel > affordableLevel) {
      onSetChannelState({
        channelId,
        newState: {
          aiThinkingLevel: affordableLevel
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twinkleCoins, aiThinkingLevel, channelId]);

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
          <FileSelector files={files} />
          <div
            className={css`
              width: 100%;
            `}
          >
            <AIThinkingLevelSelector
              aiThinkingLevel={aiThinkingLevel}
              displayedThemeColor={displayedThemeColor}
              onAIThinkingLevelChange={(newThinkingLevel) => {
                onSetChannelState({
                  channelId,
                  newState: {
                    aiThinkingLevel: newThinkingLevel
                  }
                });
              }}
              twinkleCoins={twinkleCoins}
              onGetLevelInfo={getLevelInfo}
            />
          </div>
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

function getLevelInfo(level: ThinkingLevel): {
  price: number | string;
  model: string;
  label: string;
} {
  switch (level) {
    case 0:
      return {
        price: 'Free',
        model: 'GPT-4o',
        label: 'Basic'
      };
    case 1:
      return {
        price: 100,
        model: 'o1-mini',
        label: 'Advanced'
      };
    case 2:
      return {
        price: 1000,
        model: 'o1-preview',
        label: 'Expert'
      };
    default:
      return {
        price: 'Free',
        model: 'GPT-4o',
        label: 'Basic'
      };
  }
}

export default memo(AIChatMenu);
