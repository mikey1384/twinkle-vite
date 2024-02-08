import React from 'react';
import TopicItem from './TopicItem';

export default function Search({
  currentTopicId,
  displayedThemeColor,
  onSelectTopic,
  searchedTopics
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  onSelectTopic: (id: number) => void;
  searchedTopics: any[];
}) {
  return (
    <div>
      {searchedTopics.map((topic) => (
        <TopicItem
          key={topic.id}
          currentTopicId={currentTopicId}
          displayedThemeColor={displayedThemeColor}
          onSelectTopic={onSelectTopic}
          {...topic}
        />
      ))}
    </div>
  );
}
