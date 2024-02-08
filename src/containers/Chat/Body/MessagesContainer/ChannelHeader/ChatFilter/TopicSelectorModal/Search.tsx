import React from 'react';

export default function Search({ searchedTopics }: { searchedTopics: any[] }) {
  return (
    <div>
      {searchedTopics.map((topic) => (
        <div key={topic.id}>{topic.content}</div>
      ))}
    </div>
  );
}
