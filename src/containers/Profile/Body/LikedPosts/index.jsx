import PropTypes from 'prop-types';
import InvalidPage from '~/components/InvalidPage';
import Feeds from './Feeds';
import { useParams } from 'react-router-dom';
import { useProfileState } from '~/helpers/hooks';

LikedPosts.propTypes = {
  selectedTheme: PropTypes.string
};

const filterTable = {
  all: 'all',
  comments: 'comment',
  subjects: 'subject',
  videos: 'video',
  links: 'url'
};

export default function LikedPosts({ selectedTheme }) {
  const { section, username } = useParams();
  const {
    likes: {
      [section]: profileFeeds,
      [`${section}LoadMoreButton`]: loadMoreButton,
      [`${section}Loaded`]: loaded
    }
  } = useProfileState(username);

  if (!profileFeeds) return <InvalidPage style={{ paddingTop: '13rem' }} />;

  return (
    <Feeds
      feeds={profileFeeds}
      filterTable={filterTable}
      loaded={loaded}
      loadMoreButton={loadMoreButton}
      section={section}
      selectedTheme={selectedTheme}
      username={username}
    />
  );
}
