import React, { useEffect, useMemo, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import SharedTopicsList from './SharedTopicsList';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { Content } from '~/types';

export default function Main({
  allTopicObj,
  canAddTopic,
  myTopicObj,
  channelId,
  channelName,
  currentTopic,
  displayedThemeColor,
  featuredTopic,
  isLoaded,
  isOwner,
  isTwoPeopleChat,
  isAIChannel,
  onSetAllTopicObj,
  onSetMyTopicObj,
  sharedTopicObj,
  onSetSharedTopicObj,
  onSelectTopic,
  onDeleteTopic,
  pinnedTopicIds,
  pathId,
  onHide
}: {
  allTopicObj: any;
  canAddTopic: boolean;
  myTopicObj: any;
  channelId: number;
  channelName: string;
  currentTopic: any;
  featuredTopic?: any;
  displayedThemeColor: string;
  isLoaded: boolean;
  isOwner: boolean;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  onSetAllTopicObj: (v: any) => void;
  onSetMyTopicObj: (v: any) => void;
  sharedTopicObj: any;
  onSetSharedTopicObj: (v: any) => void;
  onSelectTopic: (v: number) => void;
  onDeleteTopic: (v: number) => void;
  pinnedTopicIds: number[];
  pathId: string;
  onHide: () => void;
}) {
  const hasMyTopics = useMemo(
    () => !!(myTopicObj?.subjects || []).length && !isAIChannel,
    [myTopicObj?.subjects, isAIChannel]
  );
  const hasAllTopics = useMemo(
    () => !!(allTopicObj?.subjects || []).length,
    [allTopicObj?.subjects]
  );
  const showSharedOnly = useMemo(
    () => isAIChannel && !hasMyTopics && !hasAllTopics,
    [hasAllTopics, hasMyTopics, isAIChannel]
  );
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'shared'>(() =>
    showSharedOnly ? 'shared' : 'all'
  );
  const sharedTabForcedRef = useRef(showSharedOnly);
  const loadMoreChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadMoreChatSubjects
  );
  const loadMoreOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadMoreOtherUserTopics
  );
  const [subjectObj, setSubjectObj] = useState<Record<string, Content>>({});
  const shouldShowFilterBar = useMemo(() => {
    if (showSharedOnly) {
      return false;
    }
    if (isAIChannel) return true;
    return canAddTopic && hasMyTopics;
  }, [canAddTopic, hasMyTopics, isAIChannel, showSharedOnly]);

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

  useEffect(() => {
    if (showSharedOnly) {
      sharedTabForcedRef.current = true;
      if (activeTab !== 'shared') {
        setActiveTab('shared');
      }
      return;
    }
    if (sharedTabForcedRef.current && activeTab === 'shared') {
      sharedTabForcedRef.current = false;
      setActiveTab('all');
      return;
    }
    if (activeTab === 'shared' && !isAIChannel) {
      sharedTabForcedRef.current = false;
      setActiveTab('all');
    } else if (activeTab === 'my' && !hasMyTopics) {
      sharedTabForcedRef.current = false;
      setActiveTab('all');
    }
  }, [activeTab, hasMyTopics, isAIChannel, showSharedOnly]);

  const effectivePinnedTopicIds = useMemo(
    () => (pinnedTopicIds || []).filter((id) => !!subjectObj[id]),
    [pinnedTopicIds, subjectObj]
  );

  return (
    <div style={{ width: '100%', paddingBottom: '1rem' }}>
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
              isFeatured={featuredTopic?.id === currentTopic?.id}
              isOwner={isOwner}
              isTwoPeopleChat={isTwoPeopleChat}
              isAIChannel={isAIChannel}
              currentTopicId={currentTopic?.id}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              pinnedTopicIds={effectivePinnedTopicIds}
              pathId={pathId}
              {...((subjectObj[currentTopic?.id] || currentTopic) as any)}
              onEditTopic={({
                topicText,
                isOwnerPostingOnly,
                customInstructions,
                isSharedWithOtherUsers
              }: {
                topicText: string;
                isOwnerPostingOnly: boolean;
                customInstructions?: string;
                isSharedWithOtherUsers?: boolean;
              }) =>
                handleEditTopic({
                  topicText,
                  isOwnerPostingOnly,
                  topicId: currentTopic.id,
                  customInstructions,
                  isSharedWithOtherUsers
                })
              }
              onDeleteTopic={onDeleteTopic}
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
              isTwoPeopleChat={isTwoPeopleChat}
              isAIChannel={isAIChannel}
              currentTopicId={currentTopic.id}
              displayedThemeColor={displayedThemeColor}
              onSelectTopic={onSelectTopic}
              pinnedTopicIds={effectivePinnedTopicIds}
              pathId={pathId}
              {...((subjectObj[featuredTopic?.id] || featuredTopic) as any)}
              onEditTopic={({
                topicText,
                isOwnerPostingOnly,
                customInstructions,
                isSharedWithOtherUsers
              }: {
                topicText: string;
                isOwnerPostingOnly: boolean;
                customInstructions?: string;
                isSharedWithOtherUsers?: boolean;
              }) =>
                handleEditTopic({
                  topicText,
                  isOwnerPostingOnly,
                  topicId: featuredTopic?.id,
                  customInstructions,
                  isSharedWithOtherUsers
                })
              }
              onDeleteTopic={onDeleteTopic}
            />
          </>
        )}
        {isLoaded && !showSharedOnly && (
          <>
            {shouldShowFilterBar ? (
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
                  onClick={() => handleTabSelect('all')}
                >
                  {hasMyTopics ? 'All Topics' : 'My Topics'}
                </nav>
                {hasMyTopics && (
                  <nav
                    className={activeTab === 'my' ? 'active' : ''}
                    onClick={() => handleTabSelect('my')}
                  >
                    My Topics
                  </nav>
                )}
                {isAIChannel && (
                  <nav
                    className={activeTab === 'shared' ? 'active' : ''}
                    onClick={() => handleTabSelect('shared')}
                  >
                    Shared Topics
                  </nav>
                )}
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
        {!showSharedOnly && activeTab === 'all' && (
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
                  isAIChannel={isAIChannel}
                  currentTopicId={currentTopic.id}
                  displayedThemeColor={displayedThemeColor}
                  onSelectTopic={onSelectTopic}
                  pinnedTopicIds={effectivePinnedTopicIds}
                  pathId={pathId}
                  {...((subjectObj[subject.id] || subject) as any)}
                  onEditTopic={({
                    topicText,
                    isOwnerPostingOnly,
                    customInstructions,
                    isSharedWithOtherUsers
                  }: {
                    topicText: string;
                    isOwnerPostingOnly: boolean;
                    customInstructions?: string;
                    isSharedWithOtherUsers?: boolean;
                  }) =>
                    handleEditTopic({
                      topicText,
                      isOwnerPostingOnly,
                      topicId: subject.id,
                      customInstructions,
                      isSharedWithOtherUsers
                    })
                  }
                  onDeleteTopic={onDeleteTopic}
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
        {!showSharedOnly && activeTab === 'my' && (
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
                  isAIChannel={isAIChannel}
                  isOwner={isOwner}
                  currentTopicId={currentTopic.id}
                  displayedThemeColor={displayedThemeColor}
                  pinnedTopicIds={effectivePinnedTopicIds}
                  onSelectTopic={onSelectTopic}
                  pathId={pathId}
                  {...((subjectObj[subject?.id] || subject) as any)}
                  onEditTopic={({
                    topicText,
                    isOwnerPostingOnly,
                    customInstructions,
                    isSharedWithOtherUsers
                  }: {
                    topicText: string;
                    isOwnerPostingOnly: boolean;
                    customInstructions?: string;
                    isSharedWithOtherUsers?: boolean;
                  }) =>
                    handleEditTopic({
                      topicText,
                      isOwnerPostingOnly,
                      topicId: subject.id,
                      customInstructions,
                      isSharedWithOtherUsers
                    })
                  }
                  onDeleteTopic={onDeleteTopic}
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
        {(showSharedOnly || (activeTab === 'shared' && isAIChannel)) && (
          <SharedTopicsList
            channelId={channelId}
            channelName={channelName}
            displayedThemeColor={displayedThemeColor}
            sharedTopicObj={sharedTopicObj}
            pathId={pathId}
            onHide={onHide}
            onLoadMore={handleLoadMoreSharedTopics}
          />
        )}
      </div>
    </div>
  );

  function handleTabSelect(tab: 'all' | 'my' | 'shared') {
    sharedTabForcedRef.current = false;
    setActiveTab(tab);
  }

  function handleEditTopic({
    topicText,
    isOwnerPostingOnly,
    topicId,
    customInstructions,
    isSharedWithOtherUsers
  }: {
    topicText: string;
    isOwnerPostingOnly: boolean;
    topicId: number;
    customInstructions?: string;
    isSharedWithOtherUsers?: boolean;
  }) {
    setSubjectObj((prev) => ({
      ...prev,
      [topicId]: {
        ...prev[topicId],
        content: topicText,
        settings: {
          ...(prev[topicId]?.settings || {}),
          isOwnerPostingOnly,
          ...(typeof customInstructions !== 'undefined' && {
            customInstructions
          }),
          ...(typeof isSharedWithOtherUsers === 'boolean' && {
            isSharedWithOtherUsers
          })
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

    const filteredSubjects = subjects.filter(
      (subject: { id: number }) => subject.id !== currentTopic?.id
    );

    if (mineOnly) {
      onSetMyTopicObj({
        ...myTopicObj,
        subjects: myTopicObj.subjects.concat(filteredSubjects),
        loadMoreButton,
        loading: false
      });
    } else {
      onSetAllTopicObj({
        ...allTopicObj,
        subjects: allTopicObj.subjects.concat(filteredSubjects),
        loadMoreButton,
        loading: false
      });
    }
  }

  async function handleLoadMoreSharedTopics() {
    if (!sharedTopicObj.subjects.length || sharedTopicObj.loading) {
      return;
    }
    const lastSubject =
      sharedTopicObj.subjects[sharedTopicObj.subjects.length - 1];
    onSetSharedTopicObj({ ...sharedTopicObj, loading: true });
    try {
      const { subjects, loadMoreButton } = await loadMoreOtherUserTopics({
        lastSubject
      });
      onSetSharedTopicObj({
        ...sharedTopicObj,
        subjects: sharedTopicObj.subjects.concat(subjects),
        loadMoreButton,
        loading: false
      });
    } catch (error) {
      console.error(error);
      onSetSharedTopicObj({ ...sharedTopicObj, loading: false });
    }
  }
}
