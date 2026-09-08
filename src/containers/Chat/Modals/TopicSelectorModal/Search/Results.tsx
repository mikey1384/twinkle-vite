import React from 'react';
import TopicItem from '../TopicItem';

export default function Results({
  channelId,
  currentTopicId,
  displayedThemeColor,
  isOwner,
  isAIChannel,
  isTwoPeopleChat,
  featuredTopicId,
  onSelectTopic,
  pinnedTopicIds,
  results,
  pathId
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  isOwner: boolean;
  isAIChannel: boolean;
  isTwoPeopleChat: boolean;
  featuredTopicId: number;
  onSelectTopic: (id: number) => void;
  pinnedTopicIds: number[];
  results: any[];
  pathId: string;
}) {
  return (
    <div style={{ width: '100%' }}>
      {results.map((topic, index) => (
        <TopicItem
          key={topic.id}
          channelId={channelId}
          currentTopicId={currentTopicId}
          displayedThemeColor={displayedThemeColor}
          isOwner={isOwner}
          isAIChannel={isAIChannel}
          isTwoPeopleChat={isTwoPeopleChat}
          isFeatured={featuredTopicId === topic.id}
          onSelectTopic={onSelectTopic}
          pinnedTopicIds={pinnedTopicIds}
          pathId={pathId}
          style={{
            marginBottom: index === results.length - 1 ? '0.5rem' : '1rem'
          }}
          {...topic}
        />
      ))}
    </div>
  );
}
