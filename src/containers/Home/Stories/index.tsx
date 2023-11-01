import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import Banner from '~/components/Banner';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeFilter from './HomeFilter';
import ContentPanel from '~/components/ContentPanel';
import TopMenu from '../TopMenu';
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
  const lastFeedRef = useRef(null);
  const loadFeeds = useAppContext((v) => v.requestHelpers.loadFeeds);
  const loadNewFeeds = useAppContext((v) => v.requestHelpers.loadNewFeeds);
  const { hideWatched, username } = useKeyContext((v) => v.myState);
  const {
    alert: { color: alertColor }
  } = useKeyContext((v) => v.theme);
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingNewFeeds, setLoadingNewFeeds] = useState(false);
  const categoryRef: React.MutableRefObject<any> = useRef(null);
  const ContainerRef = useRef(null);
  const hideWatchedRef = useRef(null);
  const subFilterRef = useRef(null);

  useEffect(() => {
    subFilterRef.current = subFilter;
  }, [subFilter]);

  useEffect(() => {
    lastFeedRef.current = null;
  }, [category, subFilter]);

  useInfiniteScroll({
    scrollable: feeds.length > 0,
    feedsLength: feeds.length,
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
      const { data } = await loadFeeds({
        order: 'desc',
        filter: categoryObj.videos.filter,
        orderBy: categoryObj.videos.orderBy
      });
      if (category === 'videos') {
        onLoadFeeds(data);
      }
    }
    hideWatchedRef.current = hideWatched;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideWatched]);

  useEffect(() => {
    if (!loaded) {
      handleLoadFeeds();
    }

    async function handleLoadFeeds() {
      setLoadingFeeds(true);
      categoryRef.current = 'uploads';
      onChangeCategory('recommended');
      onChangeSubFilter('all');
      onResetNumNewPosts();
      try {
        const { data } = await loadFeeds({
          isRecommended: true
        });
        onLoadFeeds(data);
        setLoadingFeeds(false);
      } catch (error) {
        console.error(error);
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

  return (
    <ErrorBoundary componentPath="Home/Stories/index">
      <div style={{ width: '100%' }} ref={ContainerRef}>
        <TopMenu
          onInputModalButtonClick={(modalType) =>
            onSetInputModalShown({ shown: true, modalType })
          }
          onPlayAIStories={() => onSetAIStoriesModalShown(true)}
          onPlayGrammarGame={() => onSetGrammarGameModalShown(true)}
        />
        <HomeFilter
          category={category}
          changeCategory={handleChangeCategory}
          displayOrder={displayOrder}
          selectedFilter={subFilter}
          applyFilter={handleApplyFilter}
          setDisplayOrder={handleDisplayOrder}
        />
        <div style={{ width: '100%' }}>
          {loadingFeeds && <Loading text="Loading Posts..." />}
          {loaded && feeds.length === 0 && !loadingFeeds && (
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
          )}
          {loaded && !loadingFeeds && feeds.length > 0 && (
            <>
              {feedsOutdated && (
                <Banner
                  color={alertColor}
                  onClick={() => window.location.reload()}
                  style={{
                    marginBottom: '1rem'
                  }}
                >
                  Tap to See New Posts!
                </Banner>
              )}
              {numNewPosts > 0 && !feedsOutdated && (
                <Banner
                  color={alertColor}
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
              )}
              {feeds.map((feed: { [key: string]: any } = {}, index: number) =>
                feed.contentId ? (
                  <ContentPanel
                    key={
                      category + subFilter + feed.contentId + feed.contentType
                    }
                    style={{
                      marginBottom: '1rem'
                    }}
                    zIndex={feeds.length - index}
                    contentId={feed.contentId}
                    contentType={feed.contentType}
                    rootType={feed.rootType}
                    commentsLoadLimit={5}
                    numPreviewComments={1}
                  />
                ) : null
              )}
              {loadMoreButton && (
                <LoadMoreButton
                  style={{ marginBottom: '1rem' }}
                  onClick={handleLoadMoreFeeds}
                  loading={loadingMore}
                  filled
                />
              )}
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
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  async function handleApplyFilter(filter: string) {
    if (filter === subFilterRef.current) return;
    setLoadingFeeds(true);
    categoryRef.current = 'uploads';
    onChangeCategory('uploads');
    onChangeSubFilter(filter);
    onResetNumNewPosts();
    const { data, filter: newFilter } = await loadFeeds({ filter });
    if (filter === newFilter && categoryRef.current === 'uploads') {
      onLoadFeeds(data);
      onSetDisplayOrder('desc');
      setLoadingFeeds(false);
    }
  }

  async function handleLoadMoreFeeds() {
    const lastFeedId = feeds.length > 0 ? feeds[feeds.length - 1].feedId : null;
    if (lastFeedRef.current === lastFeedId) return;
    lastFeedRef.current = lastFeedId;
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
          feeds.length > 0 ? feeds[feeds.length - 1].rewardLevel : null,
        lastTimeStamp:
          feeds.length > 0 ? feeds[feeds.length - 1].lastInteraction : null,
        lastViewDuration:
          feeds.length > 0 ? feeds[feeds.length - 1].totalViewDuration : null
      });
      onLoadMoreFeeds(data);
    } catch (error) {
      console.error(error);
      lastFeedRef.current = null;
    }
    setLoadingMore(false);
  }

  async function handleChangeCategory(newCategory: string) {
    categoryRef.current = newCategory;
    onResetNumNewPosts();
    setLoadingFeeds(true);
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
      setLoadingFeeds(false);
    }
  }

  async function handleFetchNewFeeds() {
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
    if (!loadingNewFeeds) {
      setLoadingNewFeeds(true);
      const data = await loadNewFeeds({
        lastInteraction: feeds[0] ? feeds[0].lastInteraction : 0
      });
      if (data) {
        onLoadNewFeeds(data);
      }
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
