import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import Context from './Context';
import CommentInputArea from './CommentInputArea';
import Comment from './Comment';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import PinnedComment from './PinnedComment';
import { v1 as uuidv1 } from 'uuid';
import { returnImageFileFromUrl, scrollElementToCenter } from '~/helpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useContentState, useTheme } from '~/helpers/hooks';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useKeyContext
} from '~/contexts';

Comments.propTypes = {
  autoExpand: PropTypes.bool,
  autoFocus: PropTypes.bool,
  commentsHidden: PropTypes.bool,
  numPreviews: PropTypes.number,
  className: PropTypes.string,
  commentsShown: PropTypes.bool,
  comments: PropTypes.array.isRequired,
  commentsLoadLimit: PropTypes.number,
  inputAreaInnerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  inputAtBottom: PropTypes.bool,
  inputTypeLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  loadMoreButton: PropTypes.bool.isRequired,
  numInputRows: PropTypes.number,
  noInput: PropTypes.bool,
  onCommentSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditDone: PropTypes.func.isRequired,
  onLikeClick: PropTypes.func.isRequired,
  onLoadMoreComments: PropTypes.func.isRequired,
  onLoadMoreReplies: PropTypes.func.isRequired,
  onPreviewClick: PropTypes.func,
  onLoadRepliesOfReply: PropTypes.func,
  onReplySubmit: PropTypes.func.isRequired,
  onRewardCommentEdit: PropTypes.func.isRequired,
  parent: PropTypes.shape({
    commentId: PropTypes.number,
    contentId: PropTypes.number.isRequired,
    contentType: PropTypes.string.isRequired,
    pinnedCommentId: PropTypes.number,
    rewardLevel: PropTypes.number,
    secretAnswer: PropTypes.string,
    secretAttachment: PropTypes.object
  }).isRequired,
  rootContent: PropTypes.object,
  showSecretButtonAvailable: PropTypes.bool,
  style: PropTypes.object,
  subject: PropTypes.object,
  theme: PropTypes.string,
  userId: PropTypes.number
};

