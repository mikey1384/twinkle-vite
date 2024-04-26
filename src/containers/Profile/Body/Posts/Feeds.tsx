import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentPanel from '~/components/ContentPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import SideMenu from '../SideMenu';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useInfiniteScroll } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
import { useAppContext, useProfileContext } from '~/contexts';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Feeds.propTypes = {
  feeds: PropTypes.array.isRequired,
  filterTable: PropTypes.object.isRequired,
  loaded: PropTypes.bool,
  loadMoreButton: PropTypes.bool,
  section: PropTypes.string.isRequired,
  selectedTheme: PropTypes.string,
  username: PropTypes.string.isRequired
};

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
  const lastFeedIdRef = useRef(null);
  const { filter } = useParams();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useMemo(() => returnTheme(selectedTheme || 'logoBlue'), [selectedTheme]);
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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

  return (
    <ErrorBoundary componentPath="Profile/Body/Posts/Feeds">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {section !== 'watched' && (
          <FilterBar
            color={selectedTheme}
            style={{ height: '5rem', marginTop: '-1rem', fontSize: '1.3rem' }}
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
              width: 100vw;
            }
          `}
        >
          <div
            className={css`
              margin-top: 1rem;
              width: ${section === 'watched' ? '55%' : '50%'};
              @media (max-width: ${tabletMaxWidth}) {
                width: 70%;
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            {filterBarShown && (
              <FilterBar
                bordered
                color={selectedTheme}
                style={{
                  height: '5rem',
                  marginTop: '-1rem',
                  marginBottom: '2rem'
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
                {feeds.length > 0 &&
                  feeds.map((feed, index) => {
                    const { contentId, contentType, rootType } = feed;
                    return (
                      <ContentPanel
                        key={filterTable[section] + feed.feedId}
                        style={{
                          marginTop: index === 0 ? '-1rem' : '',
                          marginBottom: '1rem',
                          zIndex: feeds.length - index
                        }}
                        zIndex={feeds.length - index}
                        feedId={feed.feedId}
                        contentId={contentId}
                        contentType={contentType}
                        rootType={rootType}
                        theme={selectedTheme}
                        commentsLoadLimit={5}
                        numPreviewComments={1}
                      />
                    );
                  })}
                {feeds.length === 0 && (
                  <div
                    style={{
                      marginTop: '10rem',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      {filter === 'byuser' ? noFeedByUserLabel : noFeedLabel}
                    </div>
                  </div>
                )}
              </>
            )}
            {loadMoreButton && !loadingShown && (
              <LoadMoreButton
                style={{ marginBottom: '1rem' }}
                onClick={handleLoadMoreFeeds}
                loading={loadingMore}
                color={loadMoreButtonColor}
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
              className={`desktop ${css`
                width: 10%;
              `}`}
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
    navigate(
      `/users/${username}/${
        item === 'url' ? 'link' : item === 'aiStory' ? 'ai-storie' : item
      }${item === 'all' ? '' : 's'}`
    );
  }

  async function handleLoadMoreFeeds() {
    if (filter === 'byuser') {
      return loadMoreFeedsByUser();
    }
    await loadMoreFeeds();
    async function loadMoreFeeds() {
      const lastFeedId =
        feeds.length > 0 ? feeds[feeds.length - 1].feedId : null;
      if (lastFeedIdRef.current === lastFeedId) return;
      lastFeedIdRef.current = lastFeedId;
      setLoadingMore(true);
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
        lastFeedIdRef.current = null;
      }
    }
    async function loadMoreFeedsByUser() {
      try {
        const { data } = await loadFeedsByUser({
          username,
          section: filterTable[section],
          lastFeedId: feeds.length > 0 ? feeds[feeds.length - 1].feedId : null,
          lastTimeStamp:
            feeds.length > 0 ? feeds[feeds.length - 1].timeStamp : null
        });
        onLoadMorePostsByUser({ ...data, section, username });
        setLoadingMore(false);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
