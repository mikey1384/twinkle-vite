import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import SearchedComment from './SearchedComment';
import { useAppContext } from '~/contexts';

Searched.propTypes = {
  parent: PropTypes.object,
  rootContent: PropTypes.object,
  loadMoreButtonColor: PropTypes.string,
  poster: PropTypes.object,
  subject: PropTypes.object,
  theme: PropTypes.string
};

export default function Searched({
  parent,
  rootContent,
  loadMoreButtonColor,
  poster,
  subject,
  theme
}) {
  const loadCommentsByPoster = useAppContext(
    (v) => v.requestHelpers.loadCommentsByPoster
  );
  const [comments, setComments] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { comments, loadMoreButton } = await loadCommentsByPoster({
          contentId: parent.contentId,
          contentType: parent.contentType,
          posterId: poster.id
        });
        setComments(comments);
        setLoadMoreShown(loadMoreButton);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%'
      }}
    >
      {loading ? (
        <Loading />
      ) : (
        comments.map((comment) => (
          <SearchedComment
            key={comment.id}
            parent={parent}
            rootContent={rootContent}
            comment={comment}
            subject={subject}
            theme={theme}
          />
        ))
      )}
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
