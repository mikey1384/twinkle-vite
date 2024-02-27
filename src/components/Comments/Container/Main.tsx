import React, { useCallback, useState } from 'react';
import Comment from './Comment';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import PinnedComment from './PinnedComment';
import CommentInputArea from './CommentInputArea';
import { useAppContext } from '~/contexts';
import { Content } from '~/types';

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
  pinnedCommentId,
  previewComments,
  showSecretButtonAvailable,
  subject,
  subjectId,
  theme,
  uploadComment,
  rootContent
}: {
  autoExpand?: boolean;
  autoFocus?: boolean;
  banned?: {
    posting?: boolean;
  };
  CommentInputAreaRef?: React.RefObject<any>;
  CommentRefs: Record<string, React.RefObject<any>>;
  comments: any[];
  commentsHidden?: boolean;
  commentsShown?: boolean;
  commentsLoadLimit?: number;
  disableReason?: string;
  inputAtBottom?: boolean;
  inputAreaInnerRef?: React.RefObject<any>;
  inputTypeLabel: string;
  isLoading?: boolean;
  isPreview?: boolean;
  isSubjectPannelComments?: boolean;
  loadMoreShown?: boolean;
  loadMoreButtonColor?: string;
  noInput?: boolean;
  numInputRows?: number;
  numPreviews?: number;
  onCommentSubmit: (comment: any) => void;
  onLoadMoreComments: (data: any) => void;
  onSetCommentSubmitted: (comment: any) => void;
  parent: Content;
  pinnedCommentId?: number;
  previewComments?: any[];
  showSecretButtonAvailable?: boolean;
  subject?: any;
  subjectId?: number;
  theme?: string;
  uploadComment: (comment: any) => any;
  rootContent?: Content;
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);

  const renderInputArea = useCallback(
    (style?: React.CSSProperties) => {
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
            showSecretButtonAvailable ? handleViewSecretAnswer : undefined
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
        const lastCommentLocation = inputAtBottom ? 0 : comments.length - 1;
        const lastCommentId = comments[lastCommentLocation]
          ? comments[lastCommentLocation].id
          : null;
        try {
          const data = await loadComments({
            contentId: parent.contentId,
            contentType: parent.contentType,
            lastCommentId,
            limit: commentsLoadLimit,
            isRepliesOfReply: false
          });
          onLoadMoreComments({
            ...data,
            isRepliesOfReply: false,
            contentId: parent.contentId,
            contentType: parent.contentType
          });
        } catch (error: any) {
          console.error(error.response || error);
        } finally {
          setIsLoadingMore(false);
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
      {(commentsShown || autoExpand || (numPreviews || 0) > 0) &&
      !commentsHidden ? (
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
                theme={theme}
              />
            )}
          {inputAtBottom && loadMoreShown && renderLoadMoreButton()}
          {!isLoading &&
            (isPreview ? previewComments : comments)?.map((comment) => (
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
              />
            ))}
          {!inputAtBottom && loadMoreShown && renderLoadMoreButton()}
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
  }: {
    content: string;
    rootCommentId?: number | null;
    subjectId?: number;
    targetCommentId?: number | null;
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
