import PropTypes from 'prop-types';
import InvalidPage from '~/components/InvalidPage';
import Feeds from './Feeds';
import { Route, Routes, useParams } from 'react-router-dom';
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

  if (!profileFeeds) return <InvalidPage style={{ paddingTop: '13rem' }} />;

  return (
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
  );
}
