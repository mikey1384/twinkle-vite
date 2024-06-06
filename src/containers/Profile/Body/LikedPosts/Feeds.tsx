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
  const { filter } = useParams();
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useMemo(() => returnTheme(selectedTheme || 'logoBlue'), [selectedTheme]);
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(loadingMore);
  const selectedSection = useRef('all');
  const loadLikedFeeds = useAppContext((v) => v.requestHelpers.loadLikedFeeds);
  const onLoadLikedPosts = useProfileContext((v) => v.actions.onLoadLikedPosts);
  const onLoadMoreLikedPosts = useProfileContext(
    (v) => v.actions.onLoadMoreLikedPosts
  );

  useInfiniteScroll({
    feedsLength: feeds.length,
    scrollable: feeds.length > 0,
    onScrollToBottom: handleLoadMoreFeeds
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

  const noFeedLabel = useMemo(() => {
    switch (section) {
      case 'all':
        return `${username} has not any content so far`;
      case 'ai-stories':
        return `${username} has not liked any AI Story so far`;
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
    <ErrorBoundary componentPath="Profile/Body/LikedPosts/Feeds">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <FilterBar
          color={selectedTheme}
          style={{ height: '5rem', marginTop: '-1rem', fontSize: '1.3rem' }}
          className="mobile"
        >
          {[
            { key: 'all', label: 'All' },
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
              width: 100vw;
            }
          `}
        >
          <div
            className={css`
              margin-top: 1rem;
              width: 50%;
              @media (max-width: ${tabletMaxWidth}) {
                width: 70%;
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
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
                          marginTop: index === 0 ? '-1rem' : '',
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
          <SideMenu
            menuItems={[
              { key: 'all', label: 'All' },
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
        item === 'url' ? 'link' : item === 'aiStory' ? 'ai-storie' : item
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
