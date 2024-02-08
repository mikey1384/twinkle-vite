import React from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';

export default function Main() {
  return (
    <div style={{ width: '100%' }}>
      {!loaded && <Loading />}
      {myTopicObj.subjects.length > 0 && (
        <div style={{ width: '100%', marginTop: '3rem' }}>
          <h3
            style={{
              color: Color[displayedThemeColor](),
              marginBottom: '1rem'
            }}
          >
            My Topics
          </h3>
          {myTopicObj.subjects.map(
            (subject: {
              id: number;
              content: string;
              userId: number;
              username: string;
              timeStamp: number;
              userIsOwner?: boolean;
            }) => (
              <TopicItem
                key={subject.id}
                currentSubjectId={currentTopicId}
                displayedThemeColor={displayedThemeColor}
                onSelectSubject={() => onSelectTopic(subject.id)}
                {...subject}
              />
            )
          )}
          {myTopicObj.loadMoreButton && (
            <LoadMoreButton
              filled
              loading={myTopicObj.loading}
              onClick={() => handleLoadMoreTopics(true)}
            />
          )}
        </div>
      )}
      {loaded && allTopicObj.subjects.length > 0 && (
        <div
          style={{
            margin: '1rem 0',
            marginTop: '3rem',
            width: '100%'
          }}
        >
          <h3
            style={{
              color: Color[displayedThemeColor]()
            }}
          >
            All Topics
          </h3>
        </div>
      )}
      {loaded && allTopicObj.subjects.length === 0 && (
        <div>{`There aren't any subjects here, yet`}</div>
      )}
      {allTopicObj.subjects.map(
        (subject: {
          id: number;
          content: string;
          userId: number;
          username: string;
          timeStamp: number;
          userIsOwner?: boolean;
        }) => (
          <TopicItem
            key={subject.id}
            currentSubjectId={currentTopicId}
            displayedThemeColor={displayedThemeColor}
            onSelectSubject={() => onSelectTopic(subject.id)}
            {...subject}
          />
        )
      )}
      {allTopicObj.loadMoreButton && (
        <LoadMoreButton
          filled
          loading={allTopicObj.loading}
          onClick={() => handleLoadMoreTopics(false)}
        />
      )}
    </div>
  );
}
