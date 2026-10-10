import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import SideMenu from '../SideMenu';
import ProfileFeedSearch, {
  ProfileFeedSearchNote,
  getProfileFeedSearchMessage,
  useProfileFeedSearchResults,
  useProfileSearchQuery
} from '../ProfileFeedSearch';
import HomeFeedCard from '~/containers/Home/Stories/FeedCard';
import {
  getProfileFeedCardAnchorId,
  getProfileFeedContentKey
} from '../feedCardAnchors';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useInfiniteScroll } from '~/helpers/hooks';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Feeds({
  feeds,
  filterTable,
  loaded,
  loadMoreButton,
  section,
  selectedTheme,
  username
}: {
  feeds: any[];
  filterTable: any;
  loaded: boolean;
  loadMoreButton: boolean;
  section: string;
  selectedTheme: string;
  username: string;
}) {
  const { filter } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(loadingMore);
  const feedListRef = useRef<HTMLDivElement | null>(null);
  const selectedSection = useRef('all');
  const myUsername = useKeyContext((v) => v.myState.username);
  const myUserId = useKeyContext((v) => v.myState.userId);
  const loadLikedFeeds = useAppContext((v) => v.requestHelpers.loadLikedFeeds);
  const onLoadLikedPosts = useProfileContext((v) => v.actions.onLoadLikedPosts);
  const onLoadMoreLikedPosts = useProfileContext(
    (v) => v.actions.onLoadMoreLikedPosts
  );
  const { query, searchSuffix, setQuery } = useProfileSearchQuery();
  // Searching is for signed-in members.
  const searchShown = Boolean(myUserId);
  const searching = searchShown && Boolean(query);
  const search = useProfileFeedSearchResults({
    query: searchShown ? query : '',
    scopeKey: `${username}:likes:${section}`,
    loadPage: ({ searchText, searchBeforeId, signal }) =>
      loadLikedFeeds({
        username,
        filter: filterTable[section],
        searchText,
        searchBeforeId,
        signal
      })
  });
  const shownFeeds = searching ? search.feeds : feeds;
  const shownLoadMoreButton = searching
    ? search.loadMoreButton
    : loadMoreButton;

  useInfiniteScroll({
    feedsLength: shownFeeds.length,
    scrollable: shownFeeds.length > 0,
    onScrollToBottom: handleScrollToBottom
  });

  useEffect(() => {
    if (!loaded) {
      handleLoadTab(section);
    }

    async function handleLoadTab(section: string) {
      selectedSection.current = filterTable[section];
      setLoadingFeeds(true);
      const { data, filter: loadedSection } = await loadLikedFeeds({
        username,
        filter: filterTable[section]
      });
      if (loadedSection === selectedSection.current) {
        onLoadLikedPosts({ ...data, section, username });
      }
      setLoadingFeeds(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, section, username, loaded, filter, filterTable]);

  const loadingShown = useMemo(
    () => (searching ? search.loading : !loaded || loadingFeeds),
    [searching, search.loading, loaded, loadingFeeds]
  );

  useScrollAnchorRestoration({
    anchorKey: `profile:${username}:likes:${section}:${filter || 'all'}${
      searching ? `:search:${query}` : ''
    }`,
    containerRef: feedListRef,
    initialScroll: { type: 'top' },
    itemsReady: !loadingShown && shownFeeds.length > 0
  });

  const isOwnProfile = myUsername === username;
  const displayName = isOwnProfile ? 'You' : username;
  const haveOrHas = isOwnProfile ? 'have' : 'has';

  const noFeedLabel = useMemo(() => {
    switch (section) {
      case 'all':
        return `${displayName} ${haveOrHas} not liked any content so far`;
      case 'ai-stories':
        return `${displayName} ${haveOrHas} not liked any AI Story so far`;
      case 'subjects':
        return `${displayName} ${haveOrHas} not liked any subject so far`;
      case 'comments':
        return `${displayName} ${haveOrHas} not liked any comment so far`;
      case 'links':
        return `${displayName} ${haveOrHas} not liked any link so far`;
      case 'videos':
        return `${displayName} ${haveOrHas} not liked any video so far`;
      case 'reflections':
        return `${displayName} ${haveOrHas} not liked any daily reflection so far`;
    }
  }, [section, displayName, haveOrHas]);
  const searchNoun = useMemo(() => {
    switch (section) {
      case 'ai-stories':
        return 'AI Stories';
      case 'subjects':
        return 'subjects';
      case 'comments':
        return 'comments';
      case 'links':
        return 'links';
      case 'videos':
        return 'videos';
      case 'reflections':
        return 'reflections';
      default:
        return 'posts';
    }
  }, [section]);
  const searchPlaceholder = isOwnProfile
    ? `Search ${searchNoun} you liked...`
    : `Search ${searchNoun} ${username} liked...`;
  const emptyMessage = searching
    ? getProfileFeedSearchMessage({
        notice: search.notice,
        noMatchLabel: `No liked ${searchNoun} match "${query}"`
      })
    : noFeedLabel;
  const feedListClass = useMemo(
    () => css`
      display: flex;
      flex-direction: column;
      width: 100%;
      > .feed-item {
        margin: 0 0 1rem 0;
      }
    `,
    []
  );
  const feedItemCustomClass = useMemo(
    () => css`
      padding: 0;
    `,
    []
  );

  return (
    <ErrorBoundary componentPath="Profile/Body/LikedPosts/Feeds">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <FilterBar
          color={selectedTheme}
          style={{
            fontSize: '1.3rem'
          }}
          className="mobile"
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'dailyReflection', label: 'Reflections' },
            { key: 'video', label: 'Videos' },
            { key: 'subject', label: 'Subjects' },
            { key: 'aiStory', label: 'AI Stories' },
            { key: 'comment', label: 'Comments' },
            { key: 'url', label: 'Links' }
          ].map((type) => {
            return (
              <nav
                key={type.key}
                className={filterTable[section] === type.key ? 'active' : ''}
                onClick={() => handleClickPostsMenu({ item: type.key })}
              >
                {type.label}
              </nav>
            );
          })}
        </FilterBar>
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: center;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <div
            className={css`
              width: 50%;
              margin-left: 21rem;
              margin-right: 2rem;
              margin-top: 0;
              @media (max-width: ${tabletMaxWidth}) {
                width: 70%;
                margin-left: 0;
                margin-right: 0;
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
                margin-left: 0;
                margin-right: 0;
              }
            `}
          >
            {searchShown && (
              <ProfileFeedSearch
                placeholder={searchPlaceholder}
                query={query}
                onSearch={setQuery}
              />
            )}
            {loadingShown ? (
              <Loading
                theme={selectedTheme}
                style={{
                  marginTop: '5rem'
                }}
                text={searching ? 'Searching...' : 'Loading...'}
              />
            ) : (
              <>
                {shownFeeds.length > 0 && (
                  <div ref={feedListRef} className={feedListClass}>
                    {shownFeeds.map((feed, index) => {
                      const contentKey = getProfileFeedContentKey(feed);
                      const feedAnchorId = getProfileFeedCardAnchorId({
                        feed,
                        index,
                        prefix: 'profile-like'
                      });
                      return (
                        <div
                          key={`${filterTable[section]}:${feedAnchorId}`}
                          className={`feed-item ${feedItemCustomClass}`}
                          data-feed-anchor-id={feedAnchorId}
                          data-feed-id={feed.feedId || undefined}
                          data-content-key={contentKey}
                          data-feed-index={index}
                          data-scroll-anchor-id={feedAnchorId}
                          data-scroll-anchor-secondary-id={
                            feed.feedId ? String(feed.feedId) : undefined
                          }
                          data-scroll-anchor-content-key={contentKey}
                        >
                          <HomeFeedCard
                            feed={feed}
                            feedAnchorId={feedAnchorId}
                            index={index}
                            totalCount={shownFeeds.length}
                            theme={selectedTheme}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {shownFeeds.length === 0 && (
                  <div style={{ marginTop: '8rem', padding: '0 1rem' }}>
                    <EmptyStateMessage theme={selectedTheme}>
                      {emptyMessage}
                    </EmptyStateMessage>
                  </div>
                )}
              </>
            )}
            {searching && !loadingShown && shownFeeds.length > 0 && (
              <ProfileFeedSearchNote notice={search.notice} />
            )}
            {shownLoadMoreButton && !loadingShown && (
              <LoadMoreButton
                style={{ marginBottom: '1rem' }}
                onClick={handleLoadMoreFeeds}
                label={
                  searching && search.notice === 'stoppedEarly'
                    ? 'Search older posts'
                    : undefined
                }
                loading={searching ? search.loadingMore : loadingMore}
                theme={selectedTheme}
                filled
              />
            )}
            <div
              className={css`
                display: ${shownLoadMoreButton ? 'none' : 'block'};
                height: 7rem;
                @media (max-width: ${mobileMaxWidth}) {
                  display: block;
                }
              `}
            />
          </div>
          <SideMenu
            className="desktop"
            style={{ alignSelf: 'flex-start' }}
            menuItems={[
              { key: 'all', label: 'All' },
              { key: 'dailyReflection', label: 'Reflections' },
              { key: 'video', label: 'Videos' },
              { key: 'subject', label: 'Subjects' },
              { key: 'aiStory', label: 'AI Stories' },
              { key: 'comment', label: 'Comments' },
              { key: 'url', label: 'Links' }
            ]}
            onMenuClick={handleClickPostsMenu}
            selectedKey={filterTable[section]}
          />
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleClickPostsMenu({ item }: { item: string }) {
    navigate(
      `/users/${username}/likes/${
        item === 'url'
          ? 'link'
          : item === 'aiStory'
            ? 'ai-storie'
            : item === 'dailyReflection'
              ? 'reflection'
              : item
      }${item === 'all' ? '' : 's'}${searchSuffix}`
    );
  }

  function handleScrollToBottom() {
    // After a search page that stopped early, timed out or was rate limited,
    // continuing is the member's choice (the button), not a scroll.
    if (searching && search.notice) return;
    return handleLoadMoreFeeds();
  }

  async function handleLoadMoreFeeds() {
    if (searching) {
      return search.loadMore();
    }
    const lastFeedId = feeds.length > 0 ? feeds[feeds.length - 1].feedId : null;
    await loadMoreFeeds();

    async function loadMoreFeeds() {
      if (loadingMoreRef.current) return;
      setLoadingMore(true);
      loadingMoreRef.current = true;
      try {
        const { data } = await loadLikedFeeds({
          username,
          filter: filterTable[section],
          lastFeedId,
          lastTimeStamp:
            feeds.length > 0 ? feeds[feeds.length - 1]['lastInteraction'] : null
        });
        onLoadMoreLikedPosts({ ...data, section, username });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }
}
