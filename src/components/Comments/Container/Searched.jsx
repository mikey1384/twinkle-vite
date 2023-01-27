import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';

Searched.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  poster: PropTypes.string
};

export default function Searched({ contentId, contentType, poster }) {
  const loadCommentsByPoster = useAppContext(
    (v) => v.requestHelpers.loadCommentsByPoster
  );
  useEffect(() => {
    init();
    async function init() {
      await loadCommentsByPoster({
        contentId,
        contentType,
        posterId: poster.id
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%'
      }}
    >
      {poster.username} Searched results go here
    </div>
  );
}
