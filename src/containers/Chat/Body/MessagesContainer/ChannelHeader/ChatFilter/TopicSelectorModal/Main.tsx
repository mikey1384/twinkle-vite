import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

export default function Main({
  channelId,
  currentTopicId,
  displayedThemeColor,
  onSelectTopic
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  onSelectTopic: (v: number) => void;
}) {
  const loadChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadChatSubjects
  );
  const loadMoreChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadMoreChatSubjects
  );
  const [myTopicObj, setMyTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });
  const [allTopicObj, setAllTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        setMyTopicObj(mySubjects);
        setAllTopicObj(allSubjects);
        setLoaded(true);
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                currentTopicId={currentTopicId}
                displayedThemeColor={displayedThemeColor}
                onSelectTopic={onSelectTopic}
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
            currentTopicId={currentTopicId}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
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

  async function handleLoadMoreTopics(mineOnly: boolean) {
    if (mineOnly) {
      setMyTopicObj({ ...myTopicObj, loading: true });
    } else {
      setAllTopicObj({ ...allTopicObj, loading: true });
    }
    const targetSubjects = mineOnly
      ? myTopicObj.subjects
      : allTopicObj.subjects;
    const lastSubject = targetSubjects[targetSubjects.length - 1];
    const { subjects, loadMoreButton } = await loadMoreChatSubjects({
      channelId,
      mineOnly,
      lastSubject
    });
    if (mineOnly) {
      setMyTopicObj({
        ...myTopicObj,
        subjects: myTopicObj.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    } else {
      setAllTopicObj({
        ...allTopicObj,
        subjects: allTopicObj.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    }
  }
}
