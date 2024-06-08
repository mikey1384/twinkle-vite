import React from 'react';
import TopicItem from '../TopicItem';

export default function Results({
  channelId,
  currentTopicId,
  displayedThemeColor,
  isOwner,
  featuredTopicId,
  onSelectTopic,
  pinnedTopicIds,
  results
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  isOwner: boolean;
  featuredTopicId: number;
  onSelectTopic: (id: number) => void;
  pinnedTopicIds: number[];
  results: any[];
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
          isFeatured={featuredTopicId === topic.id}
          onSelectTopic={onSelectTopic}
          pinnedTopicIds={pinnedTopicIds}
          style={{
            marginBottom: index === results.length - 1 ? '0.5rem' : '1rem'
          }}
          {...topic}
        />
      ))}
    </div>
  );
}
