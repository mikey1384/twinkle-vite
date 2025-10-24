import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import Banner from '~/components/Banner';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeFilter from './HomeFilter';
import ContentPanel from '~/components/ContentPanel';
import TopMenu from '../TopMenu';
import Featured from './Featured';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useInfiniteScroll } from '~/helpers/hooks';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import {
  useAppContext,
  useHomeContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';
import { useHomePanelVars } from '~/theme/useHomePanelVars';

const hiThereLabel = localize('hiThere');

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
  videos: {
    filter: 'video',
    orderBy: 'totalViewDuration'
  }
};

export default function Stories() {
  const loadingMoreRef = useRef(false);
  const loadFeeds = useAppContext((v) => v.requestHelpers.loadFeeds);
  const loadNewFeeds = useAppContext((v) => v.requestHelpers.loadNewFeeds);
  const hideWatched = useKeyContext((v) => v.myState.hideWatched);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const alertColorKey = alertRole.colorKey;
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);
  const onResetNumNewPosts = useNotiContext(
    (v) => v.actions.onResetNumNewPosts
  );
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
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

  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingFilteredFeeds, setLoadingFilteredFeeds] = useState(false);
  const [loadingCategorizedFeeds, setLoadingCategorizedFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingNewFeeds, setLoadingNewFeeds] = useState(false);
  const categoryRef: React.RefObject<any> = useRef(null);
  const ContainerRef = useRef(null);
  const hideWatchedRef = useRef(null);
  const subFilterRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const loadingPosts = useMemo(
    () => loadingFeeds || loadingFilteredFeeds || loadingCategorizedFeeds,
    [loadingCategorizedFeeds, loadingFeeds, loadingFilteredFeeds]
  );

  // Themed card surface + separators for clearer panel boundaries
  const { panelVars } = useHomePanelVars(0.08);
  const feedListClass = useMemo(
    () =>
      css`
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        width: 100%;

        /* gradient separators between items */
        > .feed-item {
          position: relative;
        }
        > .feed-item + .feed-item::before {
          content: '';
          position: absolute;
          top: -0.6rem;
          left: 1.2rem;
          right: 1.2rem;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            var(--ui-border-strong),
            transparent
          );
          pointer-events: none;
        }

        @media (max-width: ${mobileMaxWidth}) {
          > .feed-item + .feed-item::before {
            left: 0;
            right: 0;
          }
        }
      `,
    []
  );
  const feedItemCustomClass = useMemo(
    () =>
      css`
        /* spacing only; no background, no border */
        padding: 1.2rem 1.2rem;
        transition: background 0.15s ease;
        @media (max-width: ${mobileMaxWidth}) {
          padding-left: 0;
          padding-right: 0;
        }
      `,
    []
  );

  useEffect(() => {
    subFilterRef.current = subFilter;
  }, [subFilter]);

  useInfiniteScroll({
    scrollable: feeds?.length > 0 && !loadingMoreRef.current,
    feedsLength: feeds?.length,
    onScrollToBottom: handleLoadMoreFeeds
  });

  useEffect(() => {
    if (
      category === 'videos' &&
      loaded &&
      typeof hideWatchedRef.current === 'number' &&
      hideWatchedRef.current !== hideWatched
    ) {
      filterVideos();
    }

    async function filterVideos() {
      try {
        const { data } = await loadFeeds({
          order: 'desc',
          filter: categoryObj.videos.filter,
          orderBy: categoryObj.videos.orderBy
        });
        if (mountedRef.current && category === 'videos') {
          onLoadFeeds(data);
        }
      } catch (error) {
        console.error('Error filtering videos:', error);
      }
    }

    hideWatchedRef.current = hideWatched;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideWatched]);

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000;

    if (!loaded) {
      handleLoadFeeds();
    }

    async function handleLoadFeeds(attempts = 0) {
      if (!mountedRef.current) return;

      setLoadingFeeds(true);
      try {
        categoryRef.current = 'uploads';
        onChangeCategory('recommended');
        onChangeSubFilter('all');
        onResetNumNewPosts();

        const { data } = await loadFeeds({ isRecommended: true });
        if (mountedRef.current) {
          onLoadFeeds(data);
        }
      } catch (error: any) {
        console.error(error);
        if (mountedRef.current && attempts < maxRetries) {
          setTimeout(() => handleLoadFeeds(attempts + 1), retryDelay);
        }
      } finally {
        if (mountedRef.current) {
          setLoadingFeeds(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const beTheFirstLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `안녕하세요 ${username}님! 첫 번째 게시물을 올려보세요!`;
    }
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
        {userId && (
          <TopMenu
            onInputModalButtonClick={(modalType) =>
              onSetInputModalShown({ shown: true, modalType })
            }
            onPlayAIStories={() => onSetAIStoriesModalShown(true)}
            onPlayGrammarGame={() => onSetGrammarGameModalShown(true)}
          />
        )}
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
            <div className={feedListClass}>
              {numNewPosts > 0 ? (
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
                feedsOutdated && (
                  <Banner
                    color={alertColorKey}
                    onClick={() => window.location.reload()}
                    style={{
                      marginBottom: '1rem'
                    }}
                  >
                    Tap to See New Posts!
                  </Banner>
                )
              )}
              {(feeds || []).map(
                (feed: { [key: string]: any } = {}, index: number) => {
                  const panelKey = `${category}-${subFilter}-${feed.contentId}-${feed.contentType}-${index}`;
                  return feed.contentId ? (
                    <div
                      key={panelKey}
                      className={`feed-item ${feedItemCustomClass}`}
                    >
                      <ContentPanel
                        feedId={feed.feedId}
                        zIndex={feeds?.length - index}
                        contentId={feed.contentId}
                        contentType={feed.contentType}
                        rootType={feed.rootType}
                        commentsLoadLimit={5}
                        numPreviewComments={1}
                        style={{ margin: 0 }}
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
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleApplyFilter(filter: string) {
    const maxRetries = 3;
    const retryDelay = 1000;
    let success = false;

    if (filter !== subFilterRef.current) {
      subFilterRef.current = filter || null;
      await attemptLoad();
    }

    async function attemptLoad(attempts = 0) {
      try {
        setLoadingFilteredFeeds(true);
        categoryRef.current = 'uploads';
        onChangeCategory('uploads');
        onChangeSubFilter(filter);
        onResetNumNewPosts();

        const { data, filter: newFilter } = await loadFeeds({ filter });

        if (
          subFilterRef.current === newFilter &&
          categoryRef.current === 'uploads'
        ) {
          onLoadFeeds(data);
          onSetDisplayOrder('desc');
          success = true;
        }
      } catch (error: any) {
        console.error(error);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attemptLoad(attempts + 1);
        }
      } finally {
        if (success || attempts >= maxRetries) {
          setLoadingFilteredFeeds(false);
        }
      }
    }
  }

  async function handleLoadMoreFeeds() {
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
      onLoadMoreFeeds(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }

  async function handleChangeCategory(newCategory: string) {
    const maxRetries = 3;
    const retryDelay = 1000;
    let success = false;

    await attemptLoadFeeds();

    async function attemptLoadFeeds(attempts = 0) {
      try {
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

        if (
          loadedFilter === categoryObj[categoryRef.current].filter &&
          categoryRef.current === newCategory
        ) {
          onLoadFeeds(data);
          onSetDisplayOrder('desc');
          success = true;
        }
      } catch (error: any) {
        console.error(error);
        if (attempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attemptLoadFeeds(attempts + 1);
        }
      } finally {
        if (success || attempts >= maxRetries) {
          setLoadingCategorizedFeeds(false);
        }
      }
    }
  }

  async function handleFetchNewFeeds() {
    try {
      if (!loadingNewFeeds) {
        setLoadingNewFeeds(true);
        const data = await loadNewFeeds({
          lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0
        });

        if (data) {
          onResetNumNewPosts();
          onChangeSubFilter('all');
          if (
            category !== 'uploads' ||
            displayOrder === 'asc' ||
            (category === 'uploads' && subFilter === 'subject')
          ) {
            categoryRef.current = 'uploads';
            onChangeCategory('uploads');

            const { data } = await loadFeeds();
            if (categoryRef.current === 'uploads') {
              onLoadFeeds(data);
            }
            return;
          }
          onLoadNewFeeds(data);
        }
      }
    } catch (error) {
      console.error('Error fetching new feeds:', error);
    } finally {
      setLoadingNewFeeds(false);
    }
  }

  async function handleDisplayOrder() {
    const newDisplayOrder = displayOrder === 'desc' ? 'asc' : 'desc';
    const initialFilter =
      category === 'uploads' ? subFilter : categoryObj[category].filter;
    setLoadingFeeds(true);
    const { data, filter } = await loadFeeds({
      order: newDisplayOrder,
      orderBy: categoryObj[category].orderBy,
      filter: initialFilter
    });
    if (filter === initialFilter) {
      onLoadFeeds(data);
      onSetDisplayOrder(newDisplayOrder);
      setLoadingFeeds(false);
    }
  }
}
