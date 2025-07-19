import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import TopicSelectorModal from '../../../../Modals/TopicSelectorModal';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  channelName,
  creatorId,
  canChangeSubject,
  isTwoPeopleChat,
  isAIChannel,
  isSearchActive,
  featuredTopicId,
  onSearch,
  onSetBuyTopicModalShown,
  onSetIsSearchActive,
  pathId,
  pinnedTopicIds,
  themeColor,
  searchText,
  selectedTab,
  style,
  onSetTopicSelectorModalShown,
  topicSelectorModalShown,
  topicHistory,
  currentTopicIndex,
  topicObj,
  topicId
}: {
  canChangeTopic: boolean;
  channelId: number;
  channelName: string;
  creatorId: number;
  canChangeSubject: string;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  isSearchActive: boolean;
  featuredTopicId: number;
  onSearch: (text: string) => void;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
  onSetBuyTopicModalShown: (shown: boolean) => void;
  onSetIsSearchActive: (info: {
    channelId: number;
    isToggle?: boolean;
    isActive?: boolean;
  }) => void;
  pathId: string;
  pinnedTopicIds: number[];
  themeColor: string;
  searchText: string;
  selectedTab: string;
  style?: React.CSSProperties;
  topicSelectorModalShown: boolean;
  topicHistory: number[];
  currentTopicIndex: number;
  topicId: number;
  topicObj: Record<string, any>;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const currentTopicTitle = useMemo(() => {
    if (topicObj?.[topicId]) {
      return topicObj[topicId]?.content || '';
    }
    return '';
  }, [topicId, topicObj]);
  const currentTopic = useMemo(() => {
    return topicObj?.[topicId] || { id: topicId };
  }, [topicId, topicObj]);

  return (
    <ErrorBoundary componentPath="Chat/Body/MessageContainer/ChannelHeader/ChatFilter">
      <div
        style={style}
        className={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <ChatFilterBar
          isOwner={creatorId === userId}
          isSearchActive={isSearchActive}
          themeColor={themeColor}
          channelId={channelId}
          canChangeTopic={canChangeTopic}
          onShowTopicSelectorModal={() => onSetTopicSelectorModalShown(true)}
          searchText={searchText}
          selectedTab={selectedTab}
          onSearch={onSearch}
          onSetBuyTopicModalShown={onSetBuyTopicModalShown}
          topic={currentTopicTitle}
          topicHistory={topicHistory}
          currentTopicIndex={currentTopicIndex}
          topicId={topicId}
          onSetIsSearchActive={onSetIsSearchActive}
        />
      </div>
      {topicSelectorModalShown && (
        <TopicSelectorModal
          channelId={channelId}
          channelName={channelName}
          creatorId={creatorId}
          isTwoPeopleChat={isTwoPeopleChat}
          isAIChannel={isAIChannel}
          displayedThemeColor={themeColor}
          canChangeSubject={canChangeSubject}
          featuredTopic={topicObj?.[featuredTopicId]}
          currentTopic={currentTopic}
          onSelectTopic={handleSelectTopic}
          onHide={() => onSetTopicSelectorModalShown(false)}
          pathId={pathId}
          pinnedTopicIds={pinnedTopicIds}
        />
      )}
    </ErrorBoundary>
  );

  function handleSelectTopic(topicId: number) {
    updateLastTopicId({
      channelId,
      topicId
    });
    onEnterTopic({ channelId, topicId });
    onSetTopicSelectorModalShown(false);
  }
}
