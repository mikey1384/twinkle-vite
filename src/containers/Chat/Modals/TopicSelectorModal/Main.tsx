import React, { useEffect, useMemo, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import TopicItem from './TopicItem';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import SharedTopicsList from './SharedTopicsList';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { Content } from '~/types';
import TopicRequestStatus from '../TopicRequestStatus';
import { chatTopicActionStyle, chatTopicSectionClass } from '../topicStyles';

function isRenderableTopic(topic: any) {
  return (
    Number(topic?.id || 0) > 0 &&
    typeof topic?.content === 'string' &&
    topic.content.trim().length > 0
  );
}

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
  onRetrySharedTopics,
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
  onRetrySharedTopics: () => void;
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
  const pagingRef = useRef({ all: false, my: false, shared: false });
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

  const activeCurrentTopic = useMemo(() => {
    if (!currentTopic?.id) return null;
    const loadedTopic = subjectObj[currentTopic.id];
    if (isRenderableTopic(loadedTopic)) return loadedTopic;
    if (isRenderableTopic(currentTopic)) return currentTopic;
    return null;
  }, [currentTopic, subjectObj]);
  const activeFeaturedTopic = useMemo(() => {
    if (!featuredTopic?.id) return null;
    const loadedTopic = subjectObj[featuredTopic.id];
    if (isRenderableTopic(loadedTopic)) return loadedTopic;
    if (isRenderableTopic(featuredTopic)) return featuredTopic;
    return null;
  }, [featuredTopic, subjectObj]);
  const activeCurrentTopicId = Number(activeCurrentTopic?.id || 0);
  const activeFeaturedTopicId = Number(activeFeaturedTopic?.id || 0);

  return (
    <div style={{ width: '100%', paddingBottom: '1rem' }}>
      {!isLoaded && <Loading text="Loading topics" innerStyle={{ fontSize: '14px' }} />}
      <div style={{ width: '100%', marginTop: '1.5rem' }}>
        {!isTwoPeopleChat && (
          <>
            {activeCurrentTopic && activeCurrentTopicId > 0 && (
              <>
                <h3 className={chatTopicSectionClass}>
                  Current Topic
                </h3>
                <TopicItem
                  key="current"
                  channelId={channelId}
                  hideCurrentLabel
                  isFeatured={activeFeaturedTopicId === activeCurrentTopicId}
                  isOwner={isOwner}
                  isTwoPeopleChat={isTwoPeopleChat}
                  isAIChannel={isAIChannel}
                  currentTopicId={activeCurrentTopicId}
                  displayedThemeColor={displayedThemeColor}
                  onSelectTopic={onSelectTopic}
                  pinnedTopicIds={pinnedTopicIds}
                  pathId={pathId}
                  {...(activeCurrentTopic as any)}
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
                      topicId: activeCurrentTopicId,
                      customInstructions,
                      isSharedWithOtherUsers
                    })
                  }
                  onDeleteTopic={onDeleteTopic}
                />
              </>
            )}
            {activeFeaturedTopic && activeFeaturedTopicId > 0 && (
              <>
                <h3 className={chatTopicSectionClass}>
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
                  currentTopicId={activeCurrentTopicId}
                  displayedThemeColor={displayedThemeColor}
                  onSelectTopic={onSelectTopic}
                  pinnedTopicIds={pinnedTopicIds}
                  pathId={pathId}
                  {...(activeFeaturedTopic as any)}
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
                      topicId: activeFeaturedTopicId,
                      customInstructions,
                      isSharedWithOtherUsers
                    })
                  }
                  onDeleteTopic={onDeleteTopic}
                />
              </>
            )}
          </>
        )}
        {isLoaded && !showSharedOnly && (
          <>
            {shouldShowFilterBar ? (
              <div
                role="group"
                aria-label="Filter topics"
              >
                <FilterBar
                  color={displayedThemeColor}
                  style={{ margin: '20px 0 8px', fontSize: '14px' }}
                  className={css`
                    && > .nav-section > nav {
                      padding: 0;
                      min-width: 0;
                    }
                    && > .nav-section > nav > button {
                      width: 100%;
                      min-height: 44px;
                      padding: 8px 12px;
                      border: 0;
                      background: transparent;
                      color: inherit;
                      font: inherit;
                      cursor: pointer;
                      &:focus-visible {
                        outline: 2px solid #64748b;
                        outline-offset: -2px;
                      }
                    }
                  `}
                >
                  <nav
                    role="presentation"
                    className={activeTab === 'all' ? 'active' : ''}
                  >
                    <button
                      type="button"
                      aria-pressed={activeTab === 'all'}
                      onClick={() => handleTabSelect('all')}
                    >
                      {hasMyTopics ? 'All Topics' : 'My Topics'}
                    </button>
                  </nav>
                  {hasMyTopics && (
                    <nav
                      role="presentation"
                      className={activeTab === 'my' ? 'active' : ''}
                    >
                      <button
                        type="button"
                        aria-pressed={activeTab === 'my'}
                        onClick={() => handleTabSelect('my')}
                      >
                        My Topics
                      </button>
                    </nav>
                  )}
                  {isAIChannel && (
                    <nav
                      role="presentation"
                      className={activeTab === 'shared' ? 'active' : ''}
                    >
                      <button
                        type="button"
                        aria-pressed={activeTab === 'shared'}
                        onClick={() => handleTabSelect('shared')}
                      >
                        Shared Topics
                      </button>
                    </nav>
                  )}
                </FilterBar>
              </div>
            ) : (
              <h3 className={chatTopicSectionClass}>
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
                  font-size: 16px;
                  > p {
                    margin-top: 1rem;
                  }
                `}
              >
                <span>{canAddTopic ? 'Start the first topic using the text box above' : 'No topics have been posted yet.'}</span>
                {canAddTopic && <Icon style={{ marginLeft: '1rem' }} icon="arrow-up" />}
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
                  isFeatured={subject.id === activeFeaturedTopicId}
                  isTwoPeopleChat={isTwoPeopleChat}
                  isAIChannel={isAIChannel}
                  currentTopicId={activeCurrentTopicId}
                  displayedThemeColor={displayedThemeColor}
                  onSelectTopic={onSelectTopic}
                  pinnedTopicIds={pinnedTopicIds}
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
            {allTopicObj.error && <TopicRequestStatus message={allTopicObj.error} onRetry={() => handleLoadMoreTopics(false)} />}
            {allTopicObj.loadMoreButton && !allTopicObj.error && (
              <LoadMoreButton
                filled
                style={{ ...chatTopicActionStyle, marginTop: '1rem' }}
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
                  isFeatured={subject.id === activeFeaturedTopicId}
                  isTwoPeopleChat={isTwoPeopleChat}
                  isAIChannel={isAIChannel}
                  isOwner={isOwner}
                  currentTopicId={activeCurrentTopicId}
                  displayedThemeColor={displayedThemeColor}
                  pinnedTopicIds={pinnedTopicIds}
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
            {myTopicObj.error && <TopicRequestStatus message={myTopicObj.error} onRetry={() => handleLoadMoreTopics(true)} />}
            {myTopicObj.loadMoreButton && !myTopicObj.error && (
              <LoadMoreButton
                style={{ ...chatTopicActionStyle, marginTop: '1rem' }}
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
            onRetry={sharedTopicObj.subjects.length ? handleLoadMoreSharedTopics : onRetrySharedTopics}
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
    // Keep both paginated lists in sync with an acknowledged topic edit.
    // Otherwise their next page replaces the locally edited label with an old snapshot.
    const updateList = (prev: any) => ({
      ...prev,
      subjects: prev.subjects.map((subject: any) => subject.id === topicId ? {
        ...subject,
        content: topicText,
        settings: {
          ...subject.settings,
          isOwnerPostingOnly,
          ...(typeof customInstructions !== 'undefined' && { customInstructions }),
          ...(typeof isSharedWithOtherUsers === 'boolean' && { isSharedWithOtherUsers })
        }
      } : subject)
    });
    onSetAllTopicObj(updateList);
    onSetMyTopicObj(updateList);
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
    const key = mineOnly ? 'my' : 'all';
    const target = mineOnly ? myTopicObj : allTopicObj;
    const setTarget = mineOnly ? onSetMyTopicObj : onSetAllTopicObj;
    if (pagingRef.current[key] || target.loading || !target.subjects.length) return;
    pagingRef.current[key] = true;
    setTarget((prev: any) => ({ ...prev, loading: true, error: '' }));
    try {
      const { subjects, loadMoreButton } = await loadMoreChatSubjects({
        channelId, mineOnly, lastSubject: target.subjects[target.subjects.length - 1]
      });
      setTarget((prev: any) => ({
        ...prev,
        subjects: prev.subjects.concat(subjects.filter((subject: { id: number }) =>
          subject.id !== currentTopic?.id && !prev.subjects.some((existing: { id: number }) => existing.id === subject.id)
        )),
        loadMoreButton,
        error: ''
      }));
    } catch (error) {
      console.error(error);
      setTarget((prev: any) => ({ ...prev, error: "Couldn't load more topics. Please try again." }));
    } finally {
      pagingRef.current[key] = false;
      setTarget((prev: any) => ({ ...prev, loading: false }));
    }
  }

  async function handleLoadMoreSharedTopics() {
    if (!sharedTopicObj.subjects.length || sharedTopicObj.loading || pagingRef.current.shared) {
      return;
    }
    const lastSubject =
      sharedTopicObj.subjects[sharedTopicObj.subjects.length - 1];
    pagingRef.current.shared = true;
    onSetSharedTopicObj((prev: any) => ({ ...prev, loading: true, error: '' }));
    try {
      const { subjects, loadMoreButton } = await loadMoreOtherUserTopics({
        lastSubject
      });
      onSetSharedTopicObj((prev: any) => ({
        ...prev,
        subjects: prev.subjects.concat(subjects.filter((subject: { id: number }) =>
          !prev.subjects.some((existing: { id: number }) => existing.id === subject.id)
        )),
        loadMoreButton,
        error: ''
      }));
    } catch (error) {
      console.error(error);
      onSetSharedTopicObj((prev: any) => ({ ...prev, error: "Couldn't load more shared topics. Please try again." }));
    } finally {
      pagingRef.current.shared = false;
      onSetSharedTopicObj((prev: any) => ({ ...prev, loading: false }));
    }
  }
}
