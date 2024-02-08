import React from 'react';
import TopicItem from './TopicItem';

export default function Search({ searchedTopics }: { searchedTopics: any[] }) {
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
