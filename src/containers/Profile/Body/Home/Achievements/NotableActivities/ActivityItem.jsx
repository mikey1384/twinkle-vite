import PropTypes from 'prop-types';
import ContentPanel from '~/components/ContentPanel';

ActivityItem.propTypes = {
  post: PropTypes.object.isRequired
};

export default function ActivityItem({ post }) {
  return (
    <ContentPanel
      style={{ marginBottom: '1rem' }}
      contentId={post.contentId}
      contentType={post.contentType}
    />
  );
}
