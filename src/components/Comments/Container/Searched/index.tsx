import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import SearchedComment from './SearchedComment';
import { useAppContext } from '~/contexts';
import { Content, Subject, User } from '~/types';
import ErrorBoundary from '~/components/ErrorBoundary';

Searched.propTypes = {
  parent: PropTypes.shape({
    contentId: PropTypes.number.isRequired,
    contentType: PropTypes.string.isRequired,
    subjectId: PropTypes.number
  }).isRequired,
  rootContent: PropTypes.shape({
    contentId: PropTypes.number,
    contentType: PropTypes.string,
    subjectId: PropTypes.number
  }).isRequired,
  loadMoreButtonColor: PropTypes.string,
  poster: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string
  }).isRequired,
  subject: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string
  }),
  theme: PropTypes.string
};
export default function Searched({
  parent,
  rootContent,
  loadMoreButtonColor,
  poster,
  subject,
  theme
}: {
  parent: Content;
  rootContent: Content;
  loadMoreButtonColor: string;
  poster: User;
  subject?: Subject;
  theme: string;
}) {
  const loadCommentsByPoster = useAppContext(
    (v) => v.requestHelpers.loadCommentsByPoster
  );
  const [comments, setComments] = useState<any[]>([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
    <ErrorBoundary componentPath="Comments/Searched">
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
            loading={loadingMore}
            onClick={handleLoadMore}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1rem'
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    try {
      setLoadingMore(true);
      const { comments: newComments, loadMoreButton } =
        await loadCommentsByPoster({
          contentId: parent.contentId,
          contentType: parent.contentType,
          posterId: poster.id,
          lastCommentId: comments[comments.length - 1].id
        });
      setComments([...comments, ...newComments]);
      setLoadMoreShown(loadMoreButton);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}
