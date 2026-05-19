import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import Banner from '~/components/Banner';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeFilter from './HomeFilter';
import TopMenu from '../TopMenu';
import Featured from './Featured';
import HomeFeedCard from './FeedCard';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useInfiniteScroll } from '~/helpers/hooks';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';
import { useScrollAnchor } from './hooks/useScrollAnchor';

const hiThereLabel = 'Hi there!';

const categoryObj: Record<string, any> = {
  uploads: {
    filter: 'subject',
    orderBy: 'lastInteraction'
  },
  recommended: {
    filter: 'all',
    isRecommended: true,
    orderBy: 'lastInteraction'
  },
  responses: {
    filter: 'comment',
    orderBy: 'totalRewards'
  },
  dailyReflections: {
    filter: 'dailyReflection',
    orderBy: 'lastInteraction'
  }
};

function getHomeFeedAnchorId(
  feed: { [key: string]: any } = {},
  index: number
) {
  const parts = [
    getHomeFeedAnchorPart('feed', feed.feedId),
    getHomeFeedAnchorPart('type', feed.contentType),
    getHomeFeedAnchorPart('content', feed.contentId),
    getHomeFeedAnchorPart('activity', feed.feedActivityType),
    getHomeFeedAnchorPart('rootType', feed.rootType),
    getHomeFeedAnchorPart('root', feed.rootId),
    getHomeFeedAnchorPart('rootComment', feed.rootCommentId),
    getHomeFeedAnchorPart('subject', feed.subjectId),
    getHomeFeedAnchorPart('uploader', feed.uploaderId),
    getHomeFeedAnchorPart('time', feed.timeStamp),
    getHomeFeedAnchorPart('last', feed.lastInteraction),
    getHomeFeedAnchorPart('view', feed.viewTimeStamp),
    getHomeFeedAnchorPart('position', index)
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('|') : `position:${index}`;
}

function getHomeFeedAnchorPart(label: string, value: unknown) {
  const normalizedValue =
    value === null || typeof value === 'undefined' ? '' : String(value).trim();
  return normalizedValue ? `${label}:${normalizedValue}` : '';
}

export default function Stories() {
  const loadingMoreRef = useRef(false);
  const loadFeeds = useAppContext((v) => v.requestHelpers.loadFeeds);
  const loadNewFeeds = useAppContext((v) => v.requestHelpers.loadNewFeeds);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const alertColorKey = alertRole.colorKey;
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);
  const onResetNumNewPosts = useNotiContext(
    (v) => v.actions.onResetNumNewPosts
  );
  const onSetNumNewPosts = useNotiContext((v) => v.actions.onSetNumNewPosts);
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetDailyQuestionModalShown = useHomeContext(
    (v) => v.actions.onSetDailyQuestionModalShown
  );
  const category = useHomeContext((v) => v.state.category);
  const displayOrder = useHomeContext((v) => v.state.displayOrder);
  const feeds = useHomeContext((v) => v.state.feeds);
  const loadMoreButton = useHomeContext((v) => v.state.loadMoreButton);
  const loaded = useHomeContext((v) => v.state.loaded);
  const feedsOutdated = useHomeContext((v) => v.state.feedsOutdated);
  const subFilter = useHomeContext((v) => v.state.subFilter);
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
  const onChangeCategory = useHomeContext((v) => v.actions.onChangeCategory);
  const onChangeSubFilter = useHomeContext((v) => v.actions.onChangeSubFilter);
  const onLoadFeeds = useHomeContext((v) => v.actions.onLoadFeeds);
  const onLoadMoreFeeds = useHomeContext((v) => v.actions.onLoadMoreFeeds);
  const onLoadNewFeeds = useHomeContext((v) => v.actions.onLoadNewFeeds);
  const onSetDisplayOrder = useHomeContext((v) => v.actions.onSetDisplayOrder);
  const onSetFeedsOutdated = useHomeContext(
    (v) => v.actions.onSetFeedsOutdated
  );

  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingFilteredFeeds, setLoadingFilteredFeeds] = useState(false);
  const [loadingCategorizedFeeds, setLoadingCategorizedFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingNewFeeds, setLoadingNewFeeds] = useState(false);
  const categoryRef: React.RefObject<any> = useRef(null);
  const ContainerRef = useRef(null);
  const FeedListRef = useRef<HTMLDivElement | null>(null);
  const subFilterRef = useRef<string | null>(null);
  const displayOrderRef = useRef(displayOrder);
  const numNewPostsRef = useRef(numNewPosts);
  const mountedRef = useRef(true);

  const loadingPosts = useMemo(
    () => loadingFeeds || loadingFilteredFeeds || loadingCategorizedFeeds,
    [loadingCategorizedFeeds, loadingFeeds, loadingFilteredFeeds]
  );

  const { panelVars } = useHomePanelVars(0.08);
  const feedListClass = useMemo(
    () => css`
      display: flex;
      flex-direction: column;
      width: 100%;
    `,
    []
  );
  const feedItemCustomClass = useMemo(
    () => css`
      /* spacing only; no background, no border */
      padding: 0.4rem 1.1rem;
      transition: background 0.15s ease;
      &:first-of-type {
        padding-top: 0;
      }
      @media (max-width: ${mobileMaxWidth}) {
        padding: 0.3rem 0;
      }
    `,
    []
  );
  useEffect(() => {
    subFilterRef.current = subFilter;
  }, [subFilter]);

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  useEffect(() => {
    displayOrderRef.current = displayOrder;
  }, [displayOrder]);

  useEffect(() => {
    numNewPostsRef.current = numNewPosts;
  }, [numNewPosts]);

  useEffect(() => {
    loadingMoreRef.current = false;
    setLoadingFeeds(false);
    setLoadingFilteredFeeds(false);
    setLoadingCategorizedFeeds(false);
    setLoadingMore(false);
    setLoadingNewFeeds(false);
  }, [userId]);

  useInfiniteScroll({
    scrollable: feeds?.length > 0 && !loadingMoreRef.current,
    feedsLength: feeds?.length,
    onScrollToBottom: handleLoadMoreFeeds
  });

  const homeFeedAnchorKey = useMemo(
    () => `${category}:${subFilter}:${displayOrder}`,
    [category, displayOrder, subFilter]
  );

  useScrollAnchor({
    anchorKey: homeFeedAnchorKey,
    containerRef: FeedListRef,
    feedsReady: loaded && !loadingPosts && feeds?.length > 0
  });

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000;

    if (!loaded) {
      handleLoadFeeds();
    }

    async function handleLoadFeeds(attempts = 0) {
      if (!mountedRef.current) return;
      const requestUserId = userId;
      if (shouldIgnoreStoryRequest(requestUserId)) return;

      setLoadingFeeds(true);
      try {
        categoryRef.current = 'uploads';
        onChangeCategory('recommended');
        onChangeSubFilter('all');
        onResetNumNewPosts();

        const { data } = await loadFeeds({ isRecommended: true });
        if (!shouldIgnoreStoryRequest(requestUserId)) {
          onLoadFeeds(data);
        }
      } catch (error: any) {
        if (shouldIgnoreStoryRequest(requestUserId)) return;
        console.error(error);
        if (attempts < maxRetries) {
          setTimeout(() => handleLoadFeeds(attempts + 1), retryDelay);
        }
      } finally {
        if (!shouldIgnoreStoryRequest(requestUserId)) {
          setLoadingFeeds(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, userId]);

  const beTheFirstLabel = useMemo(() => {
    return `Hello ${username}, be the first to post something`;
  }, [username]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      paddingBottom: '1rem',
      ...(panelVars as React.CSSProperties)
    }),
    [panelVars]
  );

  return (
    <ErrorBoundary componentPath="Home/Stories/index">
      <div
        key={`${category}-${subFilter}`}
        style={containerStyle}
        ref={ContainerRef}
      >
        <TopMenu
          onInputModalButtonClick={(modalType) =>
            onSetInputModalShown({ shown: true, modalType })
          }
          onPlayAIStories={() => onSetAIStoriesModalShown(true)}
          onPlayGrammarGame={() => onSetGrammarGameModalShown(true)}
          onDailyQuestionClick={() => onSetDailyQuestionModalShown(true)}
        />
        <Featured />
        <HomeFilter
          category={category}
          changeCategory={handleChangeCategory}
          displayOrder={displayOrder}
          selectedFilter={subFilter}
          applyFilter={handleApplyFilter}
          setDisplayOrder={handleDisplayOrder}
        />
        <div style={{ width: '100%' }}>
          {loadingPosts ? <Loading text="Loading Posts..." /> : null}
          {loaded && feeds?.length === 0 && !loadingPosts ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '15rem'
              }}
            >
              <h1 style={{ textAlign: 'center' }}>
                {username ? beTheFirstLabel : hiThereLabel}
              </h1>
            </div>
          ) : null}
          {loaded && !loadingPosts && feeds?.length > 0 ? (
            <>
              {displayOrder === 'desc' && numNewPosts > 0 ? (
                <Banner
                  color={alertColorKey}
                  onClick={handleFetchNewFeeds}
                  style={{
                    marginBottom: '1rem',
                    opacity: loadingNewFeeds ? 0.5 : 1
                  }}
                >
                  Tap to See {numNewPosts} New Post
                  {numNewPosts > 1 ? 's' : ''}
                  {loadingNewFeeds && (
                    <Icon style={{ marginLeft: '1rem' }} icon="spinner" pulse />
                  )}
                </Banner>
              ) : (
                displayOrder === 'desc' &&
                feedsOutdated && (
                  <Banner
                    color={alertColorKey}
                    onClick={handleRefreshOutdatedFeed}
                    style={{
                      marginBottom: '1rem',
                      opacity: loadingNewFeeds ? 0.5 : 1
                    }}
                  >
                    Feed updated. Tap to refresh.
                    {loadingNewFeeds && (
                      <Icon
                        style={{ marginLeft: '1rem' }}
                        icon="spinner"
                        pulse
                      />
                    )}
                  </Banner>
                )
              )}
              <div ref={FeedListRef} className={feedListClass}>
                {(feeds || []).map(
                  (feed: { [key: string]: any } = {}, index: number) => {
                    const panelKey = `${category}-${subFilter}-${feed.contentId}-${feed.contentType}-${index}`;
                    const contentKey = `${feed.contentType}-${feed.contentId}`;
                    const feedAnchorId = getHomeFeedAnchorId(feed, index);
                    return feed.contentId ? (
                      <div
                        key={panelKey}
                        className={`feed-item ${feedItemCustomClass}`}
                        data-feed-anchor-id={feedAnchorId}
                        data-feed-id={feed.feedId || undefined}
                        data-content-key={contentKey}
                        data-feed-index={index}
                        data-scroll-anchor-id={feedAnchorId}
                        data-scroll-anchor-secondary-id={
                          feed.feedId || undefined
                        }
                        data-scroll-anchor-content-key={contentKey}
                      >
                        <HomeFeedCard
                          feedAnchorId={feedAnchorId}
                          feed={feed}
                          index={index}
                          totalCount={feeds?.length || 0}
                        />
                      </div>
                    ) : null;
                  }
                )}
                {loadMoreButton ? (
                  <LoadMoreButton
                    style={{ marginTop: '0.6rem' }}
                    onClick={handleLoadMoreFeeds}
                    loading={loadingMore}
                    filled
                  />
                ) : null}
                <div
                  className={css`
                    display: ${loadMoreButton ? 'none' : 'block'};
                    height: 5rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      height: 7rem;
                      display: block;
                    }
                  `}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleApplyFilter(filter: string) {
    const maxRetries = 3;
    const retryDelay = 1000;
    let success = false;
    const requestUserId = userId;

    if (filter !== subFilterRef.current) {
      subFilterRef.current = filter || null;
      await attemptLoad();
    }

    async function attemptLoad(attempts = 0) {
      try {
        if (shouldIgnoreStoryRequest(requestUserId)) return;
        setLoadingFilteredFeeds(true);
        categoryRef.current = 'uploads';
        onChangeCategory('uploads');
        onChangeSubFilter(filter);
        onResetNumNewPosts();

        const { data, filter: newFilter } = await loadFeeds({ filter });
        if (shouldIgnoreStoryRequest(requestUserId)) return;

        if (
          subFilterRef.current === newFilter &&
          categoryRef.current === 'uploads'
        ) {
          onLoadFeeds(data);
          onSetDisplayOrder('desc');
          success = true;
        }
      } catch (error: any) {
        if (shouldIgnoreStoryRequest(requestUserId)) return;
        console.error(error);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attemptLoad(attempts + 1);
        }
      } finally {
        if (
          !shouldIgnoreStoryRequest(requestUserId) &&
          (success || attempts >= maxRetries)
        ) {
          setLoadingFilteredFeeds(false);
        }
      }
    }
  }

  async function handleLoadMoreFeeds() {
    const requestUserId = userId;
    const lastFeedId =
      feeds?.length > 0 ? feeds[feeds?.length - 1].feedId : null;
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const { data } = await loadFeeds({
        filter:
          category === 'uploads' ? subFilter : categoryObj[category].filter,
        order: displayOrder,
        orderBy: categoryObj[category].orderBy,
        isRecommended: categoryObj[category].isRecommended,
        lastFeedId,
        lastRewardLevel:
          feeds?.length > 0 ? feeds[feeds?.length - 1].rewardLevel : null,
        lastTimeStamp:
          feeds?.length > 0 ? feeds[feeds?.length - 1].lastInteraction : null,
        lastViewDuration:
          feeds?.length > 0 ? feeds[feeds?.length - 1].totalViewDuration : null
      });
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      onLoadMoreFeeds(data);
    } catch (error) {
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      console.error(error);
    } finally {
      if (!shouldIgnoreStoryRequest(requestUserId)) {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }

  async function handleChangeCategory(newCategory: string) {
    const maxRetries = 3;
    const retryDelay = 1000;
    let success = false;
    const requestUserId = userId;

    await attemptLoadFeeds();

    async function attemptLoadFeeds(attempts = 0) {
      try {
        if (shouldIgnoreStoryRequest(requestUserId)) return;
        categoryRef.current = newCategory;
        onResetNumNewPosts();
        setLoadingCategorizedFeeds(true);
        onChangeCategory(newCategory);
        onChangeSubFilter(categoryObj[newCategory].filter);

        const { filter: loadedFilter, data } = await loadFeeds({
          order: 'desc',
          filter: categoryObj[newCategory].filter,
          orderBy: categoryObj[newCategory].orderBy,
          isRecommended: categoryObj[newCategory].isRecommended
        });
        if (shouldIgnoreStoryRequest(requestUserId)) return;

        if (
          loadedFilter === categoryObj[categoryRef.current].filter &&
          categoryRef.current === newCategory
        ) {
          onLoadFeeds(data);
          onSetDisplayOrder('desc');
          success = true;
        }
      } catch (error: any) {
        if (shouldIgnoreStoryRequest(requestUserId)) return;
        console.error(error);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attemptLoadFeeds(attempts + 1);
        }
      } finally {
        if (
          !shouldIgnoreStoryRequest(requestUserId) &&
          (success || attempts >= maxRetries)
        ) {
          setLoadingCategorizedFeeds(false);
        }
      }
    }
  }

  async function handleFetchNewFeeds() {
    const initialNumNewPosts = numNewPostsRef.current;
    const requestUserId = userId;
    try {
      if (!loadingNewFeeds) {
        setLoadingNewFeeds(true);
        const data = await loadNewFeeds({
          lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0
        });
        if (shouldIgnoreStoryRequest(requestUserId)) return;

        if (data) {
          onChangeSubFilter('all');
          const currentCategory = categoryRef.current;
          if (
            currentCategory !== 'uploads' ||
            displayOrder === 'asc' ||
            (currentCategory === 'uploads' &&
              subFilterRef.current === 'subject')
          ) {
            categoryRef.current = 'uploads';
            onChangeCategory('uploads');

            const { data } = await loadFeeds();
            if (shouldIgnoreStoryRequest(requestUserId)) return;
            if (categoryRef.current === 'uploads') {
              onLoadFeeds(data);
              reconcileNumNewPostsAfterRefresh(initialNumNewPosts);
            }
            return;
          }
          onLoadNewFeeds(data);
          reconcileNumNewPostsAfterRefresh(initialNumNewPosts);
        }
      }
    } catch (error) {
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      console.error('Error fetching new feeds:', error);
    } finally {
      if (!shouldIgnoreStoryRequest(requestUserId)) {
        setLoadingNewFeeds(false);
      }
    }
  }

  async function handleRefreshOutdatedFeed() {
    if (loadingNewFeeds) return;
    const requestUserId = userId;
    const initialNumNewPosts = numNewPostsRef.current;
    const currentCategory = categoryRef.current;
    const currentSubFilter = subFilterRef.current;
    const currentDisplayOrder = displayOrder;
    const currentFilter =
      currentCategory === 'uploads'
        ? currentSubFilter || 'all'
        : categoryObj[currentCategory]?.filter || 'all';
    const currentOrderBy =
      categoryObj[currentCategory]?.orderBy || 'lastInteraction';
    const isRecommended = categoryObj[currentCategory]?.isRecommended;

    try {
      setLoadingNewFeeds(true);
      const { data: refreshedFeeds } = await loadFeeds({
        filter: currentFilter,
        order: currentDisplayOrder,
        orderBy: currentOrderBy,
        isRecommended
      });
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      if (categoryRef.current !== currentCategory) return;
      if (
        currentCategory === 'uploads' &&
        subFilterRef.current !== currentSubFilter
      ) {
        return;
      }
      if (displayOrderRef.current !== currentDisplayOrder) return;
      onLoadFeeds(refreshedFeeds);
      onSetDisplayOrder(currentDisplayOrder);
      reconcileNumNewPostsAfterRefresh(initialNumNewPosts);
    } catch (error) {
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      console.error('Error refreshing outdated feed:', error);
    } finally {
      if (!shouldIgnoreStoryRequest(requestUserId)) {
        setLoadingNewFeeds(false);
      }
    }
  }

  function reconcileNumNewPostsAfterRefresh(initialNumNewPosts: number) {
    const latestNumNewPosts = numNewPostsRef.current;
    if (latestNumNewPosts > initialNumNewPosts) {
      onSetNumNewPosts(latestNumNewPosts - initialNumNewPosts);
      return;
    }
    if (latestNumNewPosts === initialNumNewPosts && latestNumNewPosts !== 0) {
      onResetNumNewPosts();
    }
  }

  async function handleDisplayOrder() {
    const requestUserId = userId;
    const newDisplayOrder = displayOrder === 'desc' ? 'asc' : 'desc';
    const initialFilter =
      category === 'uploads' ? subFilter : categoryObj[category].filter;
    if (newDisplayOrder === 'asc') {
      onResetNumNewPosts();
      onSetFeedsOutdated(false);
    }
    setLoadingFeeds(true);
    try {
      const { data, filter } = await loadFeeds({
        order: newDisplayOrder,
        orderBy: categoryObj[category].orderBy,
        filter: initialFilter
      });
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      if (filter === initialFilter) {
        onLoadFeeds(data);
        onSetDisplayOrder(newDisplayOrder);
      }
    } catch (error) {
      if (shouldIgnoreStoryRequest(requestUserId)) return;
      console.error(error);
    } finally {
      if (!shouldIgnoreStoryRequest(requestUserId)) {
        setLoadingFeeds(false);
      }
    }
  }

  function shouldIgnoreStoryRequest(requestUserId: number | null | undefined) {
    return !mountedRef.current || checkUserChange(requestUserId);
  }
}
