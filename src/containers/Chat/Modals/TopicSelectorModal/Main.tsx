import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { Content } from '~/types';

export default function Main({
  allTopicObj,
  canAddTopic,
  myTopicObj,
  channelId,
  currentTopic,
  displayedThemeColor,
  featuredTopic,
  isLoaded,
  isOwner,
  isTwoPeopleChat,
  onSetAllTopicObj,
  onSetMyTopicObj,
  onSelectTopic,
  pinnedTopicIds
}: {
  allTopicObj: any;
  canAddTopic: boolean;
  myTopicObj: any;
  channelId: number;
  currentTopic: any;
  featuredTopic?: any;
  displayedThemeColor: string;
  isLoaded: boolean;
  isOwner: boolean;
  isTwoPeopleChat: boolean;
  onSetAllTopicObj: (v: any) => void;
  onSetMyTopicObj: (v: any) => void;
  onSelectTopic: (v: number) => void;
  pinnedTopicIds: number[];
}) {
  const [activeTab, setActiveTab] = useState('all');
  const loadMoreChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadMoreChatSubjects
  );
  const [subjectObj, setSubjectObj] = useState<Record<string, Content>>({});

  useEffect(() => {
    const subjectObj: Record<string, Content> = {};
    for (const subject of allTopicObj.subjects) {
      subjectObj[subject.id] = subject;
    }
    for (const subject of myTopicObj.subjects) {
      subjectObj[subject.id] = subject;
    }
    setSubjectObj(subjectObj);
  }, [allTopicObj?.subjects, myTopicObj?.subjects]);

  return (
    <div style={{ width: '100%' }}>
      {!isLoaded && <Loading />}
      <div style={{ width: '100%', marginTop: '3rem' }}>
        {!isTwoPeopleChat && (
          <>
            <h3
              style={{
                color: Color[displayedThemeColor](),
                marginBottom: '1rem'
              }}
            >
              Current Topic
            </h3>
            <TopicItem
              key="current"
              channelId={channelId}
              hideCurrentLabel
              isFeatured={featuredTopic?.id === currentTopic.id}
              isOwner={isOwner}
              currentTopicId={currentTopic.id}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              pinnedTopicIds={pinnedTopicIds}
              {...((subjectObj[currentTopic.id] || currentTopic) as any)}
              onEditTopic={({
                topicText,
                isOwnerPostingOnly
              }: {
                topicText: string;
                isOwnerPostingOnly: boolean;
              }) =>
                handleEditTopic({
                  topicText,
                  isOwnerPostingOnly,
                  topicId: currentTopic.id
                })
              }
            />
            <h3
              style={{
                color: Color[displayedThemeColor](),
                marginTop: '3rem',
                marginBottom: '1rem'
              }}
            >
              Featured Topic
            </h3>
            <TopicItem
              key="featured"
              channelId={channelId}
              hideCurrentLabel
              hideFeatureButton
              isFeatured
              isOwner={isOwner}
              currentTopicId={currentTopic.id}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              pinnedTopicIds={pinnedTopicIds}
              {...((subjectObj[featuredTopic.id] || featuredTopic) as any)}
              onEditTopic={({
                topicText,
                isOwnerPostingOnly
              }: {
                topicText: string;
                isOwnerPostingOnly: boolean;
              }) =>
                handleEditTopic({
                  topicText,
                  isOwnerPostingOnly,
                  topicId: featuredTopic.id
                })
              }
            />
          </>
        )}
        {isLoaded && (
          <>
            {canAddTopic ? (
              <FilterBar
                className={css`
                  margin-top: 1rem;
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
            ) : (
              <h3
                className={css`
                  margin-top: 3rem;
                  margin-bottom: 1rem;
                  color: ${Color[displayedThemeColor]()};
                `}
              >
                All Topics
              </h3>
            )}
          </>
        )}
        {activeTab === 'all' && (
          <div>
            {isLoaded && allTopicObj.subjects.length === 0 && (
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
                  channelId={channelId}
                  isOwner={isOwner}
                  isFeatured={subject.id === featuredTopic?.id}
                  isTwoPeopleChat={isTwoPeopleChat}
                  currentTopicId={currentTopic.id}
                  displayedThemeColor={displayedThemeColor}
                  onSelectTopic={onSelectTopic}
                  pinnedTopicIds={pinnedTopicIds}
                  {...((subjectObj[subject.id] || subject) as any)}
                  onEditTopic={({
                    topicText,
                    isOwnerPostingOnly
                  }: {
                    topicText: string;
                    isOwnerPostingOnly: boolean;
                  }) =>
                    handleEditTopic({
                      topicText,
                      isOwnerPostingOnly,
                      topicId: subject.id
                    })
                  }
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
                  channelId={channelId}
                  isFeatured={subject.id === featuredTopic?.id}
                  isTwoPeopleChat={isTwoPeopleChat}
                  isOwner={isOwner}
                  currentTopicId={currentTopic.id}
                  displayedThemeColor={displayedThemeColor}
                  pinnedTopicIds={pinnedTopicIds}
                  onSelectTopic={onSelectTopic}
                  {...((subjectObj[subject.id] || subject) as any)}
                  onEditTopic={({
                    topicText,
                    isOwnerPostingOnly
                  }: {
                    topicText: string;
                    isOwnerPostingOnly: boolean;
                  }) =>
                    handleEditTopic({
                      topicText,
                      isOwnerPostingOnly,
                      topicId: subject.id
                    })
                  }
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
    </div>
  );

  function handleEditTopic({
    topicText,
    isOwnerPostingOnly,
    topicId
  }: {
    topicText: string;
    isOwnerPostingOnly: boolean;
    topicId: number;
  }) {
    setSubjectObj((prev) => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        content: topicText,
        settings: {
          ...(prev[topicId]?.settings || {}),
          isOwnerPostingOnly
        }
      }
    }));
  }

  async function handleLoadMoreTopics(mineOnly: boolean) {
    if (mineOnly) {
      onSetMyTopicObj({ ...myTopicObj, loading: true });
    } else {
      onSetAllTopicObj({ ...allTopicObj, loading: true });
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
      onSetMyTopicObj({
        ...myTopicObj,
        subjects: myTopicObj.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    } else {
      onSetAllTopicObj({
        ...allTopicObj,
        subjects: allTopicObj.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    }
  }
}
