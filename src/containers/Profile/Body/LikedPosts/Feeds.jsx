import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentPanel from '~/components/ContentPanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import SideMenu from './SideMenu';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useInfiniteScroll, useTheme } from '~/helpers/hooks';
import { useAppContext, useProfileContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
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
}) {
  const { filter } = useParams();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(selectedTheme || 'logoBlue');
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const selectedSection = useRef('all');
  const loadLikedFeeds = useAppContext((v) => v.requestHelpers.loadLikedFeeds);
  const onLoadLikedPosts = useProfileContext((v) => v.actions.onLoadLikedPosts);
  const onLoadMoreLikedPosts = useProfileContext(
    (v) => v.actions.onLoadMoreLikedPosts
  );

  useInfiniteScroll({
    feedsLength: feeds.length,
    scrollable: feeds.length > 0,
    loadable: loadMoreButton,
    loading: loadingMore,
    onScrollToBottom: () => setLoadingMore(true),
    onLoad: handleLoadMoreFeeds
  });

  useEffect(() => {
    if (!loaded) {
      handleLoadTab(section);
    }

    async function handleLoadTab(section) {
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

  const noFeedLabel = useMemo(() => {
    switch (section) {
      case 'all':
        return `${username} has not any content so far`;
      case 'subjects':
        return `${username} has not liked any subject so far`;
      case 'comments':
        return `${username} has not liked any comment so far`;
      case 'links':
        return `${username} has not liked any link so far`;
      case 'videos':
        return `${username} has not liked any video so far`;
    }
  }, [section, username]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Posts/Feeds">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        {!['likes', 'watched'].includes(section) && (
          <FilterBar
            color={selectedTheme}
            style={{ height: '5rem', marginTop: '-1rem' }}
            className={`mobile ${css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}`}
          >
            {[
              { key: 'all', label: 'All' },
              { key: 'subject', label: 'Subjects' },
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
              width: ${['likes', 'watched'].includes(section) ? '55%' : '50%'};
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            {loadingShown ? (
              <Loading
                theme={selectedTheme}
                className={css`
                  margin-top: ${['likes', 'watched'].includes(section)
                    ? '12rem'
                    : '8rem'};
                  width: 100%;
                `}
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
                          marginTop: index === 0 && '-1rem',
                          marginBottom: '1rem',
                          zIndex: feeds.length - index
                        }}
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
                  <div
                    style={{
                      marginTop: '10rem',
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>{noFeedLabel}</div>
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
          {!['likes', 'watched'].includes(section) && (
            <SideMenu
              className={`desktop ${css`
                width: 10%;
              `}`}
              menuItems={[
                { key: 'all', label: 'All' },
                { key: 'comment', label: 'Comments' },
                { key: 'subject', label: 'Subjects' },
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

  function handleClickPostsMenu({ item }) {
    navigate(
      `/users/${username}/likes/${item === 'url' ? 'link' : item}${
        item === 'all' ? '' : 's'
      }`
    );
  }

  async function handleLoadMoreFeeds() {
    loadMoreFeeds();
    async function loadMoreFeeds() {
      try {
        const { data } = await loadLikedFeeds({
          username,
          filter: filterTable[section],
          lastFeedId: feeds.length > 0 ? feeds[feeds.length - 1].feedId : null,
          lastTimeStamp:
            feeds.length > 0
              ? feeds[feeds.length - 1][
                  section === 'watched' ? 'viewTimeStamp' : 'lastInteraction'
                ]
              : null
        });
        onLoadMoreLikedPosts({ ...data, section, username });
        setLoadingMore(false);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
