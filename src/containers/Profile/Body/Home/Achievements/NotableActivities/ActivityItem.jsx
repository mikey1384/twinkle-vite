import PropTypes from 'prop-types';
import ContentPanel from '~/components/ContentPanel';

ActivityItem.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired
};

export default function ActivityItem({ contentId, contentType }) {
  return (
    <ContentPanel
      style={{ marginBottom: '1rem' }}
      contentId={contentId}
      contentType={contentType}
    />
  );
}
