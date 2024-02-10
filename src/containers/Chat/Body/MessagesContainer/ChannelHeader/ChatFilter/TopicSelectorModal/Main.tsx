import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
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
            Featured Topic
          </h3>
          <div>
            This is a featured topic. It will be displayed at the top of the
            list and will be the first topic that users see when they enter the
            chat room.
          </div>
          <h3
            style={{
              color: Color[displayedThemeColor](),
              marginTop: '3rem',
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
        <div
          className={css`
            width: 100%;
            text-align: center;
            padding: 3rem 0;
            font-size: 1.5rem;
            > p {
              margin-top: 1rem;
            }
          `}
        >
          <span>Start the first topic using the text box above</span>
          <Icon style={{ marginLeft: '1rem' }} icon="arrow-up" />
        </div>
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
