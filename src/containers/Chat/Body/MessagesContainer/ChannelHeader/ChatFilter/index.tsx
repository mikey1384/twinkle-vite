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
  featuredTopicId,
  onSetBuyTopicModalShown,
  pathId,
  pinnedTopicIds,
  themeColor,
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
  featuredTopicId: number;
  onSetTopicSelectorModalShown: (shown: boolean) => void;
  onSetBuyTopicModalShown: (shown: boolean) => void;
  pathId: string;
  pinnedTopicIds: number[];
  themeColor: string;
  selectedTab: string;
  style?: React.CSSProperties;
  topicSelectorModalShown: boolean;
  topicHistory: number[];
  currentTopicIndex: number;
  topicId: number;
  topicObj: Record<string, any>;
}) {
  const { userId } = useKeyContext((v) => v.myState);
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
          themeColor={themeColor}
          channelId={channelId}
          canChangeTopic={canChangeTopic}
          onShowTopicSelectorModal={() => onSetTopicSelectorModalShown(true)}
          selectedTab={selectedTab}
          onSetBuyTopicModalShown={onSetBuyTopicModalShown}
          topic={currentTopicTitle}
          topicHistory={topicHistory}
          currentTopicIndex={currentTopicIndex}
          topicId={topicId}
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
