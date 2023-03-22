import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Comment from './Comment';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import PinnedComment from './PinnedComment';
import CommentInputArea from './CommentInputArea';
import { useAppContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';

Main.propTypes = {
  autoFocus: PropTypes.bool,
  autoExpand: PropTypes.bool,
  banned: PropTypes.object,
  CommentRefs: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHidden: PropTypes.bool,
  disableReason: PropTypes.string,
  CommentInputAreaRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  commentsShown: PropTypes.bool,
  commentsLoadLimit: PropTypes.number,
  inputAtBottom: PropTypes.bool,
  inputAreaInnerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  inputTypeLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  isPreview: PropTypes.bool,
  isSubjectPannelComments: PropTypes.bool,
  loadMoreShown: PropTypes.bool,
  loadMoreButtonColor: PropTypes.string,
  noInput: PropTypes.bool,
  numInputRows: PropTypes.number,
  numPreviews: PropTypes.number,
  onLoadMoreComments: PropTypes.func,
  onCommentSubmit: PropTypes.func,
  onSetCommentSubmitted: PropTypes.func,
  parent: PropTypes.object,
  previewComments: PropTypes.arrayOf(PropTypes.object),
  showSecretButtonAvailable: PropTypes.bool,
  subject: PropTypes.object,
  subjectId: PropTypes.number,
  theme: PropTypes.string,
  uploadComment: PropTypes.func,
  userId: PropTypes.number,
  rootContent: PropTypes.object
};

export default function Main({
  autoExpand,
  autoFocus,
  banned,
  CommentInputAreaRef,
  CommentRefs,
  comments,
  commentsHidden,
  commentsShown,
  commentsLoadLimit,
  disableReason,
  inputAtBottom,
  inputAreaInnerRef,
  inputTypeLabel,
  isLoading,
  isPreview,
  isSubjectPannelComments,
  loadMoreShown,
  loadMoreButtonColor,
  noInput,
  numInputRows,
  numPreviews,
  onCommentSubmit,
  onLoadMoreComments,
  onSetCommentSubmitted,
  parent,
  previewComments,
  showSecretButtonAvailable,
  subject,
  subjectId,
  theme,
  uploadComment,
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

  const renderInputArea = useCallback(
    (style) => {
      return (
        <CommentInputArea
          autoFocus={autoFocus}
          disableReason={disableReason}
          InputFormRef={CommentInputAreaRef}
          innerRef={inputAreaInnerRef}
          inputTypeLabel={inputTypeLabel}
          numInputRows={numInputRows}
          onSubmit={handleSubmitComment}
          onViewSecretAnswer={
            showSecretButtonAvailable ? handleViewSecretAnswer : null
          }
          parent={parent}
          rootCommentId={
            parent.contentType === 'comment' ? parent.commentId : null
          }
          subjectId={subjectId}
          subjectRewardLevel={
            parent?.contentType === 'subject'
              ? parent?.rewardLevel
              : parent?.contentType !== 'comment'
              ? subject?.rewardLevel || 0
              : 0
          }
          style={style}
          theme={theme}
          targetCommentId={
            parent.contentType === 'comment' ? parent.contentId : null
          }
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      autoFocus,
      banned?.posting,
      inputAreaInnerRef,
      inputTypeLabel,
      numInputRows,
      onCommentSubmit,
      parent,
      showSecretButtonAvailable,
      subjectId,
      subject?.rewardLevel,
      theme
    ]
  );

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
    <div
      style={{
        width: '100%'
      }}
    >
      {!inputAtBottom &&
        !noInput &&
        (commentsShown || autoExpand) &&
        renderInputArea()}
      {(commentsShown || autoExpand || numPreviews > 0) && !commentsHidden ? (
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
                disableReason={disableReason}
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
      ) : null}
      {inputAtBottom &&
        !noInput &&
        (commentsShown || autoExpand) &&
        renderInputArea({ marginTop: comments.length > 0 ? '1rem' : 0 })}
    </div>
  );

  async function handleSubmitComment({
    content,
    rootCommentId,
    subjectId,
    targetCommentId
  }) {
    if (banned?.posting) {
      return;
    }
    try {
      onSetCommentSubmitted(true);
      const { comment } = await uploadComment({
        content,
        parent,
        rootCommentId,
        subjectId,
        targetCommentId
      });
      await onCommentSubmit({
        ...comment,
        contentId: parent.contentId,
        contentType: parent.contentType
      });
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async function handleViewSecretAnswer() {
    try {
      onSetCommentSubmitted(true);
      const { comment } = await uploadComment({
        content: 'viewed the secret message',
        parent,
        subjectId,
        isNotification: true
      });
      await onCommentSubmit({
        ...comment,
        contentId: parent.contentId,
        contentType: parent.contentType
      });
      return Promise.resolve();
    } catch (error) {
      console.error(error);
    }
  }
}
