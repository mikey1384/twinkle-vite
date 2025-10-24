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
import { useAppContext, useProfileContext } from '~/contexts';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const appElement = document.getElementById('App');
const BodyRef = document.scrollingElement || document.documentElement;

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
  const loadingMoreRef = useRef(false);
  const selectedSection = useRef('all');
  const byUserSelected = useRef(false);
  const loadFeeds = useAppContext((v) => v.requestHelpers.loadFeeds);
  const loadFeedsByUser = useAppContext(
    (v) => v.requestHelpers.loadFeedsByUser
  );
  const onLoadPosts = useProfileContext((v) => v.actions.onLoadPosts);
  const onLoadPostsByUser = useProfileContext(
    (v) => v.actions.onLoadPostsByUser
  );
  const onLoadMorePosts = useProfileContext((v) => v.actions.onLoadMorePosts);
  const onLoadMorePostsByUser = useProfileContext(
    (v) => v.actions.onLoadMorePostsByUser
  );

  useInfiniteScroll({
    feedsLength: feeds.length,
    scrollable: feeds.length > 0,
    onScrollToBottom: handleLoadMoreFeeds
  });

  useEffect(() => {
    if (!loaded) {
      if (filter === 'byuser') {
        handleLoadByUserTab(section);
      } else {
        handleLoadTab(section);
      }
    }

    async function handleLoadByUserTab(section: string) {
      selectedSection.current = filterTable[section];
      byUserSelected.current = true;
      setLoadingFeeds(true);
      const { data, section: loadedSection } = await loadFeedsByUser({
        username,
        section: filterTable[section]
      });
      if (
        loadedSection === selectedSection.current &&
        byUserSelected.current === true
      ) {
        onLoadPostsByUser({ ...data, section, username });
      }
      setLoadingFeeds(false);
    }

    async function handleLoadTab(section: string) {
      selectedSection.current = filterTable[section];
      byUserSelected.current = false;
      setLoadingFeeds(true);
      const { data, filter: loadedSection } = await loadFeeds({
        username,
        orderBy: 'timeStamp',
        filter: filterTable[section]
      });
      if (loadedSection === selectedSection.current) {
        onLoadPosts({ ...data, section, username });
      }
      setLoadingFeeds(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, section, username, loaded, filter, filterTable]);

  const filterBarShown = useMemo(
    () => ['all', 'subjects', 'links', 'videos'].includes(section),
    [section]
  );

  const loadingShown = useMemo(
    () => !loaded || loadingFeeds,
    [loaded, loadingFeeds]
  );

  useEffect(() => {
    if (filter && filter !== 'byuser') {
      navigate(`/users/${username}/${section}`);
    } else if (filter === 'byuser' && !filterBarShown) {
      navigate(`/users/${username}/${section}`);
    }
  }, [filterBarShown, filter, section, username, navigate]);

  const noFeedLabel = useMemo(() => {
    switch (section) {
      case 'all':
        return `${username} has not posted anything, yet`;
      case 'ai-stories':
        return `${username} has not cleared any AI Story, yet`;
      case 'subjects':
        return `${username} has not posted a subject, yet`;
      case 'comments':
        return `${username} has not posted a comment, yet`;
      case 'links':
        return `${username} has not posted a link, yet`;
      case 'videos':
        return `${username} has not posted a video, yet`;
      case 'watched':
        return `${username} has not watched any XP video so far`;
    }
  }, [section, username]);
  const noFeedByUserLabel = useMemo(() => {
    switch (section) {
      case 'all':
        return `${username} hasn't posted anything to show here`;
      case 'subjects':
        return `${username} hasn't posted any subject to show here`;
      case 'links':
        return `${username} hasn't posted any link to show here`;
      case 'videos':
        return `${username} hasn't posted any video to show here`;
    }
  }, [section, username]);
  const emptyMessage = useMemo(() => {
    return filter === 'byuser' ? noFeedByUserLabel : noFeedLabel;
  }, [filter, noFeedByUserLabel, noFeedLabel]);

  // Match Home feed separators between panels
  const feedListClass = useMemo(
    () =>
      css`
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        width: 100%;

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
        padding: 1.2rem 1.2rem;
        transition: background 0.15s ease;
        @media (max-width: ${mobileMaxWidth}) {
          &:first-of-type {
            padding-top: 0;
          }
        }
      `,
    []
  );

  return (
    <ErrorBoundary componentPath="Profile/Body/Posts/Feeds">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {section !== 'watched' && (
          <FilterBar
            color={selectedTheme}
            style={{
              fontSize: '1.3rem'
            }}
            className="mobile"
          >
            {[
              { key: 'all', label: 'All' },
              { key: 'comment', label: 'Comments' },
              { key: 'subject', label: 'Subjects' },
              { key: 'aiStory', label: 'AI Stories' },
              { key: 'video', label: 'Videos' },
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
        )}
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
              width: ${section === 'watched' ? '55%' : '50%'};
              margin-left: ${section === 'watched' ? '0' : '21rem'};
              margin-right: ${section === 'watched' ? '0' : '2rem'};
              margin-top: ${section !== 'watched' ? '-2rem' : '0'};
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
            {filterBarShown && (
              <FilterBar
                color={selectedTheme}
                style={{
                  height: '5rem',
                  marginTop: '1rem',
                  marginBottom: '1.2rem'
                }}
              >
                <nav
                  className={filter === 'byuser' ? '' : 'active'}
                  onClick={() => navigate(`/users/${username}/${section}`)}
                >
                  All
                </nav>
                <nav
                  className={filter === 'byuser' ? 'active' : ''}
                  onClick={() =>
                    navigate(`/users/${username}/${section}/byuser`)
                  }
                >
                  Made by {username}
                </nav>
              </FilterBar>
            )}
            {loadingShown ? (
              <Loading
                theme={selectedTheme}
                className={css`
                  margin-top: ${section === 'watched' ? '10rem' : '8rem'};
                  width: 100%;
                `}
                text="Loading..."
              />
            ) : (
              <>
                {feeds.length > 0 && (
                  <div className={feedListClass}>
                    {feeds.map((feed, index) => {
                      const { contentId, contentType, rootType } = feed;
                      return (
                        <div
                          key={filterTable[section] + feed.feedId}
                          className={`feed-item ${feedItemCustomClass}`}
                        >
                          <ContentPanel
                            style={{ margin: 0, zIndex: feeds.length - index }}
                            zIndex={feeds.length - index}
                            feedId={feed.feedId}
                            contentId={contentId}
                            contentType={contentType}
                            rootType={rootType}
                            theme={selectedTheme}
                            commentsLoadLimit={5}
                            numPreviewComments={1}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {feeds.length === 0 && (
                  <EmptyStateMessage
                    theme={selectedTheme}
                    style={{ marginTop: '8rem' }}
                  >
                    {emptyMessage}
                  </EmptyStateMessage>
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
          {section !== 'watched' && (
            <SideMenu
              className={`desktop`}
              style={{ alignSelf: 'flex-start' }}
              menuItems={[
                { key: 'all', label: 'All' },
                { key: 'comment', label: 'Comments' },
                { key: 'subject', label: 'Subjects' },
                { key: 'aiStory', label: 'AI Stories' },
                { key: 'video', label: 'Videos' },
                { key: 'url', label: 'Links' }
              ]}
              onMenuClick={handleClickPostsMenu}
              selectedKey={filterTable[section]}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleClickPostsMenu({ item }: { item: string }) {
    const appliedNav = `${
      item === 'url' ? 'link' : item === 'aiStory' ? 'ai-storie' : item
    }${item === 'all' ? '' : 's'}`;
    navigate(`/users/${username}/${appliedNav}`);
    if (section === appliedNav) {
      if (appElement) appElement.scrollTop = 0;
      BodyRef.scrollTop = 0;
    }
  }

  async function handleLoadMoreFeeds() {
    if (filter === 'byuser') {
      return loadMoreFeedsByUser();
    }
    await loadMoreFeeds();

    async function loadMoreFeeds() {
      if (loadingMoreRef.current) return;
      const lastFeedId =
        feeds.length > 0 ? feeds[feeds.length - 1].feedId : null;
      setLoadingMore(true);
      loadingMoreRef.current = true;
      try {
        const { data } = await loadFeeds({
          username,
          filter: filterTable[section],
          lastFeedId,
          orderBy: 'timeStamp',
          lastTimeStamp:
            feeds.length > 0
              ? feeds[feeds.length - 1][
                  section === 'watched' ? 'viewTimeStamp' : 'timeStamp'
                ]
              : null
        });
        onLoadMorePosts({ ...data, section, username });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
    async function loadMoreFeedsByUser() {
      if (loadingMoreRef.current) return;
      setLoadingMore(true);
      loadingMoreRef.current = true;
      try {
        const { data } = await loadFeedsByUser({
          username,
          section: filterTable[section],
          lastFeedId: feeds.length > 0 ? feeds[feeds.length - 1].feedId : null,
          lastTimeStamp:
            feeds.length > 0 ? feeds[feeds.length - 1].timeStamp : null
        });
        onLoadMorePostsByUser({ ...data, section, username });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }
}
