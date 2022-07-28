import { useMemo } from 'react';
import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import SideMenu from '../SideMenu';
import InvalidPage from '~/components/InvalidPage';
import Feeds from './Feeds';
import { Route, Routes, useParams, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useProfileState } from '~/helpers/hooks';

Posts.propTypes = {
  selectedTheme: PropTypes.string
};

const filterTable = {
  all: 'all',
  comments: 'comment',
  likes: 'like',
  watched: 'watched',
  subjects: 'subject',
  videos: 'video',
  links: 'url'
};

export default function Posts({ selectedTheme }) {
  const navigate = useNavigate();
  const { section, username } = useParams();
  const {
    posts: {
      [section]: profileFeeds,
      [section + 'ByUser']: byUserFeeds = [],
      [`${section}LoadMoreButton`]: loadMoreButton,
      [`${section}ByUserLoadMoreButton`]: byUserLoadMoreButton,
      [`${section}Loaded`]: loaded,
      [`${section}ByUserLoaded`]: byUserloaded
    }
  } = useProfileState(username);

  const sideMenuItems = useMemo(() => {
    if (section === 'likes') {
      return [
        { key: 'all', label: 'All' },
        { key: 'video', label: 'Videos' },
        { key: 'url', label: 'Links' },
        { key: 'subject', label: 'Subjects' },
        { key: 'comment', label: 'Comments' }
      ];
    }
    return [
      { key: 'all', label: 'All' },
      { key: 'comment', label: 'Comments' },
      { key: 'subject', label: 'Subjects' },
      { key: 'video', label: 'Videos' },
      { key: 'url', label: 'Links' }
    ];
  }, [section]);

  if (!profileFeeds) return <InvalidPage style={{ paddingTop: '13rem' }} />;

  return (
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
                onClick={() => onClickPostsMenu({ item: type.key })}
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
        <Routes>
          <Route
            path={`/:filter`}
            element={
              <Feeds
                feeds={byUserFeeds}
                filterTable={filterTable}
                loaded={byUserloaded}
                loadMoreButton={byUserLoadMoreButton}
                section={section}
                selectedTheme={selectedTheme}
                username={username}
              />
            }
          />
          <Route
            path="*"
            element={
              <Feeds
                feeds={profileFeeds}
                filterTable={filterTable}
                loaded={loaded}
                loadMoreButton={loadMoreButton}
                section={section}
                selectedTheme={selectedTheme}
                username={username}
              />
            }
          />
        </Routes>
        {section !== 'watched' && (
          <SideMenu
            className={`desktop ${css`
              width: 10%;
            `}`}
            menuItems={sideMenuItems}
            onMenuClick={onClickPostsMenu}
            selectedKey={filterTable[section]}
          />
        )}
      </div>
    </div>
  );

  function onClickPostsMenu({ item }) {
    if (section === 'likes') {
      return navigate(
        `/users/${username}/likes/${item === 'url' ? 'link' : item}${
          item === 'all' ? '' : 's'
        }`
      );
    }
    navigate(
      `/users/${username}/${item === 'url' ? 'link' : item}${
        item === 'all' ? '' : 's'
      }`
    );
  }
}
