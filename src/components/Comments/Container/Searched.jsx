import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

Searched.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  loadMoreButtonColor: PropTypes.string,
  poster: PropTypes.object
};

export default function Searched({
  contentId,
  contentType,
  loadMoreButtonColor,
  poster
}) {
  const loadCommentsByPoster = useAppContext(
    (v) => v.requestHelpers.loadCommentsByPoster
  );
  const [comments, setComments] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      const { comments, loadMoreButton } = await loadCommentsByPoster({
        contentId,
        contentType,
        posterId: poster.id
      });
      setComments(comments);
      setLoadMoreShown(loadMoreButton);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%'
      }}
    >
      {comments.map((comment) => (
        <div key={comment.id}>{comment.content}</div>
      ))}
      {loadMoreShown && (
        <LoadMoreButton
          filled
          color={loadMoreButtonColor}
          loading={false}
          onClick={() => console.log('clicked')}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '1rem'
          }}
        />
      )}
    </div>
  );
}