function Comments({
  autoFocus,
  autoExpand,
  comments = [],
  commentsHidden,
  commentsLoadLimit,
  commentsShown,
  className,
  inputAreaInnerRef,
  inputAtBottom,
  inputTypeLabel,
  isLoading,
  loadMoreButton,
  noInput,
  numInputRows,
  numPreviews,
  onCommentSubmit,
  onDelete,
  onEditDone,
  onLikeClick,
  onLoadRepliesOfReply,
  onLoadMoreComments,
  onLoadMoreReplies,
  onPreviewClick = () => {},
  onReplySubmit,
  onRewardCommentEdit,
  parent,
  rootContent,
  showSecretButtonAvailable,
  subject,
  style,
  theme,
  userId
}) {
  const { banned, profileTheme } = useKeyContext((v) => v.myState);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(theme || profileTheme);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const uploadComment = useAppContext((v) => v.requestHelpers.uploadComment);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const rootContentState = useContentState({
    contentType: rootContent?.contentType,
    contentId: rootContent?.id
  });
  const onClearCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onClearCommentFileUploadProgress
  );
  const onUpdateCommentFileUploadProgress = useContentContext(
    (v) => v.actions.onUpdateCommentFileUploadProgress
  );
  const [deleting, setDeleting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [prevComments, setPrevComments] = useState(comments);
  const ContainerRef = useRef(null);
  const CommentInputAreaRef = useRef(null);
  const CommentRefs = {};
  const pinnedCommentId = useMemo(() => {
    if (parent.contentType === 'comment') {
      return rootContentState?.pinnedCommentId;
    }
    return parent.pinnedCommentId;
  }, [
    parent.contentType,
    parent.pinnedCommentId,
    rootContentState?.pinnedCommentId
  ]);
  const parentHasSecretMessage = useMemo(
    () => !!parent.secretAnswer || !!parent.secretAttachment,
    [parent.secretAnswer, parent.secretAttachment]
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
        const lastCommentLocation = inputAtBottom ? 0 : comments.length - 1;
        const lastCommentId = comments[lastCommentLocation]
          ? comments[lastCommentLocation].id
          : 'undefined';
        try {
          const data = await loadComments({
            contentId: parent.contentId,
            contentType: parent.contentType,
            lastCommentId,
            limit: commentsLoadLimit,
            parentHasSecretMessage
          });
          onLoadMoreComments({
            ...data,
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
    loadComments,
    loadMoreButtonColor,
    onLoadMoreComments,
    parent.contentId,
    parent.contentType,
    parentHasSecretMessage
  ]);

  const handleFileUpload = useCallback(
    async ({
      attachment,
      commentContent,
      contentType,
      contentId,
      filePath,
      file,
      rootCommentId,
      subjectId,
      targetCommentId,
      isReply
    }) => {
      if (banned?.posting) {
        return;
      }
      const finalContentType = targetCommentId
        ? 'comment'
        : subjectId
        ? 'subject'
        : contentType;
      const finalContentId = targetCommentId || subjectId || contentId;
      try {
        setCommentSubmitted(true);
        const promises = [];
        promises.push(
          uploadFile({
            filePath,
            file,
            onUploadProgress: handleUploadProgress
          })
        );
        let thumbUrl = '';
        if (attachment.thumbnail) {
          promises.push(
            (async () => {
              const file = returnImageFileFromUrl({
                imageUrl: attachment.thumbnail
              });
              const thumbUrl = await uploadThumb({
                file,
                path: uuidv1()
              });
              return Promise.resolve(thumbUrl);
            })()
          );
        }
        const result = await Promise.all(promises);
        if (attachment.thumbnail) {
          thumbUrl = result[result.length - 1];
        }
        const { comment } = await uploadComment({
          content: commentContent,
          parent,
          rootCommentId,
          subjectId,
          targetCommentId,
          attachment,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          thumbUrl
        });
        if (isReply) {
          onReplySubmit({
            ...comment,
            contentId: parent.contentId,
            contentType: parent.contentType
          });
        } else {
          onCommentSubmit({
            ...comment,
            contentId: targetCommentId || parent.contentId,
            contentType: targetCommentId ? 'comment' : parent.contentType
          });
        }
        onClearCommentFileUploadProgress({
          contentType: finalContentType,
          contentId: finalContentId
        });
        onEnterComment({
          contentType: finalContentType,
          contentId: finalContentId,
          text: ''
        });
        return Promise.resolve();
      } catch (error) {
        console.error(error);
      }
      function handleUploadProgress({ loaded, total }) {
        onUpdateCommentFileUploadProgress({
          contentType: finalContentType,
          contentId: finalContentId,
          progress: loaded / total
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banned?.posting, onCommentSubmit, onReplySubmit, parent]
  );

  const renderInputArea = useCallback(
    (style) => {
      return (
        <CommentInputArea
          autoFocus={autoFocus}
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
          subjectId={subject?.id}
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
          setCommentSubmitted(true);
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
        }
      }

      async function handleViewSecretAnswer() {
        try {
          setCommentSubmitted(true);
          const { comment } = await uploadComment({
            content: 'viewed the secret message',
            parent,
            subjectId:
              parent.contentType === 'subject' ? parent.contentId : subject?.id,
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
      subject?.id,
      subject?.rewardLevel,
      theme
    ]
  );

  const handleSubmitReply = useCallback(
    async ({ content, rootCommentId, targetCommentId }) => {
      if (banned?.posting) {
        return;
      }
      setCommentSubmitted(true);
      const { comment } = await uploadComment({
        content,
        parent,
        rootCommentId,
        targetCommentId
      });
      onReplySubmit({
        ...comment,
        contentId: parent.contentId,
        contentType: parent.contentType
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banned?.posting, onReplySubmit, parent]
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      setDeleting(true);
      await deleteContent({ id: commentId, contentType: 'comment' });
      onDelete(commentId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDelete]
  );

  useEffect(() => {
    if (comments.length < prevComments.length && deleting) {
      setDeleting(false);
      if (comments.length === 0) {
        scrollElementToCenter(ContainerRef.current);
      } else if (
        comments[comments.length - 1].id !==
        prevComments[prevComments.length - 1].id
      ) {
        scrollElementToCenter(CommentRefs[comments[comments.length - 1].id]);
      }
    }
    if (
      inputAtBottom &&
      commentSubmitted &&
      comments.length > prevComments.length &&
      (prevComments.length === 0 ||
        comments[comments.length - 1].id >
          prevComments[prevComments.length - 1].id)
    ) {
      setCommentSubmitted(false);
      scrollElementToCenter(CommentRefs[comments[comments.length - 1].id]);
    }
    if (
      !inputAtBottom &&
      commentSubmitted &&
      comments.length > prevComments.length &&
      (prevComments.length === 0 || comments[0].id > prevComments[0].id)
    ) {
      setCommentSubmitted(false);
      scrollElementToCenter(CommentRefs[comments[0].id]);
    }
    setPrevComments(comments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  useEffect(() => {
    if (!autoExpand && !commentSubmitted && autoFocus && commentsShown) {
      scrollElementToCenter(CommentInputAreaRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsShown]);
  const previewComments = useMemo(
    () =>
      numPreviews > 0 && !commentsShown
        ? comments.filter((comment, index) => index < numPreviews)
        : [],
    [comments, commentsShown, numPreviews]
  );
  const isPreview = useMemo(
    () => previewComments.length > 0,
    [previewComments.length]
  );

  return (
    <Context.Provider
      value={{
        onDelete: handleDeleteComment,
        onEditDone,
        onLikeClick,
        onLoadMoreReplies,
        onRewardCommentEdit,
        onReplySubmit: handleSubmitReply,
        onLoadRepliesOfReply,
        onSubmitWithAttachment: handleFileUpload
      }}
    >
      <div
        className={`${
          isPreview && !(commentsShown || autoExpand)
            ? css`
                &:hover {
                  background: ${Color.highlightGray()};
                }
                @media (max-width: ${mobileMaxWidth}) {
                  &:hover {
                    background: #fff;
                  }
                }
              `
            : ''
        } ${className}`}
        style={style}
        ref={ContainerRef}
        onClick={isPreview ? onPreviewClick : () => {}}
      >
        {!inputAtBottom &&
          !noInput &&
          (commentsShown || autoExpand) &&
          renderInputArea()}
        {(commentsShown || autoExpand || numPreviews > 0) && !commentsHidden && (
          <div
            style={{
              width: '100%'
            }}
          >
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
            {inputAtBottom && loadMoreButton && renderLoadMoreButton()}
            {!isLoading &&
              (isPreview ? previewComments : comments).map((comment) => (
                <Comment
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
            {!inputAtBottom && loadMoreButton && renderLoadMoreButton()}
          </div>
        )}
        {inputAtBottom &&
          !noInput &&
          (commentsShown || autoExpand) &&
          renderInputArea({ marginTop: comments.length > 0 ? '1rem' : 0 })}
      </div>
    </Context.Provider>
  );
}

export default memo(Comments);
