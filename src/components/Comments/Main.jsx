import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Comment from './Comment';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import PinnedComment from './PinnedComment';
import { useAppContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';

Main.propTypes = {
  autoExpand: PropTypes.bool,
  CommentRefs: PropTypes.array,
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsShown: PropTypes.bool,
  commentsLoadLimit: PropTypes.number,
  inputAtBottom: PropTypes.bool,
  isLoading: PropTypes.bool,
  isPreview: PropTypes.bool,
  isSubjectPannelComments: PropTypes.bool,
  loadMoreShown: PropTypes.bool,
  loadMoreButtonColor: PropTypes.string,
  onLoadMoreComments: PropTypes.func,
  parent: PropTypes.object,
  previewComments: PropTypes.arrayOf(PropTypes.object),
  subject: PropTypes.object,
  theme: PropTypes.string,
  userId: PropTypes.number,
  rootContent: PropTypes.object
};

export default function Main({
  autoExpand,
  CommentRefs,
  comments,
  commentsShown,
  commentsLoadLimit,
  inputAtBottom,
  isLoading,
  isPreview,
  isSubjectPannelComments,
  loadMoreShown,
  loadMoreButtonColor,
  onLoadMoreComments,
  parent,
  previewComments,
  subject,
  theme,
  userId,
  rootContent
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const rootContentState = useContentState({
    contentType: rootContent?.contentType,
    contentId: rootContent?.id
  });
  const isRepliesOfReply = useMemo(
    () => parent.contentType === 'comment' && parent.commentId !== parent.id,
    [parent]
  );
  const pinnedCommentId = useMemo(() => {
    if (isSubjectPannelComments) {
      return subject?.pinnedCommentId;
    }
    if (parent.contentType === 'comment') {
      return rootContentState?.pinnedCommentId;
    }
    return parent.pinnedCommentId;
  }, [
    isSubjectPannelComments,
    parent.contentType,
    parent.pinnedCommentId,
    rootContentState?.pinnedCommentId,
    subject?.pinnedCommentId
  ]);

  const renderLoadMoreButton = useCallback(() => {
    return (autoExpand || commentsShown) && !isLoading ? (
      <LoadMoreButton
        filled
        color={loadMoreButtonColor}
        loading={isLoadingMore}
        onClick={handleLoadMoreComments}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginTop: inputAtBottom ? 0 : '1rem'
        }}
      />
    ) : null;

    async function handleLoadMoreComments() {
      if (!isLoadingMore) {
        setIsLoadingMore(true);
        const lastCommentLocation =
          inputAtBottom && !isRepliesOfReply ? 0 : comments.length - 1;
        const lastCommentId = comments[lastCommentLocation]
          ? comments[lastCommentLocation].id
          : 'undefined';
        try {
          const data = await loadComments({
            contentId: parent.contentId,
            contentType: parent.contentType,
            lastCommentId,
            limit: commentsLoadLimit,
            isRepliesOfReply
          });
          onLoadMoreComments({
            ...data,
            isRepliesOfReply,
            contentId: parent.contentId,
            contentType: parent.contentType
          });
          setIsLoadingMore(false);
        } catch (error) {
          console.error(error.response || error);
        }
      }
    }
  }, [
    autoExpand,
    comments,
    commentsLoadLimit,
    commentsShown,
    inputAtBottom,
    isLoading,
    isLoadingMore,
    isRepliesOfReply,
    loadComments,
    loadMoreButtonColor,
    onLoadMoreComments,
    parent.contentId,
    parent.contentType
  ]);

  return (
    <div style={{ width: '100%' }}>
      {isLoading && <Loading theme={theme} />}
      {!isLoading &&
        parent.contentType !== 'comment' &&
        pinnedCommentId &&
        !isPreview && (
          <PinnedComment
            parent={parent}
            rootContent={rootContent}
            subject={subject}
            commentId={pinnedCommentId}
            userId={userId}
            theme={theme}
          />
        )}
      {inputAtBottom &&
        !isRepliesOfReply &&
        loadMoreShown &&
        renderLoadMoreButton()}
      {!isLoading &&
        (isPreview ? previewComments : comments).map((comment) => (
          <Comment
            isSubjectPannelComment={isSubjectPannelComments}
            isPreview={isPreview}
            innerRef={(ref) => (CommentRefs[comment.id] = ref)}
            parent={parent}
            rootContent={rootContent}
            subject={subject}
            theme={theme}
            comment={comment}
            pinnedCommentId={pinnedCommentId}
            key={comment.id}
            userId={userId}
          />
        ))}
      {(!inputAtBottom || isRepliesOfReply) &&
        loadMoreShown &&
        renderLoadMoreButton()}
    </div>
  );
}
