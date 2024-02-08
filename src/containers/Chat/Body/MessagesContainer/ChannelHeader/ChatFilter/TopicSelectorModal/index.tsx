import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
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
  const [topicSearchText, setTopicSearchText] = useState('');
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
          topicSearchText={topicSearchText}
          onSetTopicSearchText={setTopicSearchText}
        />
        <Main />
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
