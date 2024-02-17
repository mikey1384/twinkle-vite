import React from 'react';
import TopicItem from '../TopicItem';

export default function Results({
  currentTopicId,
  displayedThemeColor,
  isOwner,
  onSelectTopic,
  results
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  isOwner: boolean;
  onSelectTopic: (id: number) => void;
  results: any[];
}) {
  return (
    <div style={{ width: '100%' }}>
      {results.map((topic, index) => (
        <TopicItem
          key={topic.id}
          currentTopicId={currentTopicId}
          displayedThemeColor={displayedThemeColor}
          isOwner={isOwner}
          onSelectTopic={onSelectTopic}
          style={{
            marginBottom: index === results.length - 1 ? '0.5rem' : '1rem'
          }}
          {...topic}
        />
      ))}
    </div>
  );
}
