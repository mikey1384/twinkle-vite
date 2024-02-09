import React from 'react';
import TopicItem from '../TopicItem';

export default function Results({
  currentTopicId,
  displayedThemeColor,
  onSelectTopic,
  results
}: {
  currentTopicId: number;
  displayedThemeColor: string;
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
