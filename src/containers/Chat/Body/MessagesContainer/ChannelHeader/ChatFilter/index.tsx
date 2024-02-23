import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ChatFilterBar from './ChatFilterBar';
import TopicSelectorModal from './TopicSelectorModal';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ChatFilter({
  canChangeTopic,
  channelId,
  channelName,
  creatorId,
  canChangeSubject,
  isTwoPeopleChat,
  featuredTopicId,
  onSetBuyTopicModalShown,
  pathId,
  themeColor,
  selectedTab,
  style,
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
  featuredTopicId: number;
  onSetBuyTopicModalShown: (shown: boolean) => void;
  pathId: string;
  themeColor: string;
  selectedTab: string;
  style?: React.CSSProperties;
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
  const [topicSelectorModalShown, setTopicSelectorModalShown] = useState(false);
  const currentTopicTitle = useMemo(() => {
    if (topicObj?.[topicId]) {
      return topicObj[topicId]?.content || '';
    }
    return '';
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
          onShowTopicSelectorModal={() => setTopicSelectorModalShown(true)}
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
          displayedThemeColor={themeColor}
          canChangeSubject={canChangeSubject}
          featuredTopic={topicObj?.[featuredTopicId]}
          currentTopic={topicObj?.[topicId] || { id: topicId }}
          onSelectTopic={handleSelectTopic}
          onHide={() => setTopicSelectorModalShown(false)}
          pathId={pathId}
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
    setTopicSelectorModalShown(false);
  }
}
