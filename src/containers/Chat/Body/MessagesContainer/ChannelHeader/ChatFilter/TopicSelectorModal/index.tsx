import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import TopicInput from './TopicInput';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';

export default function TopicSelectorModal({
  channelId,
  currentTopicId,
  displayedThemeColor,
  onHide,
  onSelectTopic
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  onHide: () => void;
  onSelectTopic: (v: number) => void;
}) {
  const loadChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadChatSubjects
  );
  const loadMoreChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadMoreChatSubjects
  );
  const [loaded, setLoaded] = useState(false);
  const [mySubjects, setMySubjects] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });
  const [allTopicObj, setAllTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });

  useEffect(() => {
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        setMySubjects(mySubjects);
        setAllTopicObj(allSubjects);
        setLoaded(true);
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal wrapped onHide={onHide}>
      <header>Topics</header>
      <main>
        <div style={{ width: '100%' }}>
          <h3
            className={css`
              margin-bottom: 1rem;
              color: ${Color[displayedThemeColor]()};
            `}
          >
            Search / Start a Topic
          </h3>
        </div>
        <TopicInput
          displayedThemeColor={displayedThemeColor}
          onSelectTopic={(topic) => console.log(topic)}
          onSubmit={() => console.log('submit')}
        />
        {!loaded && <Loading />}
        {mySubjects.subjects.length > 0 && (
          <div style={{ width: '100%', marginTop: '3rem' }}>
            <h3
              style={{
                color: Color[displayedThemeColor](),
                marginBottom: '1rem'
              }}
            >
              My Topics
            </h3>
            {mySubjects.subjects.map(
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
            {mySubjects.loadMoreButton && (
              <LoadMoreButton
                filled
                loading={mySubjects.loading}
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
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleLoadMoreTopics(mineOnly: boolean) {
    if (mineOnly) {
      setMySubjects({ ...mySubjects, loading: true });
    } else {
      setAllTopicObj({ ...allTopicObj, loading: true });
    }
    const targetSubjects = mineOnly
      ? mySubjects.subjects
      : allTopicObj.subjects;
    const lastSubject = targetSubjects[targetSubjects.length - 1];
    const { subjects, loadMoreButton } = await loadMoreChatSubjects({
      channelId,
      mineOnly,
      lastSubject
    });
    if (mineOnly) {
      setMySubjects({
        ...mySubjects,
        subjects: mySubjects.subjects.concat(subjects),
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
