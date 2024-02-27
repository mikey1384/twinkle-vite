import React, { useEffect, useState } from 'react';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import SearchedComment from './SearchedComment';
import { useAppContext } from '~/contexts';
import { Content, Subject, User } from '~/types';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Searched({
  isSubjectPannelComments,
  parent,
  pinnedCommentId,
  rootContent,
  loadMoreButtonColor,
  poster,
  subject,
  theme
}: {
  isSubjectPannelComments?: boolean;
  parent: Content;
  pinnedCommentId?: number;
  rootContent?: Content;
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
              pinnedCommentId={pinnedCommentId}
              subject={subject}
              theme={theme}
              isSubjectPannelComment={isSubjectPannelComments}
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
