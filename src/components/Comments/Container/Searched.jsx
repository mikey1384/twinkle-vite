import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';

Searched.propTypes = {
  poster: PropTypes.string
};

export default function Searched({ poster }) {
  const loadCommentsByPoster = useAppContext(
    (v) => v.requestHelpers.loadCommentsByPoster
  );
  useEffect(() => {
    init();
    async function init() {
      await loadCommentsByPoster({ posterId: poster.id });
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
