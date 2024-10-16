import React, { memo, useMemo, useState, useEffect } from 'react';
import EditMemoryInstructionsModal from './EditMemoryInstructionsModal';
import BookmarkModal from './BookmarkModal';
import EditMemoryModal from './EditMemoryModal';
import Bookmarks from './Bookmarks';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { capitalize } from '~/helpers/stringHelpers';
import { useChatContext, useKeyContext } from '~/contexts';
import AIThinkingLevelSelector from './AIThinkingLevelSelector';

const defaultMemoryInstructions = 'any important information the user shares';

export type ThinkingLevel = 0 | 1 | 2;

export interface LevelInfo {
  price: number | string;
  model: string;
  label: string;
}

export function getLevelInfo(level: ThinkingLevel): LevelInfo {
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

function AIChatMenu({
  bookmarkedMessages,
  isTwoPeopleConnected,
  loadMoreBookmarksShown,
  channelId,
  displayedThemeColor,
  topicId,
  isZeroChat,
  isCielChat,
  isCallButtonShown,
  topicObj,
  settings,
  aiThinkingLevel
}: {
  bookmarkedMessages: any[];
  isTwoPeopleConnected: boolean;
  loadMoreBookmarksShown: boolean;
  channelId: number;
  displayedThemeColor: string;
  topicId: number;
  isZeroChat: boolean;
  isCielChat: boolean;
  isCallButtonShown: boolean;
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
  aiThinkingLevel: ThinkingLevel;
}) {
  const { twinkleCoins } = useKeyContext((v) => v.myState);
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
          ? 'CALC(100% - 26.9rem)'
          : 'CALC(100% - 21.9rem)'};
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 1rem 0 1rem;
        background-color: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 300px;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          height: ${isCallButtonShown
            ? 'CALC(100% - 25.9rem)'
            : 'CALC(100% - 21.9rem)'};
        }
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
      {isTwoPeopleConnected && (
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
      )}
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
