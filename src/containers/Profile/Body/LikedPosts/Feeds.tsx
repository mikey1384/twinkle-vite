import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentPanel from '~/components/ContentPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import SideMenu from '../SideMenu';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useInfiniteScroll } from '~/helpers/hooks';
import { useAppContext, useKeyContext, useProfileContext } from '~/contexts';
import { useUpdateMode } from '~/contexts/UpdateMode';
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
  const { onScrollStart } = useUpdateMode();
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(loadingMore);
  const selectedSection = useRef('all');
  const myUsername = useKeyContext((v) => v.myState.username);
  const loadLikedFeeds = useAppContext((v) => v.requestHelpers.loadLikedFeeds);
  const onLoadLikedPosts = useProfileContext((v) => v.actions.onLoadLikedPosts);
  const onLoadMoreLikedPosts = useProfileContext(
    (v) => v.actions.onLoadMoreLikedPosts
  );

  useInfiniteScroll({
    feedsLength: feeds.length,
    scrollable: feeds.length > 0,
    onScrollToBottom: handleLoadMoreFeeds,
    onScrollStart
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
    () => !loaded || loadingFeeds,
    [loaded, loadingFeeds]
  );

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
            {loadingShown ? (
              <Loading
                theme={selectedTheme}
                style={{
                  marginTop: '5rem'
                }}
                text="Loading..."
              />
            ) : (
              <>
                {feeds.length > 0 &&
                  feeds.map((feed, index) => {
                    const { contentId, contentType } = feed;
                    return (
                      <ContentPanel
                        key={filterTable[section] + feed.feedId}
                        style={{
                          marginTop: '0',
                          marginBottom: '1rem',
                          zIndex: feeds.length - index
                        }}
                        feedId={feed.feedId}
                        zIndex={feeds.length - index}
                        contentId={contentId}
                        contentType={contentType}
                        theme={selectedTheme}
                        commentsLoadLimit={5}
                        numPreviewComments={1}
                      />
                    );
                  })}
                {feeds.length === 0 && (
                  <div style={{ marginTop: '8rem', padding: '0 1rem' }}>
                    <EmptyStateMessage theme={selectedTheme}>
                      {noFeedLabel}
                    </EmptyStateMessage>
                  </div>
                )}
              </>
            )}
            {loadMoreButton && !loadingShown && (
              <LoadMoreButton
                style={{ marginBottom: '1rem' }}
                onClick={handleLoadMoreFeeds}
                loading={loadingMore}
                theme={selectedTheme}
                filled
              />
            )}
            <div
              className={css`
                display: ${loadMoreButton ? 'none' : 'block'};
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
      }${item === 'all' ? '' : 's'}`
    );
  }

  async function handleLoadMoreFeeds() {
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
