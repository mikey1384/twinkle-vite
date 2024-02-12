import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

export default function Main({
  channelId,
  currentTopic,
  featuredTopic,
  displayedThemeColor,
  onSelectTopic
}: {
  channelId: number;
  currentTopic: any;
  featuredTopic: any;
  displayedThemeColor: string;
  onSelectTopic: (v: number) => void;
}) {
  const [activeTab, setActiveTab] = useState('all');
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
          <TopicItem
            key="featured"
            hideCurrentLabel
            currentTopicId={currentTopic.id}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
            {...featuredTopic}
          />
          <h3
            style={{
              color: Color[displayedThemeColor](),
              marginTop: '3rem',
              marginBottom: '1rem'
            }}
          >
            Current Topic
          </h3>
          <TopicItem
            key="current"
            hideCurrentLabel
            currentTopicId={currentTopic.id}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
            {...currentTopic}
          />
          <FilterBar
            className={css`
              font-size: 1.5rem !important;
              height: 4.5rem !important;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem !important;
                height: 3rem !important;
              }
            `}
          >
            <nav
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => {
                setActiveTab('all');
              }}
            >
              All Topics
            </nav>
            <nav
              className={activeTab === 'my' ? 'active' : ''}
              onClick={() => {
                setActiveTab('my');
              }}
            >
              My Topics
            </nav>
          </FilterBar>
          {activeTab === 'all' && (
            <div>
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
                    currentTopicId={currentTopic.id}
                    displayedThemeColor={displayedThemeColor}
                    onSelectTopic={onSelectTopic}
                    {...subject}
                  />
                )
              )}
              {allTopicObj.loadMoreButton && (
                <LoadMoreButton
                  filled
                  style={{ marginTop: '1rem' }}
                  loading={allTopicObj.loading}
                  onClick={() => handleLoadMoreTopics(false)}
                />
              )}
            </div>
          )}
          {activeTab === 'my' && (
            <div>
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
                    currentTopicId={currentTopic.id}
                    displayedThemeColor={displayedThemeColor}
                    onSelectTopic={onSelectTopic}
                    {...subject}
                  />
                )
              )}
              {myTopicObj.loadMoreButton && (
                <LoadMoreButton
                  style={{ marginTop: '1rem' }}
                  filled
                  loading={myTopicObj.loading}
                  onClick={() => handleLoadMoreTopics(true)}
                />
              )}
            </div>
          )}
        </div>
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
