import React, { memo, useMemo, useState } from 'react';
import EditMemoryInstructionsModal from './EditMemoryInstructionsModal';
import BookmarkModal from './BookmarkModal';
import EditMemoryModal from './EditMemoryModal';
import Bookmarks from './Bookmarks';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { capitalize } from '~/helpers/stringHelpers';
import { useChatContext } from '~/contexts';
import AIThinkingLevelSelector from './AIThinkingLevelSelector';

const defaultMemoryInstructions = 'any important information the user shares';

function AIChatMenu({
  bookmarkedMessages,
  loadMoreBookmarksShown,
  channelId,
  displayedThemeColor,
  topicId,
  isZeroChat,
  isCielChat,
  topicObj,
  settings,
  aiThinkingLevel
}: {
  bookmarkedMessages: any[];
  loadMoreBookmarksShown: boolean;
  channelId: number;
  displayedThemeColor: string;
  topicId: number;
  isZeroChat: boolean;
  isCielChat: boolean;
  topicObj: Record<
    number,
    {
      bookmarkedMessages: any[];
      loadMoreBookmarksShown: boolean;
      settings: {
        memoryInstructions?: string;
        aiMemory?: string;
      };
    }
  >;
  settings: {
    memoryInstructions?: string;
    aiMemory?: string;
  };
  aiThinkingLevel: 0 | 1 | 2;
}) {
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const currentTopic = useMemo(() => {
    if (!topicId || !topicObj) return null;
    return topicObj?.[topicId] || null;
  }, [topicId, topicObj]);
  const appliedSettings = useMemo(() => {
    if (!currentTopic) return settings || {};
    return currentTopic.settings || {};
  }, [currentTopic, settings]);
  const { memoryInstructions = defaultMemoryInstructions, aiMemory = {} } =
    appliedSettings;
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
  const appliedAIMemory = useMemo(() => {
    if (Object.keys(aiMemory).length === 0) return 'No memory saved yet';
    return JSON.stringify(aiMemory);
  }, [aiMemory]);
  const aiName = useMemo(
    () => (isZeroChat ? 'Zero' : isCielChat ? 'Ciel' : 'AI'),
    [isZeroChat, isCielChat]
  );
  const capitalizedMemoryInstructions = useMemo(
    () => capitalize(memoryInstructions),
    [memoryInstructions]
  );
  const [
    isEditMemoryInstructionsModalShown,
    setIsEditMemoryInstructionsModalShown
  ] = useState(false);
  const [isEditMemoryModalShown, setIsEditMemoryModalShown] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<{
    id: number;
  } | null>(null);

  return (
    <div
      className={css`
        height: CALC(100% - 21rem);
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 1rem 0 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 1rem;
      `}
    >
      <div
        className={css`
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
              white-space: normal;
            `}
          >
            Things {aiName} remembers
          </h3>
          <button
            className={css`
              background: none;
              border: none;
              color: #007bff;
              cursor: pointer;
              font-size: 1rem;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => setIsEditMemoryInstructionsModalShown(true)}
          >
            Edit
          </button>
        </div>
        <div
          className={css`
            overflow-y: auto;
            height: 3.5rem;
          `}
        >
          <p
            className={css`
              font-size: 1rem;
              color: #666;
              line-height: 1.5;
              white-space: normal;
            `}
          >
            {capitalizedMemoryInstructions}
          </p>
        </div>
      </div>
      <div
        className={css`
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
        `}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            margin-bottom: 0.5rem;
            border-bottom: 1px solid ${Color.borderGray()};
            padding-bottom: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
              white-space: normal;
            `}
          >
            {`${aiName}'s Memory`}
          </h3>
          {!!Object.keys(aiMemory).length && (
            <button
              className={css`
                background: none;
                border: none;
                color: #007bff;
                cursor: pointer;
                font-size: 1rem;
                &:hover {
                  text-decoration: underline;
                }
              `}
              onClick={() => setIsEditMemoryModalShown(true)}
            >
              Edit
            </button>
          )}
        </div>
        <div
          className={css`
            overflow-y: auto;
            height: 7.5rem;
          `}
        >
          <p
            className={css`
              font-size: 1rem;
              color: #666;
              line-height: 1.5;
              white-space: normal;
            `}
          >
            {appliedAIMemory}
          </p>
        </div>
      </div>
      <Bookmarks
        channelId={channelId}
        topicId={topicId}
        bookmarkedMessages={appliedBookmarkedMessages}
        onSetSelectedBookmark={setSelectedBookmark}
        loadMoreBookmarksShown={appliedLoadMoreBookmarksShown}
      />
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
      />
      {isEditMemoryModalShown && (
        <EditMemoryModal
          topicId={topicId}
          channelId={channelId}
          memoryJSON={appliedAIMemory}
          onHide={() => setIsEditMemoryModalShown(false)}
        />
      )}
      {isEditMemoryInstructionsModalShown && (
        <EditMemoryInstructionsModal
          channelId={channelId}
          topicId={topicId}
          memoryInstructions={capitalizedMemoryInstructions}
          onHide={() => setIsEditMemoryInstructionsModalShown(false)}
        />
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
